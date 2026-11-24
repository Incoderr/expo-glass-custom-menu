package expo.modules.glassviewandroid

private const val Common = """
uniform shader content;
uniform float2 origin;
uniform float2 center;
uniform float2 halfSize;
uniform float radius;
uniform float density;

float roundedBox(float2 p, float2 b, float r) {
    float2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float2 boxNormal(float2 p, float2 b, float r) {
    float e = 0.5;
    float dx = roundedBox(p + float2(e, 0.0), b, r) - roundedBox(p - float2(e, 0.0), b, r);
    float dy = roundedBox(p + float2(0.0, e), b, r) - roundedBox(p - float2(0.0, e), b, r);
    float2 g = float2(dx, dy);
    return g / max(length(g), 0.0001);
}

half3 saturateColor(half3 c, float s) {
    float l = dot(float3(c), float3(0.2126, 0.7152, 0.0722));
    return half3(mix(float3(l), float3(c), s));
}

half3 sampleDispersed(float2 at, float2 shift, float spread) {
    half r = content.eval(at - shift * (1.0 + spread)).r;
    half g = content.eval(at - shift).g;
    half b = content.eval(at - shift * (1.0 - spread)).b;
    return half3(r, g, b);
}
"""

internal const val SurfaceShader = Common + """
uniform float4 tint;
uniform float saturation;
uniform float bendHeight;
uniform float bendAmount;
uniform float rim;
uniform float dark;

half4 main(float2 coord) {
    float2 p = coord + origin - center;
    float d = roundedBox(p, halfSize, radius);
    float coverage = clamp(0.5 - d, 0.0, 1.0);
    if (coverage <= 0.0) return half4(0.0);

    float depth = -d;
    float2 n = boxNormal(p, halfSize, radius);
    float edge = clamp(1.0 - depth / bendHeight, 0.0, 1.0);
    float bend = edge * edge * (3.0 - 2.0 * edge);
    float2 shift = n * bendAmount * bend;
    half3 c = sampleDispersed(coord, shift, 0.08 * bend);
    c = saturateColor(c, saturation);
    c = mix(c, half3(tint.rgb), half(tint.a));

    float2 light = normalize(float2(-0.55, -0.85));
    float facing = dot(n, light);
    float lip = clamp(1.0 - depth / (1.6 * density), 0.0, 1.0);
    float sheen = clamp(1.0 - depth / (7.0 * density), 0.0, 1.0);
    float glint = lip * (0.35 + 0.65 * abs(facing)) * rim;
    float glow = sheen * sheen * 0.10 * rim * (0.5 + 0.5 * abs(facing));
    c += half3(glint * (dark > 0.5 ? 0.55 : 0.85) + glow);

    float topLight = clamp(1.0 - (p.y + halfSize.y) / (halfSize.y * 2.0), 0.0, 1.0);
    c += half3(topLight * topLight * 0.05);

    return half4(c * half(coverage), half(coverage));
}
"""

internal const val LensShader = Common + """
uniform float magnify;
uniform float bendHeight;
uniform float bendAmount;
uniform float opacity;
uniform float4 tint;

half4 main(float2 coord) {
    float2 p = coord + origin - center;
    float d = roundedBox(p, halfSize, radius);
    float coverage = clamp(0.5 - d, 0.0, 1.0) * opacity;
    if (coverage <= 0.0) return half4(0.0);

    float depth = -d;
    float2 n = boxNormal(p, halfSize, radius);
    float edge = clamp(1.0 - depth / bendHeight, 0.0, 1.0);
    float bend = edge * edge * edge;
    float2 zoomed = center - origin + p / magnify;
    float2 shift = n * bendAmount * bend;
    half3 c = sampleDispersed(zoomed, shift, 0.18 * bend);
    c = mix(c, half3(tint.rgb), half(tint.a));

    float2 light = normalize(float2(-0.6, -0.8));
    float facing = dot(n, light);
    float lip = clamp(1.0 - depth / (1.4 * density), 0.0, 1.0);
    float inner = clamp(1.0 - depth / (5.0 * density), 0.0, 1.0);
    c += half3(lip * (0.45 + 0.55 * abs(facing)) * 0.9);
    c += half3(inner * inner * 0.12 * max(facing, 0.0));
    c -= half3(inner * inner * 0.10 * max(-facing, 0.0));

    return half4(c * half(coverage), half(coverage));
}
"""
