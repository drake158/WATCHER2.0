# Module & UI Contracts: Visualizador de Audio Y2K (WATHCER 2.0)

**Feature**: `001-y2k-audio-visualizer`
**Date**: 2026-10-29

Al ser una aplicación 100% cliente sin backend (Principio I), los contratos del sistema definen las interfaces públicas entre los 4 módulos desacoplados (`WebAudioEngine`, `WebGLShaderEngine`, `QueueManager`, `UIShellY2K`) y las variables uniformes del pipeline GLSL.

---

## 1. Contrato de `WebAudioEngine` (`src/audio/WebAudioEngine.js`)

```javascript
/**
 * Gestiona el AudioContext, AnalyserNode, detección de beat y señal sintética de respaldo.
 */
export class WebAudioEngine {
  /**
   * @param {Object} [options]
   * @param {number} [options.fftSize=512]
   * @param {AudioContext} [options.audioContext] - Inyectable para smoke tests
   */
  constructor(options = {}) {}

  /** Inicializa o reanuda el AudioContext tras interacción del usuario o en smoke test */
  async init() {}

  /** Carga una URL de objeto (ObjectURL) en el elemento de audio interno y opcionalmente inicia reproducción */
  async loadTrackUrl(objectUrl, autoPlay = true) {}

  /** Controles de transporte */
  async play() {}
  pause() {}

  /** Ajusta el multiplicador de sensibilidad al beat [0.1 - 2.0] */
  setBeatSensitivity(value) {}

  /**
   * Extrae el fotograma acústico actual (real si está reproduciendo, o sintético si está en modo idle/demo).
   * @param {number} timeSeconds - Tiempo acumulado en segundos
   * @returns {AudioAnalysisFrame}
   */
  getAnalysisFrame(timeSeconds) {}
}
```

---

## 2. Contrato de `WebGLShaderEngine` (`src/visualizer/WebGLShaderEngine.js`)

```javascript
/**
 * Gestiona el contexto WebGL, los framebuffers ping-pong (FBO_A / FBO_B) y los shaders GLSL.
 */
export class WebGLShaderEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [options]
   * @param {WebGLRenderingContext} [options.gl] - Inyectable para smoke tests
   */
  constructor(canvas, options = {}) {}

  /** Inicializa shaders, geometría fullscreen quad, texturas de audio y FBOs ping-pong */
  init() {}

  /** Ajusta dimensiones del viewport y recrea texturas FBO al redimensionar ventana */
  resize(width, height) {}

  /** Actualiza el estado de preset visual (mode, paletteIndex, crtEnabled) */
  setVisualState(partialState) {}

  /**
   * Ejecuta una pasada de renderizado:
   * 1. Actualiza textura 256x2 con frequencyData y timeDomainData.
   * 2. Renderiza al FBO destino leyendo el FBO previo (feedback loop + warp grid + modo activo).
   * 3. Renderiza a pantalla con palette cycling y efecto CRT opcional.
   * 4. Intercambia FBO_A y FBO_B.
   * @param {AudioAnalysisFrame} audioFrame
   * @param {number} timeSeconds
   */
  renderFrame(audioFrame, timeSeconds) {}
}
```

### Contrato de Uniforms GLSL (Pass 1: Feedback & Geometry / Pass 2: Post-Process)

| Uniform | Tipo GLSL | Descripción |
|---------|-----------|-------------|
| `u_prevFrame` | `sampler2D` | Textura del framebuffer del fotograma anterior (ping-pong feedback) |
| `u_audioData` | `sampler2D` | Textura `256x2` (`y=0.25`: FFT frecuencias, `y=0.75`: forma de onda TimeDomain) |
| `u_resolution` | `vec2` | Dimensiones actuales del canvas en píxeles |
| `u_time` | `float` | Tiempo acumulado en segundos |
| `u_bass` | `float` | Energía de graves `[0.0, 1.0]` para deformación de cuadrícula (*warp grid*) |
| `u_mid` | `float` | Energía de medios `[0.0, 1.0]` |
| `u_high` | `float` | Energía de agudos `[0.0, 1.0]` |
| `u_beatPulse` | `float` | Pulso de impacto rítmico `[0.0, 1.0]` |
| `u_mode` | `int` | `0`: *Warp Tunnel*, `1`: *Oscilloscope Matrix*, `2`: *Plasma Feedback* |
| `u_palette` | `int` | Índice de paleta cromática Y2K (`0..3`) |
| `u_crtEnabled` | `bool` / `int` | `1` activa scanlines/curvatura CRT, `0` desactiva |

---

## 3. Contrato de `QueueManager` (`src/queue/QueueManager.js`)

```javascript
/**
 * Administra la cola de reproducción local (File API / ObjectURL) y el orden de pistas.
 */
export class QueueManager {
  /**
   * @param {Object} callbacks
   * @param {(track: Track | null) => void} callbacks.onTrackChange
   * @param {(state: PlaylistQueue) => void} callbacks.onQueueUpdate
   */
  constructor(callbacks = {}) {}

  /** Filtra archivos válidos (.mp3, .wav, .ogg), crea ObjectURLs y los añade a la cola */
  addFiles(fileList) {}

  /** Selecciona y activa una pista por su índice */
  selectTrack(index) {}

  /** Avanza a la siguiente pista (respetando loopQueue) */
  nextTrack() {}

  /** Retrocede a la pista anterior */
  prevTrack() {}

  /** Reordena una pista de fromIndex a toIndex sin cortar la reproducción actual */
  reorderTrack(fromIndex, toIndex) {}

  /** Activa/desactiva el bucle automático de cola */
  setLoopQueue(enabled) {}

  /** Libera ObjectURLs registrados */
  dispose() {}
}
```

---

## 4. Contrato de `UIShellY2K` (`src/ui/UIShellY2K.js`)

- **Auto-Hide HUD Contract (`FR-001`)**:
  - El contenedor de paneles `.y2k-hud` inicia visible brevemente al cargar o cuando no hay pistas cargadas y el usuario mueve el cursor.
  - Al detectar `mousemove`, `mousedown`, `touchstart` o `keydown` en `window`, se añade la clase `.y2k-hud--visible` y se reinicia un temporizador de `2500 ms`.
  - Si transcurren `2500 ms` sin movimiento y el cursor no está haciendo `:hover` activo sobre un panel interactivo, se remueve `.y2k-hud--visible` (`opacity: 0; pointer-events: none`), dejando el `<canvas>` al 100% del viewport libre de superposiciones.
- **Persistencia Local (`FR-005`)**:
  - Todo cambio en selector de modo, paleta, slider de sensibilidad al beat, botón CRT o botón Loop actualiza inmediatamente el motor correspondiente y guarda el JSON en `localStorage.getItem('wathcer_y2k_prefs_v1')`.
