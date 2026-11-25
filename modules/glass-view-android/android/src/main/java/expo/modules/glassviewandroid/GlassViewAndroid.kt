package expo.modules.glassviewandroid

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import android.view.Choreographer
import android.view.View
import android.view.ViewGroup
import androidx.annotation.RequiresApi
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

class GlassViewAndroid(context: Context, appContext: AppContext) :
  ExpoView(context, appContext),
  Choreographer.FrameCallback {

  private val density = resources.displayMetrics.density
  private val supportsGlass = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

  internal var cornerRadiusDp: Float? = null
    set(value) { field = value; refresh() }
  internal var blurDp = 3f
    set(value) { field = value; refresh() }
  internal var saturation = 1.5f
    set(value) { field = value; refresh() }
  internal var refraction = 1f
    set(value) { field = value; refresh() }
  internal var rim = 1f
    set(value) { field = value; refresh() }
  internal var dark = true
    set(value) { field = value; refresh() }
  internal var live = false
    set(value) { field = value; schedule() }
  internal var tint = floatArrayOf(0f, 0f, 0f, .25f)
    set(value) { field = value; refresh() }
  internal var lensTint = floatArrayOf(1f, 1f, 1f, .04f)
    set(value) { field = value; refresh() }
  internal var restColor = floatArrayOf(1f, 1f, 1f, .14f)
    set(value) { field = value; refresh() }
  internal var lensRadiusDp: Float? = null
    set(value) { field = value; refresh() }
  internal var lensMagnify = 1.2f
  internal var lensPressedScale = 1.25f

  private var hasLens = false
  private val lensX = GlassSpring(0f, 520f, 34f)
  private val lensY = GlassSpring(0f, 520f, 34f)
  private val lensW = GlassSpring(0f, 420f, 30f)
  private val lensH = GlassSpring(0f, 420f, 30f)
  private val press = GlassSpring(0f, 300f, 22f)
  private val wobble = GlassSpring(0f, 180f, 9f)

  private var shaders: Any? = null
  private val surface: Any? = if (supportsGlass) RenderNode("Glass.surface") else null
  private val children: Any? = if (supportsGlass) RenderNode("Glass.children") else null
  private val lens: Any? = if (supportsGlass) RenderNode("Glass.lens") else null

  private val fallbackPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val restPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val rect = RectF()
  private val lensRect = RectF()
  private var framePending = false
  private var lastFrame = 0L

  init {
    setWillNotDraw(false)
    clipChildren = false
    clipToPadding = false
  }

  internal fun setLensFrame(frame: List<Float>?) {
    if (frame == null || frame.size < 4) {
      hasLens = false
      invalidate()
      return
    }
    val x = frame[0] * density
    val y = frame[1] * density
    val w = frame[2] * density
    val h = frame[3] * density
    if (!hasLens) {
      lensX.snap(x + w / 2f)
      lensY.snap(y + h / 2f)
      lensW.snap(w)
      lensH.snap(h)
      hasLens = true
    } else {
      lensX.target = x + w / 2f
      lensY.target = y + h / 2f
      lensW.target = w
      lensH.target = h
    }
    schedule()
  }

  internal fun setLensPressed(pressed: Boolean) {
    val target = if (pressed) 1f else 0f
    if (press.target == target) return
    press.target = target
    kick(if (pressed) .25f else -.35f)
    schedule()
  }

  private fun kick(amount: Float) {
    wobble.snap(amount)
  }

  private var overlay: GlassOverlay? = null

  private fun refresh() {
    invalidate()
    overlay?.invalidate()
  }

  override fun invalidate() {
    super.invalidate()
    overlay?.invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val root = rootView as? ViewGroup
    if (supportsGlass && root != null) overlay = GlassOverlay.obtain(root).also { it.register(this) }
    schedule()
  }

  override fun onDetachedFromWindow() {
    overlay?.unregister(this)
    overlay = null
    Choreographer.getInstance().removeFrameCallback(this)
    framePending = false
    if (supportsGlass) release()
    super.onDetachedFromWindow()
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun release() {
    (surface as RenderNode).discardDisplayList()
    (children as RenderNode).discardDisplayList()
    (lens as RenderNode).discardDisplayList()
  }

  private fun animating() =
    live || !(lensX.settled && lensY.settled && lensW.settled && lensH.settled && press.settled && wobble.settled)

  private fun schedule() {
    invalidate()
    if (framePending || !isAttachedToWindow) return
    if (!animating()) return
    framePending = true
    lastFrame = 0L
    Choreographer.getInstance().postFrameCallback(this)
  }

  override fun doFrame(frameTimeNanos: Long) {
    framePending = false
    val dt = if (lastFrame == 0L) 1f / 60f else ((frameTimeNanos - lastFrame) / 1e9f).coerceIn(0f, 1f / 20f)
    lastFrame = frameTimeNanos
    lensX.step(dt)
    lensY.step(dt)
    lensW.step(dt)
    lensH.step(dt)
    press.step(dt)
    wobble.step(dt)
    invalidate()
    if (animating() && isAttachedToWindow) {
      framePending = true
      Choreographer.getInstance().postFrameCallback(this)
    }
  }

  // The overlay draws outside the view hierarchy, so ancestor opacity has to be applied by hand.
  internal fun effectiveAlpha(): Float {
    var result = 1f
    var current: View? = this
    while (current != null) {
      result *= current.alpha
      current = current.parent as? View
    }
    return result
  }

  private fun radiusPx(w: Float, h: Float): Float =
    min(cornerRadiusDp?.let { it * density } ?: (min(w, h) / 2f), min(w, h) / 2f)

  private fun computeLens(out: RectF) {
    val p = press.value.coerceIn(0f, 1.2f)
    val stretch = min(abs(lensX.velocity) / (900f * density), 1f) * (1f - p * .4f)
    val scale = 1f + (lensPressedScale - 1f) * p
    val squash = wobble.value
    val w = lensW.value * scale * (1f + stretch * .28f + squash * .12f)
    val h = lensH.value * scale * (1f - stretch * .14f - squash * .10f)
    out.set(lensX.value - w / 2f, lensY.value - h / 2f, lensX.value + w / 2f, lensY.value + h / 2f)
  }

  override fun draw(canvas: Canvas) {
    if (GlassOverlay.capturing) return
    super.draw(canvas)
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (overlay?.ready == true && canvas.isHardwareAccelerated) return
    val w = width.toFloat()
    val h = height.toFloat()
    if (w <= 0f || h <= 0f) return
    drawFallback(canvas, w, h)
  }

  private fun drawFallback(canvas: Canvas, w: Float, h: Float) {
    val r = radiusPx(w, h)
    rect.set(0f, 0f, w, h)
    fallbackPaint.color = if (dark) Color.argb(200, 30, 30, 34) else Color.argb(210, 245, 245, 247)
    canvas.drawRoundRect(rect, r, r, fallbackPaint)
    drawRest(canvas)
    super.dispatchDraw(canvas)
  }

  private fun drawRest(canvas: Canvas) {
    if (!hasLens) return
    val alpha = (1f - press.value).coerceIn(0f, 1f) * restColor[3]
    if (alpha <= .001f) return
    computeLens(lensRect)
    val lr = lensRadius(lensRect)
    restPaint.color = Color.argb(alpha, restColor[0], restColor[1], restColor[2])
    canvas.drawRoundRect(lensRect, lr, lr, restPaint)
  }

  private fun lensRadius(r: RectF): Float =
    min(lensRadiusDp?.let { it * density } ?: (min(r.width(), r.height()) / 2f), min(r.width(), r.height()) / 2f)

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  internal fun render(canvas: Canvas, back: RenderNode, x: Float, y: Float, opacity: Float) {
    val w = width.toFloat()
    val h = height.toFloat()
    val s = (shaders as? Shaders) ?: Shaders().also { shaders = it }
    val m = ((max(blurDp, 4f) * 3f + 40f) * density).toInt()
    val margin = m.toFloat()
    val nodeW = width + m * 2
    val nodeH = height + m * 2

    val radius = radiusPx(w, h)
    val minSide = min(w, h)
    val shader = s.surface
    shader.setFloatUniform("origin", -margin, -margin)
    shader.setFloatUniform("center", w / 2f, h / 2f)
    shader.setFloatUniform("halfSize", w / 2f, h / 2f)
    shader.setFloatUniform("radius", radius)
    shader.setFloatUniform("density", density)
    shader.setFloatUniform("tint", tint[0], tint[1], tint[2], tint[3])
    shader.setFloatUniform("saturation", saturation)
    shader.setFloatUniform("bendHeight", min(minSide * .42f, 22f * density))
    shader.setFloatUniform("bendAmount", -min(minSide * .35f, 18f * density) * refraction)
    shader.setFloatUniform("rim", rim)
    shader.setFloatUniform("dark", if (dark) 1f else 0f)

    val blur = max(blurDp * density, .01f)
    val surf = surface as RenderNode
    surf.setPosition(-m, -m, width + m, height + m)
    surf.alpha = opacity
    surf.setRenderEffect(
      RenderEffect.createChainEffect(
        RenderEffect.createRuntimeShaderEffect(shader, "content"),
        RenderEffect.createBlurEffect(blur, blur, Shader.TileMode.CLAMP),
      ),
    )
    val surfRec = surf.beginRecording(nodeW, nodeH)
    surfRec.translate(margin - x, margin - y)
    surfRec.drawRenderNode(back)
    surf.endRecording()
    canvas.drawRenderNode(surf)

    val kids = children as RenderNode
    kids.setPosition(0, 0, width, height)
    kids.alpha = opacity
    val kidsRec = kids.beginRecording(width, height)
    drawRest(kidsRec)
    super.dispatchDraw(kidsRec)
    kids.endRecording()
    canvas.drawRenderNode(kids)

    val p = press.value.coerceIn(0f, 1f)
    if (!hasLens || p <= .002f) return
    computeLens(lensRect)
    val lr = lensRadius(lensRect)
    val ls = s.lens
    val lensMin = min(lensRect.width(), lensRect.height())
    ls.setFloatUniform("origin", -margin, -margin)
    ls.setFloatUniform("center", lensRect.centerX(), lensRect.centerY())
    ls.setFloatUniform("halfSize", lensRect.width() / 2f, lensRect.height() / 2f)
    ls.setFloatUniform("radius", lr)
    ls.setFloatUniform("density", density)
    ls.setFloatUniform("magnify", 1f + (lensMagnify - 1f) * p)
    ls.setFloatUniform("bendHeight", lensMin * .38f)
    ls.setFloatUniform("bendAmount", -lensMin * .30f * refraction)
    ls.setFloatUniform("opacity", p)
    ls.setFloatUniform("tint", lensTint[0], lensTint[1], lensTint[2], lensTint[3])

    val ln = lens as RenderNode
    ln.setPosition(-m, -m, width + m, height + m)
    ln.alpha = opacity
    ln.setRenderEffect(RenderEffect.createRuntimeShaderEffect(ls, "content"))
    val lensRec = ln.beginRecording(nodeW, nodeH)
    lensRec.translate(margin - x, margin - y)
    lensRec.drawRenderNode(back)
    lensRec.translate(x, y)
    lensRec.drawRenderNode(surf)
    lensRec.drawRenderNode(kids)
    ln.endRecording()
    canvas.drawRenderNode(ln)
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private class Shaders {
    val surface = RuntimeShader(SurfaceShader)
    val lens = RuntimeShader(LensShader)
  }

}
