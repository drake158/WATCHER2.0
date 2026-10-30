---

description: "Task list for Visualizador de Audio Y2K (WATHCER 2.0) implementation"
---

# Tasks: Visualizador de Audio Y2K (WATHCER 2.0)

**Input**: Design documents from `/specs/001-y2k-audio-visualizer/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/module-interfaces.md](./contracts/module-interfaces.md)

**Tests**: Incluye exclusivamente la suite mínima de 2 *smoke tests* en `tests/smoke.test.js` exigida por el Principio IV de la Constitución (`FR-010`): 1 test de inicialización de `AudioContext` y 1 test de soporte/compilación del pipeline `WebGL`.

**Organization**: Las tareas están agrupadas por historia de usuario (`US1`, `US2`, `US3`) y alineadas con los checkpoints de commits atómicos de Git definidos en el plan técnico.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias en tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece la tarea (`[US1]`, `[US2]`, `[US3]`)
- Todas las tareas incluyen rutas de archivo exactas y las restricciones literales de `data-model.md`

## Path Conventions

- **Single project (Vite Vanilla ES Modules)**: `index.html`, `vite.config.js`, `package.json`, `src/` y `tests/` en la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto Vite sin dependencias de runtime, estructura de directorios y configuración de rutas relativas para GitHub Pages.

- [ ] T001 Create project directory structure (`src/audio/`, `src/visualizer/shaders/`, `src/queue/`, `src/ui/styles/`, `src/state/`, `tests/`) and initialize `package.json` with zero runtime dependencies (`"dependencies": {}`) and devDependencies (`vite`, `vitest`, `jsdom`) in `package.json`
- [ ] T002 [P] Configure Vite for 100% static relative asset paths (`base: './'`, `build.outDir: 'dist'`) and Vitest test environment (`environment: 'jsdom'`) in `vite.config.js`
- [ ] T003 [P] Create base HTML5 document shell with full-viewport `<canvas id="visualizer-canvas">` and root Y2K HUD overlay container `<div id="y2k-hud" class="y2k-hud">` in `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura base de estado persistente, arnés de los 2 *smoke tests* constitucionales y estilos base del viewport.

**⚠️ CRITICAL**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [ ] T004 [P] Implement `PreferencesStore` managing `VisualPresetState` persistence under `localStorage` key `wathcer_y2k_prefs_v1` with verbatim constraints (`mode`: `'warp_tunnel' | 'oscilloscope_matrix' | 'plasma_feedback'` default `'warp_tunnel'`, `paletteIndex`: `0, 1, 2, 3` default `0 (Cyber Cyan/Magenta/Neon)`, `beatSensitivity`: `Rango continuo [0.1, 2.0]` default `1.0`, `crtEnabled`: `true | false` default `true`, `loopQueue`: `true | false` default `true`) in `src/state/PreferencesStore.js`
- [ ] T005 [P] Create minimal smoke test suite with exactly 2 integration smoke tests (Test 1: `WebAudioEngine` `AudioContext` instantiation and synthetic `AudioAnalysisFrame` extraction; Test 2: `WebGLShaderEngine` WebGL context support, shader compilation, and ping-pong FBO initialization) in `tests/smoke.test.js`
- [ ] T006 [P] Create foundational layout and Y2K CSS variables (100vw x 100vh canvas reset, metallic bevel borders, cyan/magenta/neon color tokens, and `.y2k-hud` / `.y2k-hud--visible` auto-hide transitions) in `src/ui/styles/y2k-theme.css`
- [ ] T007 Commit Checkpoint 1 (`chore: setup vite config, preferences store and minimal smoke test harness`) via Git using `.gitignore` and `package.json`

**Checkpoint**: Infraestructura lista — la implementación de historias de usuario puede comenzar.

---

## Phase 3: User Story 1 - Carga de Audio Local y Visualización Reactiva Principal (Priority: P1) 🎯 MVP

**Goal**: Reproducir audio local (o señal sintética en reposo) y renderizar en tiempo real sobre el lienzo al 100% del viewport un bucle de retroalimentación (*ping-pong feedback loop*) con deformación de cuadrícula (*warp grid*) reactiva a FFT, forma de onda y *beat detection*, acompañado de paneles Y2K con auto-ocultamiento al dejar quieto el cursor.

**Independent Test**: Abrir la aplicación o ejecutar `npm test`; verificar que el lienzo ocupa el 100% del viewport con animación reactiva en modo Demo/Idle, que al cargar un archivo MP3/WAV/OGG y pulsar Play el shader responde en tiempo real a los graves/medios/agudos y *beats*, y que los paneles se ocultan automáticamente tras 2.5 segundos de inactividad del cursor.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Implement `WebAudioEngine` (`init`, `loadTrackUrl`, `play`, `pause`, `setBeatSensitivity`, `getAnalysisFrame`) producing `AudioAnalysisFrame` with verbatim constraints (`frequencyData`: `Uint8Array` of `256 elementos (0..255)`, `timeDomainData`: `Uint8Array` of `256 elementos (0..255, centro 128)`, `bassEnergy`: `Normalizado [0.0, 1.0]`, `midEnergy`: `Normalizado [0.0, 1.0]`, `highEnergy`: `Normalizado [0.0, 1.0]`, `beatPulse`: `Normalizado [0.0, 1.0]`, `isSynthetic`: `true | false`) in `src/audio/WebAudioEngine.js`
- [ ] T009 [US1] Verify Smoke Test 1 (`AudioContext` initialization and simulated signal analysis) passes and create Git Checkpoint 2 (`feat(audio): implement WebAudioEngine with FFT, beat detection and demo signal`) in `src/audio/WebAudioEngine.js`
- [ ] T010 [P] [US1] Create shared fullscreen quad vertex shader (`a_position`, `v_uv`) in `src/visualizer/shaders/fullscreen.vert.js`
- [ ] T011 [P] [US1] Implement Pass 1 fragment shader with ping-pong feedback sampling (`u_prevFrame`), continuous rotation/zoom decay, bass-reactive warp grid deformation (`u_bass`, `u_beatPulse`), and base *Warp Tunnel* geometry (`u_mode == 0`) in `src/visualizer/shaders/feedback.frag.js`
- [ ] T012 [P] [US1] Implement Pass 2 post-processing fragment shader with base Y2K palette mapping (`u_palette`) and screen output in `src/visualizer/shaders/postprocess.frag.js`
- [ ] T013 [US1] Implement `WebGLShaderEngine` managing WebGL context, `256x2` audio data texture (`u_audioData`), ping-pong framebuffers (`FBO_A` and `FBO_B`), viewport `resize(width, height)`, and two-pass `renderFrame(audioFrame, timeSeconds)` (verifying Smoke Test 2 passes for MVP pipeline) in `src/visualizer/WebGLShaderEngine.js`
- [ ] T014 [US1] Implement core `UIShellY2K` with single/multi local audio file input (`accept=".mp3,.wav,.ogg,audio/*"`), Play/Pause transport button, and cursor inactivity auto-hide controller (`2500 ms` timeout toggling `.y2k-hud--visible` on `mousemove`/`mousedown`/`keydown`) in `src/ui/UIShellY2K.js`
- [ ] T015 [US1] Wire `WebAudioEngine`, `WebGLShaderEngine`, `PreferencesStore`, and `UIShellY2K` inside the 60 FPS `requestAnimationFrame` loop and window resize handler in `src/main.js`

**Checkpoint**: User Story 1 es completamente funcional y verificable de manera independiente como MVP.

---

## Phase 4: User Story 2 - Personalización en Vivo de Presets, Paletas y Sensibilidad (Priority: P2)

**Goal**: Permitir al usuario alternar en vivo entre los 3 modos gráficos (*Warp Tunnel*, *Oscilloscope Matrix*, *Plasma Feedback*), 4 paletas cromáticas Y2K, sensibilidad al *beat* y efecto de monitor CRT/scanlines, persistiendo cada cambio en `localStorage`.

**Independent Test**: Cambiar el selector de modo visual, la paleta cromática, el control deslizante de sensibilidad al *beat* y el botón CRT durante la reproducción activa; comprobar que el cambio visual es instantáneo sin interrumpir el audio y que al recargar la página se conservan las opciones elegidas.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Extend Pass 1 fragment shader to implement *Oscilloscope Matrix* (`u_mode == 1` with time-domain waveform matrix tracing from `u_audioData` at `y = 0.75`) and *Plasma Feedback* (`u_mode == 2` with organic interference fields and intense ping-pong feedback) in `src/visualizer/shaders/feedback.frag.js`
- [ ] T017 [P] [US2] Extend Pass 2 fragment shader to implement 4 Y2K neon palettes (*palette cycling* for `u_palette` values `0, 1, 2, 3`) and optional CRT scanline/vignette curvature filter (`u_crtEnabled`) in `src/visualizer/shaders/postprocess.frag.js`
- [ ] T018 [US2] Verify Smoke Test 2 (WebGL pipeline & multi-mode shader compilation) passes and create Git Checkpoint 3 (`feat(visualizer): implement WebGLShaderEngine with ping-pong FBOs and Y2K GLSL shaders`) in `src/visualizer/WebGLShaderEngine.js`
- [ ] T019 [US2] Add interactive Y2K controls to `UIShellY2K` for visual mode selector (`'warp_tunnel' | 'oscilloscope_matrix' | 'plasma_feedback'`), palette selector (`0..3`), beat sensitivity slider (`[0.1, 2.0]`), and CRT scanline toggle (`crtEnabled`), syncing live changes with `WebGLShaderEngine`, `WebAudioEngine`, and `PreferencesStore` in `src/ui/UIShellY2K.js`
- [ ] T020 [P] [US2] Style Y2K preset selectors, custom beveled range slider, LCD status readouts, and optional CSS/canvas CRT frame accents in `src/ui/styles/y2k-theme.css`

**Checkpoint**: User Stories 1 y 2 funcionan de forma integrada e independiente.

---

## Phase 5: User Story 3 - Gestión de Cola de Reproducción (Playlist Reordenable) y Controles Multimedia (Priority: P3)

**Goal**: Soportar selección y arrastre de múltiples archivos de audio locales (MP3, WAV, OGG), cola de reproducción interactiva con indicador de pista activa, salto anterior/siguiente, avance automático con bucle configurable (`loopQueue`) y reordenamiento de pistas mediante *drag & drop*.

**Independent Test**: Cargar 3 o más archivos de audio locales simultáneamente, arrastrar una pista para cambiar su orden en la lista sin cortar la canción actual, usar los botones Anterior/Siguiente y verificar que al terminar la última pista la cola vuelve a la primera cuando el bucle está activo.

### Implementation for User Story 3

- [ ] T021 [US3] Implement `QueueManager` managing `Track` entities (`id`: `Único por sesión (crypto.randomUUID() o contador incremental)`, `name`: `No vacío; nombre del archivo sin ruta`, `mimeType`: `audio/mpeg, audio/wav, audio/ogg (o extensión .mp3, .wav, .ogg)`, `objectUrl`: `Generado con URL.createObjectURL(file)`, `fileSize`: `> 0 (bytes)`) and `PlaylistQueue` state (`tracks`: `Lista ordenada mutable mediante selección múltiple o Drag & Drop`, `currentIndex`: `-1 si tracks está vacío; 0 <= currentIndex < tracks.length cuando hay pista activa`, `playbackState`: `'idle' | 'playing' | 'paused'`, `loopQueue`: `boolean` default `true`, plus `URL.revokeObjectURL` cleanup in `dispose()`) in `src/queue/QueueManager.js`
- [ ] T022 [US3] Create Git Checkpoint 4 (`feat(queue): implement local audio QueueManager with drag-and-drop reordering and loop`) after validating `QueueManager` state transitions in `src/queue/QueueManager.js`
- [ ] T023 [US3] Extend `UIShellY2K` with Winamp/WMP7-inspired playlist panel supporting window-wide file Drag & Drop ingestion, active track highlight, Previous/Next track buttons, Loop Queue toggle button, and native HTML5 Drag & Drop track list reordering (`dragstart`, `dragover`, `drop`) in `src/ui/UIShellY2K.js`
- [ ] T024 [P] [US3] Add Y2K playlist scrollbox styles, active track LED indicator, drag-over drop target highlights, and invalid file toast notification styles in `src/ui/styles/y2k-theme.css`
- [ ] T025 [US3] Connect `QueueManager` callbacks (`onTrackChange`, `onQueueUpdate`) and `<audio>` `ended` event auto-advance to `WebAudioEngine`, `PreferencesStore`, and `UIShellY2K` in `src/main.js`

**Checkpoint**: Todas las historias de usuario (`US1`, `US2`, `US3`) están completas y son verificables de forma independiente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validación final de smoke tests, compilación estática para GitHub Pages y último checkpoint de Git.

- [ ] T026 Run full smoke test suite (`npm test`) and production static build (`npm run build`) to verify zero errors and 100% relative asset paths (`./assets/...`) in `dist/index.html`
- [ ] T027 Create final Git Checkpoint 5 (`feat(ui): implement Y2K UI shell with auto-hide HUD, CRT toggle and full integration`) committing all remaining UI, integration, and build readiness changes in `src/main.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — comienza de inmediato (`T001` → `T002`, `T003`).
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEA** todas las historias de usuario (`T004`–`T007`).
- **User Story 1 (Phase 3 - P1 MVP)**: Depende de Phase 2 (`T008`–`T015`).
- **User Story 2 (Phase 4 - P2)**: Depende del pipeline base de `US1` (`T016`–`T020`).
- **User Story 3 (Phase 5 - P3)**: `QueueManager` (`T021`) puede desarrollarse en paralelo tras Phase 2; la integración UI (`T023`–`T025`) se conecta sobre `UIShellY2K` y `src/main.js`.
- **Polish (Phase 6)**: Depende de completar `US1`, `US2` y `US3` (`T026`–`T027`).

### User Story Dependencies

- **User Story 1 (P1)**: Independiente tras completar la fase Foundational. Entrega el MVP completo (visualizador reactivo a pantalla completa + reproducción local + auto-hide HUD).
- **User Story 2 (P2)**: Extiende los shaders y controles de `US1` agregando los modos *Oscilloscope Matrix* y *Plasma Feedback*, las 4 paletas Y2K, sensibilidad al *beat* y filtro CRT persistente.
- **User Story 3 (P3)**: Agrega la cola de reproducción multi-archivo (`QueueManager`), avance automático con bucle y reordenamiento *drag & drop* sin interrumpir el motor visual ni el audio.

### Parallel Opportunities

- **Phase 1**: `T002` (`vite.config.js`) y `T003` (`index.html`) pueden ejecutarse en paralelo tras `T001`.
- **Phase 2**: `T004` (`PreferencesStore.js`), `T005` (`tests/smoke.test.js`) y `T006` (`y2k-theme.css`) operan sobre archivos independientes y pueden ejecutarse en paralelo.
- **Phase 3 (`US1`)**: `T008` (`WebAudioEngine.js`), `T010` (`fullscreen.vert.js`), `T011` (`feedback.frag.js`) y `T012` (`postprocess.frag.js`) pueden ejecutarse en paralelo antes de ensamblar `WebGLShaderEngine.js` (`T013`).
- **Phase 4 (`US2`)**: `T016` (`feedback.frag.js`), `T017` (`postprocess.frag.js`) y `T020` (`y2k-theme.css`) pueden ejecutarse en paralelo.
- **Phase 5 (`US3`)**: `T021` (`QueueManager.js`) y `T024` (`y2k-theme.css`) pueden ejecutarse en paralelo antes de conectar los eventos en `UIShellY2K.js` (`T023`).

---

## Parallel Example: User Story 1

```bash
# Ejecutar en paralelo el motor de audio y los shaders GLSL base de User Story 1:
Task T008: "Implement WebAudioEngine in src/audio/WebAudioEngine.js"
Task T010: "Create shared fullscreen quad vertex shader in src/visualizer/shaders/fullscreen.vert.js"
Task T011: "Implement Pass 1 fragment shader in src/visualizer/shaders/feedback.frag.js"
Task T012: "Implement Pass 2 post-processing fragment shader in src/visualizer/shaders/postprocess.frag.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar **Phase 1: Setup** (`T001`–`T003`).
2. Completar **Phase 2: Foundational** (`T004`–`T007`) y registrar el **Checkpoint 1 de Git**.
3. Completar **Phase 3: User Story 1** (`T008`–`T015`), validando el Smoke Test 1 y registrando el **Checkpoint 2 de Git**.
4. **STOP & VALIDATE**: Probar `US1` independientemente con audio local y en modo Demo/Idle.

### Incremental Delivery & Git Checkpoints

1. **Checkpoint 1** (`T007`): Infraestructura Vite + `PreferencesStore` + arnés de Smoke Tests.
2. **Checkpoint 2** (`T009`): `WebAudioEngine` + Smoke Test 1 aprobado.
3. **Checkpoint 3** (`T018`): `WebGLShaderEngine` + 3 modos GLSL + 4 paletas + CRT + Smoke Test 2 aprobado.
4. **Checkpoint 4** (`T022`): `QueueManager` con gestión `ObjectURL`, bucle y reordenamiento.
5. **Checkpoint 5** (`T027`): `UIShellY2K` completo + integración final + build estático verificado para GitHub Pages.
