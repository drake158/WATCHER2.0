# Research & Technical Decisions: Visualizador de Audio Y2K (WATHCER 2.0)

**Feature**: `001-y2k-audio-visualizer`
**Date**: 2026-10-29

## 1. Empaquetado y Arquitectura Cliente (Vite + Vanilla ES Modules)

- **Decision**: Utilizar **Vite** con **Vanilla JavaScript (ES2022+ Modules)**, HTML5 y CSS3 nativo (`base: './'` en `vite.config.js`), sin frameworks reactivos pesados (sin React/Vue/Three.js).
- **Rationale**:
  - Permite importar archivos de shaders `.glsl` como strings puros (`?raw`) o módulos modulares manteniendo 0 dependencias en tiempo de ejecución (`dependencies: {}`).
  - Genera un bundle estático limpio en `./dist` con rutas 100% relativas listo para GitHub Pages (Principio I de la Constitución).
  - Evita la sobrecarga de reconciliación de DOM virtual durante el bucle `requestAnimationFrame` a 60 FPS.
- **Alternatives considered**:
  - *Three.js / PixiJS*: Descartados por añadir >150 KB minificados innecesarios cuando el pipeline consta únicamente de un quad de pantalla completa con ping-pong framebuffers en WebGL puro.
  - *HTML/JS sin bundler*: Funcional, pero Vite facilita el servidor de desarrollo, la carga de shaders y el runner de smoke tests (`vitest`) con configuración mínima.

## 2. Pipeline WebGL de Ping-Pong Framebuffers (Render-to-Texture Feedback Loop)

- **Decision**: Implementar un motor WebGL 1.0/2.0 basado en dos Framebuffer Objects (`FBO_A` y `FBO_B`) intercambiados en cada fotograma (*ping-pong*), combinados con una textura 1D/2D de datos acústicos (`u_audioTexture` de `256x2` bytes: fila 0 para FFT de frecuencias y fila 1 para TimeDomain/onda).
- **Rationale**:
  - El *ping-pong* permite que el fragment shader lea el fotograma anterior (`u_prevFrame`), aplique deformación espacial (*warp grid* modulada por energía de graves `u_bass`), rotación/zoom continuo y factor de decaimiento (`decay`), y mezcle encima la geometría activa (*Warp Tunnel*, *Oscilloscope Matrix* o *Plasma Feedback*).
  - En la pasada final a pantalla, se aplica el mapeo de paleta cromática (*palette cycling* cian/magenta/neón) y el post-procesado opcional de monitor CRT (*scanlines* y curvatura sutil).
  - Subir los arrays `Uint8Array` de FFT y forma de onda mediante `gl.texSubImage2D` en una textura `256x2` `LUMINANCE` / `R8` es drásticamente más eficiente que enviar cientos de `uniform` escalares por fotograma.
- **Alternatives considered**:
  - *Canvas 2D `getImageData` / `drawImage`*: Descartado por cuellos de botella de CPU al realizar deformaciones no lineales (*warp grid*) y *palette cycling* en resoluciones 1080p+ a 60 FPS.

## 3. Análisis Acústico y Detección de Beat (WebAudio Engine)

- **Decision**: Construir `WebAudioEngine` sobre un único `AudioContext` conectado a un elemento `<audio>` (para pistas locales vía `URL.createObjectURL(file)`) y un nodo `AnalyserNode` (`fftSize = 512`, `smoothingTimeConstant = 0.8`), acompañado de un generador sintético de reposo (oscilador/matemático silencioso en modo Demo/Idle).
- **Rationale**:
  - `fftSize = 512` entrega 256 bins de frecuencia (`getByteFrequencyData`) y 256 muestras de dominio temporal (`getByteTimeDomainData`) con latencia inferior a 15 ms.
  - **Beat Detection Reactivo al Bajo**: Se calcula la energía instantánea de los primeros 12 bins (sub-bajo y bajo, ~20–200 Hz) y se compara contra una media móvil exponencial local multiplicada por el umbral inversamente proporcional a `beatSensitivity`. Cuando supera el umbral y el *cooldown* (~120 ms), se dispara un pulso `beatPulse` (1.0 con decaimiento exponencial por fotograma) que alimenta el zoom/warp del shader.
  - Cuando no hay pista cargada o reproducida, `WebAudioEngine` sintetiza vectores de prueba suaves en memoria para que el canvas nunca quede en negro (cumpliendo el caso borde de Modo Demo/Idle y permitiendo el smoke test de señal simulada).
- **Alternatives considered**:
  - *`decodeAudioData` completo en memoria*: Descartado para pistas largas porque consume decenas de MB de RAM por canción y retrasa el inicio de reproducción; `HTMLMediaElement` + `createMediaElementSource` inicia en <50 ms.

## 4. Gestión de Cola Local y Reordenamiento (Queue Manager)

- **Decision**: Implementar `QueueManager` en memoria utilizando la File API (`<input type="file" multiple accept=".mp3,.wav,.ogg,audio/*">` y eventos `dragover`/`drop`), gestionando referencias `ObjectURL` con liberación explícita (`URL.revokeObjectURL`) al eliminar pistas, y HTML5 Drag and Drop nativo para reordenar elementos de la playlist.
- **Rationale**:
  - Cumple con el Principio III de la Constitución y `FR-006`/`FR-007`.
  - Incluye estado de bucle de cola (`loopQueue = true` por defecto, persistido en `localStorage` junto con las preferencias visuales según la sesión de clarificación).
- **Alternatives considered**:
  - *Librerías de Drag & Drop (SortableJS)*: Descartadas por simplicidad; los eventos nativos `dragstart`, `dragover` y `drop` sobre la lista DOM de ~20 elementos requieren menos de 40 líneas de código.

## 5. UI Shell Y2K con Auto-Ocultamiento de HUD y Persistencia Local

- **Decision**: Diseñar `UIShellY2K` con estética inspirada en Winamp / Windows Media Player 7 (gradientes metálicos CSS, biseles `inset`/`outset`, fuentes monospace/pixel tech, pantallas LCD verde/cian sobre negro) superpuesta sobre un `<canvas>` fijo al `100vw x 100vh`. Un temporizador de actividad de puntero (`mousemove`, `mousedown`, `keydown`) muestra los paneles con transición suave y los oculta tras `2500 ms` de inactividad (siempre que el cursor no esté sobre un panel ni arrastrando una pista).
- **Rationale**:
  - Garantiza el cumplimiento de `FR-001` y `SC-001` (100% de viewport libre en inactividad, >80% despejado con paneles visibles).
  - La persistencia de `VisualPresetState` (`mode`, `palette`, `beatSensitivity`, `crtEnabled`, `loopQueue`) se realiza mediante un wrapper seguro de `localStorage` con fallback en memoria.
- **Alternatives considered**:
  - *Paneles estáticos permanentes*: Descartado por decisión explícita del usuario en la fase `/speckit-clarify` (Opción C).

## 6. Suite de Smoke Tests Estrictamente Mínima y Estrategia de Git

- **Decision**: Configurar **Vitest** con entorno `jsdom` (o mocks ligeros de API de navegador) para ejecutar exactamente **2 smoke tests** en `tests/smoke.test.js`:
  1. Inicialización de `WebAudioEngine` (`AudioContext`, `AnalyserNode` y extracción de buffers FFT/TimeDomain con señal simulada).
  2. Inicialización y compilación de shaders/framebuffers de `WebGLShaderEngine` sobre un contexto WebGL.
- **Rationale**:
  - Cumple estrictamente con el Principio IV de la Constitución ("Únicamente smoke tests mínimos de integración para instanciación de AudioContext y pipeline de WebGL. Cero sobrecarga de unit tests redundantes") y el punto 3 del prompt de planificación.
  - **Estrategia de Git**: Se realizarán commits atómicos tras completar cada módulo principal (1. Setup & Smoke Test Harness, 2. WebAudio Engine, 3. WebGL Shader Engine & GLSL Shaders, 4. Queue Manager, 5. Y2K UI Shell & Integration).
