package expo.modules.glassviewandroid

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GlassViewAndroidModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GlassViewAndroid")

    View(GlassViewAndroid::class) {
      Prop("cornerRadius") { view: GlassViewAndroid, value: Float? -> view.cornerRadiusDp = value }
      Prop("blurRadius") { view: GlassViewAndroid, value: Float? -> view.blurDp = value ?: 3f }
      Prop("saturation") { view: GlassViewAndroid, value: Float? -> view.saturation = value ?: 1.5f }
      Prop("refraction") { view: GlassViewAndroid, value: Float? -> view.refraction = value ?: 1f }
      Prop("rim") { view: GlassViewAndroid, value: Float? -> view.rim = value ?: 1f }
      Prop("dark") { view: GlassViewAndroid, value: Boolean? -> view.dark = value ?: true }
      Prop("live") { view: GlassViewAndroid, value: Boolean? -> view.live = value ?: false }
      Prop("tint") { view: GlassViewAndroid, value: List<Float>? -> view.tint = value.toRgba(0f, 0f, 0f, .25f) }
      Prop("lensTint") { view: GlassViewAndroid, value: List<Float>? -> view.lensTint = value.toRgba(1f, 1f, 1f, .04f) }
      Prop("restColor") { view: GlassViewAndroid, value: List<Float>? -> view.restColor = value.toRgba(1f, 1f, 1f, .14f) }
      Prop("lensFrame") { view: GlassViewAndroid, value: List<Float>? -> view.setLensFrame(value) }
      Prop("lensRadius") { view: GlassViewAndroid, value: Float? -> view.lensRadiusDp = value }
      Prop("lensPressed") { view: GlassViewAndroid, value: Boolean? -> view.setLensPressed(value ?: false) }
      Prop("lensMagnify") { view: GlassViewAndroid, value: Float? -> view.lensMagnify = value ?: 1.2f }
      Prop("lensScale") { view: GlassViewAndroid, value: Float? -> view.lensPressedScale = value ?: 1.25f }
    }
  }
}

private fun List<Float>?.toRgba(r: Float, g: Float, b: Float, a: Float): FloatArray {
  if (this == null || size < 4) return floatArrayOf(r, g, b, a)
  return floatArrayOf(this[0], this[1], this[2], this[3])
}
