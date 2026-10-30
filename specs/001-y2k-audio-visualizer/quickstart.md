# Quickstart & Validation Guide: Visualizador de Audio Y2K (WATHCER 2.0)

**Feature**: `001-y2k-audio-visualizer`
**Date**: 2026-10-29

## 1. Requisitos Previos

- **Node.js**: v18+ y `npm`.
- **Navegador Moderno**: Chrome, Edge, Firefox o Safari con soporte para WebGL y Web Audio API.

## 2. Instalación y Comandos Principales

```bash
# 1. Instalar dependencias mínimas de desarrollo (Vite + Vitest)
npm install

# 2. Ejecutar la suite mínima de Smoke Tests (AudioContext + WebGL Pipeline)
npm test

# 3. Iniciar servidor de desarrollo interactivo
npm run dev

# 4. Generar compilación estática para GitHub Pages (./dist con rutas relativas)
npm run build
```

## 3. Escenarios de Validación End-to-End

### Escenario A: Verificación Automática (Smoke Tests — `FR-010`)
1. Ejecutar `npm test` (que corre `vitest run tests/smoke.test.js`).
2. **Resultado esperado**:
   - **Test 1 (WebAudio Engine)**: Instancia `AudioContext` y `AnalyserNode`, procesa señal simulada y devuelve un `AudioAnalysisFrame` válido con arrays FFT y TimeDomain de 256 muestras.
   - **Test 2 (WebGL Shader Engine)**: Inicializa contexto WebGL, compila shaders GLSL de feedback loop + post-procesado y configura los dos framebuffers ping-pong sin errores.

### Escenario B: Protagonismo Visual y Auto-Ocultamiento de HUD (`FR-001`, `SC-001`)
1. Abrir la URL local de `npm run dev` en el navegador.
2. Observar que el canvas WebGL ocupa el **100% del viewport** con animación reactiva en modo Demo/Idle.
3. Dejar el cursor inmóvil fuera de los paneles durante ~2.5 segundos: los paneles Y2K se desvanecen por completo dejando el 100% del lienzo despejado.
4. Mover el cursor sobre la pantalla: los paneles Y2K reaparecen instantáneamente como overlays semitransparentes/cromados sin detener la animación.

### Escenario C: Presets Visuales, Paletas y Persistencia (`FR-003`, `FR-004`, `FR-005`)
1. Con los paneles visibles, alternar entre **Warp Tunnel**, **Oscilloscope Matrix** y **Plasma Feedback**.
2. Cambiar la paleta cromática Y2K, mover el deslizador de **Beat Sensitivity** y conmutar el botón **CRT Scanlines**.
3. Recargar la página (`F5`): verificar que el modo seleccionado, la paleta, la sensibilidad y el estado CRT se restauran automáticamente desde `localStorage` ([data-model.md](./data-model.md)).

### Escenario D: Carga Local Múltiple y Cola Reordenable (`FR-006`, `FR-007`)
1. Usar el botón de carga o arrastrar 3 archivos locales (`.mp3`, `.wav` u `.ogg`) sobre la ventana.
2. Verificar que la primera pista comienza a reproducirse y el bucle de retroalimentación (*ping-pong feedback loop*) y la cuadrícula (*warp grid*) pulsan al ritmo del bajo.
3. En el panel de Playlist, arrastrar la tercera pista a la primera o segunda posición: el orden se actualiza sin cortar el audio actual.
4. Verificar que al finalizar la última pista con **Loop** activo, la reproducción vuelve automáticamente a la primera pista de la cola.

### Escenario E: Compatibilidad con GitHub Pages (`FR-009`, `SC-005`)
1. Ejecutar `npm run build` y `npm run preview`.
2. Inspeccionar `dist/index.html` para confirmar que todas las referencias a scripts y hojas de estilo utilizan rutas relativas (`./assets/...`).
