# Feature Specification: Visualizador de Audio Y2K (WATHCER 2.0)

**Feature Branch**: `001-y2k-audio-visualizer`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Crea la especificación base del visualizador Y2K:
- Composición de Pantalla: El canvas del visualizador domina el viewport como elemento principal (mínimo 70-80% de área visible o viewport completo con overlays Y2K semitransparentes).
- Motor de Visualización (WebGL/Canvas):
  - Análisis con Web Audio API (AnalyserNode FFT + TimeDomain).
  - Algoritmo de feedback loop (render-to-texture con atenuación y rotación/zoom continuo).
  - Selector de presets visuales / modos gráficos (Warp Tunnel, Oscilloscope Matrix, Plasma Feedback).
  - Controles interactivos para cambiar dinámicamente el modo visual, paleta cromática y sensibilidad al beat.
- Sistema de Audio y Cola:
  - Input para selección múltiple de archivos de audio locales (MP3, WAV, OGG).
  - Componente de cola de reproducción (playlist draggable/reordenable, play/pause, saltar pista, indicador de pista actual).
- UI/UX Y2K:
  - Estética retro tipo Winamp/Windows Media Player 7/QuickTime.
  - Tipografías pixel/sans tech, marcos metálicos, botones biselados y monitores CRT/scanline opcionales.
- Pruebas y despliegue:
  - Verificación mínima: carga sin errores de WebGL, decodificación de audio simulado.
  - Setup listo para GitHub Pages (carpeta ./dist o root con index.html)."

## Clarifications

### Session 2026-10-29

- Q: ¿Qué debe ocurrir cuando finaliza la última pista de la cola de reproducción? (FR-007) → A: Repetir la cola desde la primera pista automáticamente (con opción de activar/desactivar bucle en la UI).
- Q: ¿Cómo deben disponerse los paneles de la interfaz Y2K en relación con el lienzo del visualizador? (FR-001) → A: Paneles ocultos por completo que solo aparecen temporalmente al mover el cursor sobre la pantalla.
- Q: ¿Deben conservarse las preferencias visuales del usuario (modo gráfico, paleta de color, sensibilidad al beat y filtro CRT) al recargar o volver a abrir el navegador? (FR-005) → A: Persistir las preferencias visuales localmente en el navegador entre recargas y sesiones.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Carga de Audio Local y Visualización Reactiva Principal (Priority: P1)

El usuario abre el visualizador, selecciona uno o varios archivos de audio desde su dispositivo local (MP3, WAV u OGG) e inicia la reproducción. De inmediato, el lienzo visual principal (que ocupa al menos el 75-100% de la pantalla) cobra vida con gráficos generativos en bucle de retroalimentación (estelas con rotación/zoom continuo y atenuación) que reaccionan en tiempo real tanto al espectro de frecuencias como a la forma de onda y a los golpes rítmicos (beats) de la música.

**Why this priority**: Es la propuesta de valor central del producto; sin reproducción de audio local sincronizada con el lienzo visual reactivo de gran formato, el visualizador no cumple su propósito fundamental.

**Independent Test**: Puede probarse de forma independiente cargando un archivo de audio local o activando una señal de prueba, presionando reproducir y verificando que el sonido se escuche mientras el lienzo principal renderiza animaciones fluidas que responden visiblemente a los cambios de volumen, frecuencia y ritmo.

**Acceptance Scenarios**:

1. **Given** la aplicación en ejecución, **When** el usuario mantiene el cursor inactivo o lo mueve sobre la pantalla, **Then** el lienzo de visualización ocupa el 100% del área visible del viewport y los paneles de control Y2K permanecen ocultos por completo durante la inactividad, apareciendo temporalmente como overlays al detectar movimiento del cursor.
2. **Given** el selector de archivos o área de arrastre (drag & drop), **When** el usuario carga un archivo de audio válido (MP3, WAV u OGG) y pulsa "Play", **Then** el audio comienza a reproducirse inmediatamente y el motor visual reacciona en tiempo real a las frecuencias graves, medias, agudas y a la onda de sonido sin cortes ni congelamientos.
3. **Given** la reproducción activa, **When** ocurre un golpe rítmico pronunciado (beat) en la pista, **Then** el efecto de retroalimentación visual (zoom/rotación/intensidad cromática) manifiesta un pulso visual sincronizado con el impacto sonoro.

---

### User Story 2 - Personalización en Vivo de Presets, Paletas y Sensibilidad (Priority: P2)

Mientras escucha música o explora el visualizador, el usuario interactúa con los controles en pantalla para alternar dinámicamente entre distintos modos gráficos (*Warp Tunnel*, *Oscilloscope Matrix*, *Plasma Feedback*), rotar o elegir diferentes paletas de color neón/Y2K, ajustar la sensibilidad de respuesta al ritmo (beat) y activar o desactivar el efecto de monitor CRT (líneas de escaneo).

**Why this priority**: Otorga agencia creativa al usuario y multiplica el valor de rejugabilidad visual sin interrumpir la reproducción musical.

**Independent Test**: Puede probarse cambiando cada selector (modo visual, paleta, control deslizante de sensibilidad y botón CRT) durante una reproducción activa y comprobando que la transición visual ocurre al instante sin detener ni reiniciar el audio.

**Acceptance Scenarios**:

1. **Given** el visualizador en ejecución, **When** el usuario selecciona cualquiera de los tres modos gráficos principales (*Warp Tunnel*, *Oscilloscope Matrix* o *Plasma Feedback*), **Then** la geometría y el patrón de retroalimentación del lienzo cambian inmediatamente al modo elegido manteniendo la fluidez de cuadros por segundo.
2. **Given** un modo gráfico activo, **When** el usuario cambia la paleta cromática o ajusta el control de sensibilidad al beat, **Then** los colores del espectro y la intensidad de los pulsos visuales se actualizan en tiempo real reflejando la nueva configuración.
3. **Given** la interfaz retro Y2K visible tras mover el cursor, **When** el usuario activa o desactiva el interruptor de efecto CRT/Scanlines o deja de mover el cursor, **Then** la superposición de líneas de monitor retro se muestra u oculta instantáneamente y los paneles se desvanecen automáticamente tras unos segundos de inactividad dejando el lienzo 100% despejado.

---

### User Story 3 - Gestión de Cola de Reproducción (Playlist Reordenable) y Controles Multimedia (Priority: P3)

El usuario selecciona múltiples pistas de audio simultáneamente para armar una sesión musical. A través del panel de lista de reproducción de estética Y2K (inspirado en reproductores clásicos como Winamp o Windows Media Player 7), puede ver todas las pistas en cola, identificar claramente cuál está sonando, pausar/reanudar, saltar a la pista anterior o siguiente, elegir cualquier pista directamente y arrastrar elementos para reordenar la secuencia de reproducción.

**Why this priority**: Transforma una demostración visual de una sola canción en un reproductor multimedia completo para sesiones prolongadas.

**Independent Test**: Puede probarse cargando 3 o más archivos de audio, reordenando la segunda y tercera pista mediante arrastrar y soltar, utilizando los botones de siguiente/anterior y verificando el avance automático cuando termina una pista.

**Acceptance Scenarios**:

1. **Given** el selector de archivos, **When** el usuario selecciona múltiples archivos de audio (MP3, WAV, OGG) a la vez, **Then** todos los archivos válidos se agregan secuencialmente a la cola de reproducción mostrando su nombre y estado.
2. **Given** una cola con múltiples pistas, **When** el usuario arrastra una pista hacia otra posición de la lista, **Then** el orden de reproducción se actualiza inmediatamente sin interrumpir la pista que se encuentra sonando.
3. **Given** una pista en reproducción dentro de una cola, **When** la pista llega a su fin o el usuario pulsa "Siguiente", **Then** el reproductor avanza automáticamente a la siguiente pista según el orden actual de la lista y actualiza el indicador visual de pista activa.

---

### Edge Cases

- **Archivos corruptos o formatos no soportados**: Si el usuario intenta cargar o arrastrar archivos que no sean audio compatible (por ejemplo, imágenes o documentos) o archivos de audio dañados, el sistema debe omitirlos o mostrar un aviso visual breve en la interfaz sin bloquear el reproductor ni detener la cola existente.
- **Inicio sin pista cargada (Modo Demo / Idle)**: Si el usuario abre la aplicación o interactúa con los modos visuales antes de cargar un archivo de audio, el visualizador debe mostrar una animación base reactiva suave (señal sintética o pulso autónomo de reposo) para que la pantalla nunca luzca estática ni rota.
- **Redimensionamiento de ventana y pantallas de distintas proporciones**: Cuando el usuario cambia el tamaño de la ventana del navegador o pasa a pantalla completa, el lienzo principal debe reescalarse automáticamente conservando al menos el 80% de protagonismo visual sin deformar los controles ni perder el estado de reproducción.
- **Restricción de reproducción automática del navegador**: Dado que los navegadores requieren interacción previa del usuario para activar el motor de sonido, el primer clic en cualquier botón de reproducción o carga de archivo debe inicializar transparentemente el sistema de audio sin requerir pasos técnicos adicionales.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Protagonismo del Lienzo Visual y Auto-Ocultamiento de UI)**: El sistema DEBE presentar el lienzo de visualización ocupando el 100% del viewport como elemento dominante, mientras que los paneles de control Y2K (overlays semitransparentes) DEBEN permanecer ocultos por completo durante la reproducción inactiva y aparecer únicamente de forma temporal cuando el usuario mueve el cursor sobre la pantalla (permaneciendo visibles mientras el cursor interactúe con ellos).
- **FR-002 (Análisis Acústico en Tiempo Real)**: El sistema DEBE analizar en tiempo real la señal de audio activa extrayendo tanto datos de distribución de frecuencias (graves, medios, agudos) como datos de dominio temporal (forma de onda) y detección de impactos rítmicos (beats).
- **FR-003 (Bucle de Retroalimentación Visual)**: El motor visual DEBE aplicar un efecto continuo de retroalimentación (*feedback loop*) sobre la imagen generada en cada fotograma, incorporando atenuación progresiva de estelas, rotación continua, zoom dinámico y deformación espacial modulados por la música.
- **FR-004 (Modos Gráficos / Presets)**: El sistema DEBE ofrecer al menos tres modos visuales seleccionables en tiempo real:
  1. *Warp Tunnel* (túnel geométrico con deformación de cuadrícula y profundidad reactiva).
  2. *Oscilloscope Matrix* (trazado de onda temporal sobre matriz reactiva con persistencia).
  3. *Plasma Feedback* (campos cromáticos orgánicos con rotación de paleta y retroalimentación intensa).
- **FR-005 (Controles Interactivos de Visualización y Persistencia Local)**: Los usuarios DEBEN poder modificar en vivo el modo visual activo, elegir entre múltiples paletas cromáticas de alto contraste (incluyendo combinaciones cian/magenta/verde neón) y ajustar un control continuo de sensibilidad de respuesta al ritmo (beat); estas preferencias visuales (incluido el estado del filtro CRT y de repetición de cola) DEBEN persistirse localmente en el navegador y restaurarse automáticamente entre recargas y sesiones.
- **FR-006 (Carga Múltiple de Audio Local)**: El sistema DEBE permitir a los usuarios cargar múltiples archivos de audio locales simultáneamente en formatos MP3, WAV y OGG tanto mediante selector de archivos estándar como arrastrando y soltando (drag & drop) sobre la interfaz.
- **FR-007 (Gestión de Cola de Reproducción y Controles)**: El sistema DEBE proporcionar una lista de reproducción interactiva que soporte: reproducir/pausar, saltar a pista anterior/siguiente, selección directa de pista, avance automático al finalizar una canción (repitiendo la cola desde la primera pista al terminar la última por defecto, con un interruptor de bucle activable/desactivable en la interfaz), indicador visual claro de la pista activa y reordenamiento de pistas mediante arrastrar y soltar (drag & drop).
- **FR-008 (Estética e Interfaz Y2K)**: La interfaz de usuario DEBE implementar un diseño nostálgico Y2K inspirado en reproductores clásicos (Winamp, Windows Media Player 7, QuickTime), incorporando marcos con acabado metálico/cromado, bordes biselados, tipografías de estilo pixel/tecnológico y un interruptor opcional de efecto monitor CRT/scanlines.
- **FR-009 (Operación Autónoma y Portabilidad Estática)**: La aplicación DEBE funcionar íntegramente en el navegador del usuario sin depender de servidores externos ni conexión posterior a la carga inicial, utilizando rutas relativas compatibles con hospedaje estático directo.
- **FR-010 (Verificación de Integridad Inicial)**: El sistema DEBE contar con una validación automática mínima que confirme que el motor gráfico y el procesador de audio con señal simulada se inicializan sin errores críticos.

### Key Entities *(include if feature involves data)*

- **Track (Pista de Audio)**: Representa un archivo de audio local cargado por el usuario; contiene identificador único de sesión, nombre visible del archivo, formato/tipo MIME, referencia local en memoria para reproducción e indicador de si es la pista actualmente activa.
- **Playlist Queue (Cola de Reproducción)**: Colección ordenada y mutable de pistas cargadas por el usuario; mantiene el índice de reproducción actual, el estado de reproducción (reproduciendo, en pausa, en espera) y la secuencia definida por el reordenamiento del usuario.
- **Visual Preset & State (Estado y Modo Visual)**: Configuración activa del motor gráfico; agrupa el modo seleccionado (*Warp Tunnel*, *Oscilloscope Matrix*, *Plasma Feedback*), la paleta cromática activa, el nivel de sensibilidad al beat y el estado del filtro CRT/scanlines, con persistencia automática en el almacenamiento local del navegador entre sesiones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Protagonismo Visual)**: El lienzo del visualizador ocupa el 100% del área del viewport de forma ininterrumpida cuando los paneles están ocultos por inactividad del cursor, y mantiene al menos el 80% del área visible despejada cuando los overlays Y2K aparecen temporalmente al mover el cursor.
- **SC-002 (Fluidez y Reactividad en Tiempo Real)**: Las animaciones visuales mantienen una cadencia fluida objetivo de 60 cuadros por segundo (mínimo aceptable de 30 fps bajo alta carga de efectos) y reaccionan a los cambios de sonido o ajustes de controles del usuario en menos de 50 milisegundos.
- **SC-003 (Carga y Gestión de Cola Inmediata)**: El usuario puede seleccionar hasta 20 archivos de audio locales (MP3, WAV, OGG), verlos listados en la cola y comenzar la reproducción de cualquiera de ellos en menos de 2 segundos desde su selección.
- **SC-004 (Transiciones sin Interrupción)**: El 100% de los cambios de modo gráfico, paleta de color, filtro CRT, sensibilidad al beat y reordenamiento de la cola de reproducción se ejecutan sin causar cortes, silencios ni reinicios en el audio que se está reproduciendo.
- **SC-005 (Verificación y Despliegue Estático)**: El proyecto supera el 100% de las pruebas mínimas de arranque (inicialización gráfica y procesamiento de señal de audio simulada) y se sirve correctamente desde cualquier subdirectorio estático sin errores de recursos faltantes (0 errores 404 de assets).

## Assumptions

- Los usuarios acceden al visualizador desde navegadores modernos de escritorio o portátiles con soporte estándar para gráficos acelerados por hardware y reproducción de audio local.
- Los archivos de audio residen en el dispositivo local del usuario; no se requiere almacenamiento persistente en la nube ni sincronización entre dispositivos, por lo que la cola de reproducción vive durante la sesión activa del navegador.
- Para permitir que el usuario experimente los modos visuales apenas abre la aplicación (incluso antes de seleccionar un archivo MP3/WAV/OGG), el sistema incluye un generador o pulso sintético de demostración silencioso/opcional que alimenta las animaciones en estado de espera.
