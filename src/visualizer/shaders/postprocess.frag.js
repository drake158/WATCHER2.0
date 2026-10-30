/**
 * Pass 2 Post-Processing Fragment Shader:
 * - Palette Cycling Y2K reactivo al espectro y beat (4 paletas cromáticas de alto contraste)
 * - Filtro opcional de monitor CRT (scanlines horizontales, curvatura sutil y viñeta)
 */
export const POSTPROCESS_FRAGMENT_SHADER = `
precision mediump float;

varying vec2 v_uv;

uniform sampler2D u_prevFrame;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_bass;
uniform float u_beatPulse;
uniform int u_palette;
uniform int u_crtEnabled;

vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 applyY2KPalette(float energy, float phase, int paletteIndex) {
  float t = energy + phase;
  if (paletteIndex == 0) {
    // Paleta 0: Cyber Cyan / Magenta / Neon Green (Default Y2K)
    return cosinePalette(
      t,
      vec3(0.45, 0.52, 0.65),
      vec3(0.55, 0.48, 0.55),
      vec3(1.0, 1.0, 1.0),
      vec3(0.00, 0.33, 0.67)
    );
  } else if (paletteIndex == 1) {
    // Paleta 1: Winamp Acid Matrix (Verde Fosforescente / Cian / Oro)
    return cosinePalette(
      t,
      vec3(0.20, 0.60, 0.30),
      vec3(0.45, 0.50, 0.35),
      vec3(1.0, 0.8, 0.6),
      vec3(0.15, 0.45, 0.70)
    );
  } else if (paletteIndex == 2) {
    // Paleta 2: Hyper-Chrome Ultraviolet (Violeta / Rosa Neón / Plata)
    return cosinePalette(
      t,
      vec3(0.52, 0.35, 0.68),
      vec3(0.48, 0.45, 0.42),
      vec3(1.0, 1.0, 0.8),
      vec3(0.65, 0.15, 0.40)
    );
  } else {
    // Paleta 3: Solar Overdrive (Ámbar / Magenta / Azul Eléctrico)
    return cosinePalette(
      t,
      vec3(0.58, 0.42, 0.38),
      vec3(0.48, 0.44, 0.52),
      vec3(1.0, 0.9, 1.0),
      vec3(0.05, 0.25, 0.82)
    );
  }
}

void main() {
  vec2 uv = v_uv;

  // Curvatura CRT opcional sutil
  if (u_crtEnabled == 1) {
    vec2 centered = uv * 2.0 - 1.0;
    centered *= 1.0 + dot(centered, centered) * 0.035;
    uv = centered * 0.5 + 0.5;
  }

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.01, 0.01, 0.03, 1.0);
    return;
  }

  vec3 raw = texture2D(u_prevFrame, uv).rgb;
  float luminance = dot(raw, vec3(0.299, 0.587, 0.114));
  float cyclePhase = u_time * 0.08 + u_bass * 0.22 + u_beatPulse * 0.18;

  vec3 palColor = applyY2KPalette(luminance * 1.35, cyclePhase, u_palette);
  vec3 finalColor = mix(raw, palColor * (luminance * 1.45 + 0.06), 0.72);

  // Destello en impactos de beat
  finalColor += palColor * u_beatPulse * luminance * 0.28;

  if (u_crtEnabled == 1) {
    float scanline = 0.88 + 0.12 * sin(uv.y * u_resolution.y * 1.4);
    float vignette = smoothstep(1.25, 0.35, length(uv * 2.0 - 1.0));
    finalColor *= scanline * vignette;
  }

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;
