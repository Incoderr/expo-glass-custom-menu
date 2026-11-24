package expo.modules.glassviewandroid

internal class GlassSpring(
  var value: Float,
  private val stiffness: Float,
  private val damping: Float,
) {
  var target = value
  var velocity = 0f
    private set

  val settled get() = kotlin.math.abs(target - value) < 0.05f && kotlin.math.abs(velocity) < 0.05f

  fun snap(to: Float) {
    value = to
    target = to
    velocity = 0f
  }

  fun step(dt: Float) {
    var remaining = dt
    while (remaining > 0f) {
      val h = minOf(remaining, 1f / 240f)
      val force = stiffness * (target - value) - damping * velocity
      velocity += force * h
      value += velocity * h
      remaining -= h
    }
    if (settled) snap(target)
  }
}
