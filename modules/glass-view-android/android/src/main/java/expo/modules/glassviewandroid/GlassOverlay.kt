package expo.modules.glassviewandroid

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.RenderNode
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import androidx.annotation.RequiresApi
import java.util.WeakHashMap

internal class GlassOverlay private constructor(
  context: Context,
  private val root: ViewGroup,
) : View(context), ViewTreeObserver.OnPreDrawListener {
  private val views = ArrayList<GlassViewAndroid>()
  private val supportsGlass = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
  private val backdrop: Any? = if (supportsGlass) RenderNode("GlassView.backdrop") else null
  private val location = IntArray(2)
  private val own = IntArray(2)

  init {
    setWillNotDraw(false)
    isClickable = false
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  val ready get() = supportsGlass && parent != null

  fun register(view: GlassViewAndroid) {
    if (view !in views) views.add(view)
    invalidate()
  }

  fun unregister(view: GlassViewAndroid) {
    views.remove(view)
    if (views.isEmpty()) {
      root.post {
        if (views.isEmpty()) {
          overlays.remove(root)
          root.removeView(this)
        }
      }
    } else {
      invalidate()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(this)
    for (view in views) view.invalidate()
  }

  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnPreDrawListener(this)
    super.onDetachedFromWindow()
  }

  override fun onPreDraw(): Boolean {
    for (index in 0 until root.childCount) {
      val child = root.getChildAt(index)
      if (child !== this && child.isDirty) {
        invalidate()
        break
      }
    }
    return true
  }

  override fun onDraw(canvas: Canvas) {
    if (capturing || !supportsGlass || !canvas.isHardwareAccelerated) return
    drawGlass(canvas)
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun drawGlass(canvas: Canvas) {
    val node = backdrop as RenderNode
    node.setPosition(0, 0, width, height)
    val recording = node.beginRecording(width, height)
    recording.drawColor(if (views.firstOrNull()?.dark != false) Color.BLACK else Color.WHITE)
    capturing = true
    try {
      root.background?.draw(recording)
      for (index in 0 until root.childCount) {
        val child = root.getChildAt(index)
        if (child !== this && child.visibility == VISIBLE && child.id != android.R.id.statusBarBackground &&
          child.id != android.R.id.navigationBarBackground
        ) child.draw(recording)
      }
    } finally {
      capturing = false
    }
    node.endRecording()

    getLocationInWindow(own)
    for (view in views) {
      if (!view.isShown || view.width == 0 || view.height == 0) continue
      view.getLocationInWindow(location)
      val x = (location[0] - own[0]).toFloat()
      val y = (location[1] - own[1]).toFloat()
      val save = canvas.save()
      canvas.translate(x, y)
      view.render(canvas, node, x, y)
      canvas.restoreToCount(save)
    }
  }

  companion object {
    @JvmStatic
    internal var capturing = false

    private val overlays = WeakHashMap<ViewGroup, GlassOverlay>()

    fun obtain(root: ViewGroup): GlassOverlay = overlays.getOrPut(root) {
      GlassOverlay(root.context, root).also { overlay ->
        root.post {
          if (overlay.parent == null && overlay.views.isNotEmpty()) {
            root.addView(overlay, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
            for (view in overlay.views) view.invalidate()
          }
        }
      }
    }
  }
}
