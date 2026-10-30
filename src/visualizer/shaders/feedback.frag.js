/**
 * Pass 1 Fragment Shader: Ping-Pong Feedback Loop + Bass-Reactive Warp Grid + 3 Visual Presets:
 * - u_mode == 0: Warp Tunnel (túnel geométrico con deformación de cuadrícula y profundidad reactiva)
 * - u_mode == 1: Oscilloscope Matrix (trazado de onda temporal sobre matriz reactiva con persistencia)
 * - u_mode == 2: Plasma Feedback (campos cromáticos orgánicos con retroalimentación intensa)
 */
export const FEEDBACK_FRAGMENT_SHADER = `
precision mediump float;

varying vec2 v_uv;

uniform sampler2D u_prevFrame;
uniform sampler2D u_audioData;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_bass;
uniform float u_mid;
uniform float u_high;
uniform float u_beatPulse;
uniform int u_mode;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = v_uv;
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  // --- 1. Deformación de cuadrícula (Warp Grid) reactiva a graves y beat ---
  float zoom = 0.975 - u_bass * 0.032 - u_beatPulse * 0.028;
  float rotAngle = (0.008 + u_mid * 0.022) * sin(u_time * 0.45);
  vec2 warpedCentered = rotate2d(rotAngle) * ((uv - 0.5) * zoom);

  vec2 gridWarp = vec2(
    sin(warpedCentered.y * 12.0 + u_time * 2.4) * (0.004 + u_bass * 0.014),
    cos(warpedCentered.x * 12.0 - u_time * 2.1) * (0.004 + u_bass * 0.014)
  );

  vec2 feedbackUv = clamp(warpedCentered + 0.5 + gridWarp, 0.002, 0.998);
  vec4 prevColor = texture2D(u_prevFrame, feedbackUv);

  // Muestras de FFT (y = 0.25) y TimeDomain Waveform (y = 0.75)
  float radius = length(p);
  float angle = atan(p.y, p.x);
  float fftCoord = clamp(radius * 0.65, 0.0, 1.0);
  float fftSample = texture2D(u_audioData, vec2(fftCoord, 0.25)).r;
  float waveSample = texture2D(u_audioData, vec2(uv.x, 0.75)).r * 2.0 - 1.0;

  vec3 freshLayer = vec3(0.0);
  float decay = 0.91;

  if (u_mode == 0) {
    // MODO 0: WARP TUNNEL (Cuadrícula polar deformada por FFT y Beat)
    float tunnelDepth = 1.0 / max(radius + 0.08, 0.08);
    vec2 tunnelUv = vec2(
      angle / 3.14159265 + u_time * 0.15,
      tunnelDepth * 0.35 - u_time * (0.8 + u_bass * 0.6)
    );
    tunnelUv += 0.12 * vec2(sin(tunnelUv.y * 4.0 + u_time), cos(tunnelUv.x * 6.0));
    vec2 gridLines = abs(fract(tunnelUv * 6.0) - 0.5);
    float wire = smoothstep(0.08 + u_beatPulse * 0.06, 0.01, min(gridLines.x, gridLines.y));
    float ring = smoothstep(0.05, 0.0, abs(radius - (0.22 + fftSample * 0.38 + u_beatPulse * 0.12)));

    freshLayer = vec3(
      wire * (0.4 + u_bass * 0.8) + ring * 0.9,
      wire * (0.7 + u_mid * 0.6) + fftSample * 0.35,
      wire * 0.95 + ring * (0.6 + u_high * 0.8)
    );
    decay = 0.90;
  } else if (u_mode == 1) {
    // MODO 1: OSCILLOSCOPE MATRIX (Onda temporal + matriz digital Y2K)
    float targetY = 0.5 + waveSample * (0.28 + u_bass * 0.18);
    float beamDist = abs(uv.y - targetY);
    float beam = smoothstep(0.022 + u_beatPulse * 0.015, 0.002, beamDist);
    float glow = 0.015 / max(beamDist, 0.012);

    vec2 matrixCell = fract(uv * vec2(32.0, 18.0) + vec2(0.0, u_time * 0.5));
    float matrixDot = smoothstep(0.18, 0.05, length(matrixCell - 0.5)) * fftSample * 0.55;

    freshLayer = vec3(
      beam * 0.4 + glow * 0.25 * u_bass,
      beam * 1.1 + glow * 0.45 + matrixDot * 0.9,
      beam * 0.95 + matrixDot * (0.6 + u_high)
    );
    decay = 0.88;
  } else {
    // MODO 2: PLASMA FEEDBACK (Campos de interferencia orgánica y rotación de fase)
    float v1 = sin(p.x * 7.0 + u_time * 1.7 + u_bass * 3.0);
    float v2 = cos(p.y * 7.0 - u_time * 1.4 + u_mid * 3.0);
    float v3 = sin((p.x + p.y) * 6.0 + u_time * 2.1);
    float v4 = cos(radius * 12.0 - u_time * 3.2 - fftSample * 4.0);
    float plasma = (v1 + v2 + v3 + v4) * 0.25;

    float ribbon = smoothstep(0.18, 0.0, abs(plasma - waveSample * 0.45));
    freshLayer = vec3(
      (0.5 + 0.5 * sin(plasma * 3.1415 + u_time)) * ribbon * (0.6 + u_bass),
      (0.5 + 0.5 * cos(plasma * 3.1415 - u_time * 1.3)) * ribbon * (0.7 + u_mid),
      (0.6 + 0.4 * sin(plasma * 6.283 + u_beatPulse * 2.0)) * ribbon
    );
    decay = 0.935;
  }

  vec3 combined = clamp(prevColor.rgb * decay + freshLayer * (0.62 + u_beatPulse * 0.38), 0.0, 1.0);
  gl_FragColor = vec4(combined, 1.0);
}
`;
