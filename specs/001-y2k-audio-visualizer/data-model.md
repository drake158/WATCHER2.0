# Data Model: Visualizador de Audio Y2K (WATHCER 2.0)

**Feature**: `001-y2k-audio-visualizer`
**Date**: 2026-10-29

## 1. Entidades Principales

### 1.1 `Track` (Pista de Audio Local)
Representa un archivo de audio cargado desde el sistema de archivos local del usuario durante la sesión activa.

| Campo | Tipo | Restricciones / Reglas de Validación | Descripción |
|-------|------|--------------------------------------|-------------|
| `id` | `string` | Único por sesión (`crypto.randomUUID()` o contador incremental) | Identificador inmutable de la pista en la cola |
| `name` | `string` | No vacío; nombre del archivo sin ruta | Título visible en el panel de playlist Y2K |
| `mimeType` | `string` | `audio/mpeg`, `audio/wav`, `audio/ogg` (o extensión `.mp3`, `.wav`, `.ogg`) | Tipo de archivo validado al ingresar |
| `objectUrl` | `string` | Generado con `URL.createObjectURL(file)` | URL local en memoria asignada al elemento `<audio>` |
| `fileSize` | `number` | `> 0` (bytes) | Tamaño del archivo para validación básica |

**Ciclo de vida**:
- **Creación**: Al seleccionar o soltar archivos válidos en la interfaz (`FR-006`). Archivos con formato no soportado o tamaño `0` son rechazados sin bloquear la cola.
- **Destrucción**: Al eliminar la pista o limpiar la cola, se invoca `URL.revokeObjectURL(track.objectUrl)` para evitar fugas de memoria (Principio III).

---

### 1.2 `PlaylistQueue` (Estado de la Cola de Reproducción)
Gestiona la colección ordenada de pistas y el estado de transporte multimedia.

| Campo | Tipo | Valor Inicial | Reglas de Validación / Comportamiento |
|-------|------|---------------|---------------------------------------|
| `tracks` | `Track[]` | `[]` | Lista ordenada mutable mediante selección múltiple o Drag & Drop |
| `currentIndex` | `number` | `-1` | `-1` si `tracks` está vacío; `0 <= currentIndex < tracks.length` cuando hay pista activa |
| `playbackState` | `'idle' \| 'playing' \| 'paused'` | `'idle'` | En `'idle'`, el motor de audio entrega señal sintética de demostración |
| `loopQueue` | `boolean` | `true` | Cuando es `true`, al finalizar la última pista (`currentIndex === tracks.length - 1`) salta automáticamente a `0`. Si es `false`, pasa a `'idle'` al terminar la última pista |

**Transiciones de Estado**:
1. `idle` → `playing`: Usuario carga pistas y presiona Play o selecciona una pista de la cola.
2. `playing` → `paused`: Usuario presiona Pause.
3. `paused` → `playing`: Usuario presiona Play.
4. `playing` (fin de pista `i`):
   - Si `i + 1 < tracks.length` → reproduce `i + 1`.
   - Si `i + 1 === tracks.length` y `loopQueue === true` → reproduce `0`.
   - Si `i + 1 === tracks.length` y `loopQueue === false` → cambia a `idle` (modo Demo visual).
5. **Reordenamiento (`reorder(fromIndex, toIndex)`)**: Actualiza el arreglo `tracks` y recalcula `currentIndex` para que la pista actualmente en reproducción conserve su posición lógica sin interrumpir el audio (`SC-004`).

---

### 1.3 `VisualPresetState` (Estado Visual y Preferencias Persistidas)
Configuración interactiva del motor WebGL y de la interfaz Y2K, sincronizada con `localStorage` bajo la clave `wathcer_y2k_prefs_v1`.

| Campo | Tipo | Valores Permitidos | Valor por Defecto | Descripción |
|-------|------|--------------------|-------------------|-------------|
| `mode` | `'warp_tunnel' \| 'oscilloscope_matrix' \| 'plasma_feedback'` | 3 modos canónicos (`FR-004`) | `'warp_tunnel'` | Algoritmo geométrico y de deformación activo en el shader |
| `paletteIndex` | `number` | `0`, `1`, `2`, `3` | `0` (Cyber Cyan/Magenta/Neon) | Índice de paleta cromática Y2K para *palette cycling* |
| `beatSensitivity` | `number` | Rango continuo `[0.1, 2.0]` | `1.0` | Multiplicador de sensibilidad del detector de pulsos graves |
| `crtEnabled` | `boolean` | `true \| false` | `true` | Activa/desactiva la máscara de scanlines y viñeta CRT |
| `loopQueue` | `boolean` | `true \| false` | `true` | Preferencia de repetición automática de la cola |

---

### 1.4 `AudioAnalysisFrame` (Datos Acústicos por Fotograma)
Estructura de transferencia en tiempo real generada en cada ciclo (`requestAnimationFrame`) por `WebAudioEngine` y consumida por `WebGLShaderEngine`.

| Campo | Tipo | Dimensiones / Rango | Descripción |
|-------|------|---------------------|-------------|
| `frequencyData` | `Uint8Array` | `256` elementos (`0..255`) | Espectro FFT de frecuencias desde `AnalyserNode.getByteFrequencyData` |
| `timeDomainData` | `Uint8Array` | `256` elementos (`0..255`, centro `128`) | Forma de onda temporal desde `AnalyserNode.getByteTimeDomainData` |
| `bassEnergy` | `number` | Normalizado `[0.0, 1.0]` | Energía promedio en la banda sub-bajo/bajo (bins 0–11) |
| `midEnergy` | `number` | Normalizado `[0.0, 1.0]` | Energía promedio en banda media (bins 12–95) |
| `highEnergy` | `number` | Normalizado `[0.0, 1.0]` | Energía promedio en banda aguda (bins 96–255) |
| `beatPulse` | `number` | Normalizado `[0.0, 1.0]` | Pulso instantáneo disparado al detectar un beat con decaimiento exponencial suave |
| `isSynthetic` | `boolean` | `true \| false` | Indica si los datos provienen del generador de reposo (Demo/Idle) o de audio real |
