# Implementation Plan: Visualizador de Audio Y2K (WATHCER 2.0)

**Branch**: `001-y2k-audio-visualizer` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-y2k-audio-visualizer/spec.md`

## Summary

Implementar un visualizador de audio web con estética retro Y2K 100% cliente y compatible con GitHub Pages. La arquitectura se divide en cuatro módulos sin dependencias pesadas en tiempo de ejecución:
1. **WebAudio Engine**: Gestión de `AudioContext`, `AnalyserNode` (FFT + TimeDomain), detector de impactos rítmicos en frecuencias graves (*beat detection*) y generador sintético para modo Demo/Idle.
2. **WebGL Shader Engine**: Motor gráfico acelerado por GPU con *render-to-texture ping-pong framebuffers* para efectos de retroalimentación (*feedback loops*), deformación de cuadrícula (*warp grid*) reactiva al bajo, tres modos visuales (*Warp Tunnel*, *Oscilloscope Matrix*, *Plasma Feedback*) y rotación de paletas cromáticas (*palette cycling*).
3. **Queue Manager**: Gestor de cola de reproducción para múltiples archivos locales (`File API` / `ObjectURL` en formatos MP3, WAV y OGG) con soporte de reordenamiento *drag & drop* y bucle automático de lista.
4. **UI Shell Y2K**: Interfaz cromada/biselada estilo Winamp/WMP7 superpuesta a un lienzo de pantalla completa (`100% viewport`), con auto-ocultamiento inteligente por inactividad del cursor, interruptor CRT/scanlines y persistencia local de preferencias visuales en `localStorage`.

El proyecto incluye una suite de pruebas estrictamente mínima de 2 *smoke tests* (inicialización de `AudioContext` y soporte/compilación del pipeline WebGL) y una estrategia de commits atómicos en Git tras cada módulo implementado.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES2022+ Vanilla ES Modules), GLSL ES 1.00 / 3.00

**Primary Dependencies**: Cero dependencias de runtime (`dependencies: {}`); **Vite** para empaquetado estático con `base: './'` y **Vitest** + `jsdom` exclusivamente para desarrollo/smoke testing

**Storage**: Memoria de sesión para archivos de audio locales (`File API` / `URL.createObjectURL`) y `localStorage` para persistir preferencias visuales (`VisualPresetState`)

**Testing**: Suite mínima en **Vitest** (`tests/smoke.test.js`) con exactamente 2 smoke tests de integración: (1) inicialización de `AudioContext` + análisis de señal simulada y (2) inicialización/compilación del pipeline `WebGL`

**Target Platform**: Navegadores web modernos de escritorio/portátil con soporte WebGL y Web Audio API; desplegable directamente en GitHub Pages (`./dist` con rutas relativas)

**Project Type**: Single-Page Web Application (Pure Client-Side Audio Visualizer)

**Performance Goals**: Renderizado continuo a 60 FPS (mínimo 30 FPS bajo alta carga de sombreado) y latencia de respuesta acústica/interactiva < 50 ms (`SC-002`)

**Constraints**: 100% cliente (sin backend), rutas relativas (`./`), lienzo ocupando el 100% del viewport con paneles Y2K auto-ocultables al dejar quieto el cursor (`FR-001`), cero pruebas unitarias redundantes

**Scale/Scope**: Aplicación SPA modular de 4 subsistemas principales, 3 presets de shaders GLSL, 4 paletas cromáticas Y2K y soporte fluido para colas de 20+ pistas locales por sesión

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio de la Constitución | Estado Pre-Diseño | Evaluación Técnica / Evidencia Post-Diseño | Estado Post-Diseño |
|------------------------------|-------------------|--------------------------------------------|--------------------|
| **I. Pure Client-Side** | PASS | SPA en Vanilla JS + Vite configurada con `base: './'`; sin backend ni llamadas de red externas. Salida estática en `./dist`. | PASS |
| **II. Y2K Aesthetic & Visual Engine** | PASS | Pipeline WebGL con ping-pong FBOs (`FBO_A`/`FBO_B`), *warp grid* reactivo al bajo, 3 modos GLSL, *palette cycling* y UI cromada/biselada con filtro CRT. | PASS |
| **III. Local Audio & Queue** | PASS | `QueueManager` usa `File API` + `URL.createObjectURL` / `revokeObjectURL`, soporta selección múltiple, Drag & Drop para reordenar y bucle de cola. | PASS |
| **IV. Minimal Testing** | PASS | Único archivo `tests/smoke.test.js` con 1 test de inicialización de `AudioContext` y 1 test de soporte/compilación WebGL. Cero unit tests redundantes. | PASS |
| **V. Continuous Git Commits** | PASS | Flujo de implementación estructurado con un checkpoint de `git commit` atómico al finalizar cada módulo arquitectónico. | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/001-y2k-audio-visualizer/
├── plan.md              # Este archivo (plan técnico e arquitectura)
├── research.md          # Decisiones de arquitectura, shaders y pruebas (Fase 0)
├── data-model.md        # Entidades Track, PlaylistQueue, VisualPresetState y AudioAnalysisFrame (Fase 1)
├── quickstart.md        # Guía de ejecución y validación de escenarios (Fase 1)
├── contracts/
│   └── module-interfaces.md # Contratos de los 4 módulos JS y uniforms GLSL (Fase 1)
└── tasks.md             # Lista de tareas ordenadas y checkpoints Git (/speckit-tasks)
```

### Source Code (repository root)

```text
index.html
vite.config.js
package.json
src/
├── main.js                        # Punto de entrada: orquesta bucle rAF y conecta los 4 módulos
├── state/
│   └── PreferencesStore.js        # Persistencia en localStorage para VisualPresetState
├── audio/
│   └── WebAudioEngine.js          # AudioContext, AnalyserNode (FFT/TimeDomain), beat detector y señal demo
├── visualizer/
│   ├── WebGLShaderEngine.js       # Contexto WebGL, ping-pong FBOs, textura de audio 256x2 y render loop
│   └── shaders/
│       ├── fullscreen.vert.js     # Vertex shader compartido para quad de pantalla completa
│       ├── feedback.frag.js       # Pass 1: Ping-pong feedback, warp grid y 3 modos (Tunnel/Osc/Plasma)
│       └── postprocess.frag.js    # Pass 2: Palette cycling Y2K y máscara CRT/scanlines
├── queue/
│   └── QueueManager.js            # Ingesta File API / ObjectURL, transporte, loop y Drag & Drop reorder
└── ui/
    ├── UIShellY2K.js              # Controlador DOM de paneles Y2K, eventos de controles y auto-hide HUD
    └── styles/
        └── y2k-theme.css          # Estilos cromados, biseles Winamp/WMP7, fuentes tech, CRT y transiciones HUD
tests/
└── smoke.test.js                  # Exactamente 2 smoke tests: AudioContext init + WebGL pipeline init
```

**Structure Decision**: Se selecciona una estructura SPA modular en la raíz del repositorio (`src/` dividido en `audio/`, `visualizer/`, `queue/`, `ui/` y `state/`, más `tests/smoke.test.js`). Esta disposición mantiene el aislamiento entre los 4 motores solicitados sin añadir complejidad de monorepo ni abstracciones innecesarias.

## Estrategia de Git (Checkpoints Atómicos por Módulo)

En cumplimiento del **Principio V (Continuous Git Commits)** y los requisitos del plan, la ejecución en `/speckit-tasks` y `/speckit-implement` registrará un commit atómico tras completar cada bloque:

1. **Checkpoint 1 (`chore: setup vite config and minimal smoke test harness`)**: Configuración de `package.json`, `vite.config.js` (`base: './'`) e infraestructura base.
2. **Checkpoint 2 (`feat(audio): implement WebAudioEngine with FFT, beat detection and demo signal`)**: Módulo `src/audio/WebAudioEngine.js` + Smoke Test 1 (AudioContext).
3. **Checkpoint 3 (`feat(visualizer): implement WebGLShaderEngine with ping-pong FBOs and Y2K GLSL shaders`)**: Módulo `src/visualizer/` (ping-pong buffers, warp grid, 3 presets, palette cycling) + Smoke Test 2 (WebGL).
4. **Checkpoint 4 (`feat(queue): implement local audio QueueManager with drag-and-drop reordering and loop`)**: Módulo `src/queue/QueueManager.js` y `src/state/PreferencesStore.js`.
5. **Checkpoint 5 (`feat(ui): implement Y2K UI shell with auto-hide HUD, CRT toggle and full integration`)**: Módulo `src/ui/`, `src/main.js`, estilos Y2K y verificación final de compilación para GitHub Pages.

## Complexity Tracking

> **Sin violaciones a la Constitución.** Todos los principios (I a V) se cumplen de forma directa sin excepciones.
