# WATHCER 2.0 Constitution

## Core Principles

### I. Pure Client-Side (Arquitectura 100% Cliente)
- La aplicación DEBE implementarse exclusivamente en el cliente utilizando HTML5, CSS3 y Vanilla JS o como una SPA empaquetada con Vite.
- El sistema NO DEBE depender de servidores backend, bases de datos remotas ni APIs externas propietarias para su funcionamiento principal.
- Todas las rutas de recursos y assets DEBEN ser relativas (`./` o configuradas con `base: './'`) para garantizar un despliegue 100% compatible y directo en GitHub Pages.
- **Justificación**: Asegura portabilidad absoluta, hospedaje estático gratuito sin mantenimiento de infraestructura y ejecución inmediata en cualquier navegador moderno.

### II. Y2K Aesthetic & Visual Engine (Motor Visual y Estética Y2K)
- El núcleo gráfico y sonoro DEBE priorizar el uso directo de Canvas WebGL y WebAudio API.
- El pipeline de renderizado DEBE implementar técnicas clásicas de visualización en tiempo real: *render-to-texture*, *feedback loops* (ping-pong framebuffers), deformación de cuadrícula (*warp grid*) y rotación de paletas (*palette cycling*), todos modulados reactivamente mediante datos de FFT (espectro de frecuencias) y detección de pulsos (*beat detection*).
- La interfaz de usuario (UI) DEBE reflejar una estética nostálgica Y2K auténtica, empleando skeuomorfismo sutil, acabados cromados/metálicos, bordes biselados y paletas de alto contraste (cian, magenta, verde neón sobre fondos oscuros).
- **Justificación**: El valor central del proyecto reside en recrear la experiencia sensorial y técnica de los visualizadores de audio de finales de los 90 y principios de los 2000 con rendimiento acelerado por GPU.

### III. Local Audio & Queue (Audio Local y Cola de Reproducción)
- La ingesta de audio DEBE operar sobre archivos locales proporcionados por el usuario mediante la File API del navegador (Drag & Drop y selector de archivos) y gestionarse en memoria a través de `URL.createObjectURL()`.
- El sistema DEBE incluir un gestor de cola de reproducción (*playlist/queue*) que permita agregar múltiples pistas, visualizar la lista, cambiar de pista manualmente, avanzar automáticamente al finalizar una pista y liberar referencias (`URL.revokeObjectURL()`) cuando los recursos ya no sean necesarios.
- **Justificación**: Garantiza privacidad total del usuario, latencia cero de red al cargar audio y una experiencia de reproductor multimedia completa sin requerir almacenamiento en la nube.

### IV. Minimal Testing (Pruebas Mínimas de Integración)
- La estrategia de pruebas DEBE limitarse estrictamente a *smoke tests* mínimos de integración que verifiquen la instanciación sin errores del `AudioContext` (y sus nodos de análisis) y la inicialización/compilación básica del pipeline de WebGL (contexto, shaders y framebuffers).
- NO SE DEBEN exigir ni mantener suites extensas de pruebas unitarias redundantes sobre lógica de UI o cálculos matemáticos intermedios de shaders.
- **Justificación**: Evita la sobrecarga de mantenimiento en un proyecto altamente visual y experimental donde la validación real ocurre en el bucle de renderizado de GPU y la respuesta acústica.

### V. Continuous Git Commits (Commits Atómicos y Continuos)
- Todo progreso de desarrollo DEBE registrarse mediante commits atómicos en Git inmediatamente después de completar cada *milestone* o bloque lógico de tareas.
- Cada commit DEBE dejar el repositorio en un estado coherente y describir claramente el bloque completado.
- **Justificación**: Mantiene un historial auditable, facilita la reversión segura ante experimentos gráficos fallidos y asegura trazabilidad continua durante la ejecución del plan de tareas.

## Restricciones Técnicas y de Despliegue

- **Stack Tecnológico**: HTML5, CSS3, JavaScript (ES6+) / Vite SPA, WebGL (1.0/2.0) y WebAudio API estándar del navegador.
- **Política de Dependencias**: Se DEBE minimizar el uso de librerías externas pesadas; el motor de shaders y el procesamiento de audio deben implementarse directamente sobre las APIs nativas del navegador salvo utilidades ligeras justificadas.
- **Compatibilidad con GitHub Pages**: La salida de compilación (o raíz estática) DEBE funcionar sin requerir reescritura de rutas en servidor ni cabeceras HTTP especiales.

## Flujo de Desarrollo y Control de Calidad

- **Ciclo de Trabajo por Bloques**: Las tareas definidas en las especificaciones se ejecutan secuencialmente por bloques funcionales (motor de audio, pipeline WebGL, controles UI Y2K, integración de playlist), seguidas de su respectivo commit atómico.
- **Puertas de Calidad (Quality Gates)**: Antes de cerrar un milestone, se DEBE verificar que:
  1. Los *smoke tests* de inicialización de `AudioContext` y WebGL pasen satisfactoriamente.
  2. No existan rutas absolutas rotas que impidan la carga en entornos de subdirectorio (GitHub Pages).
  3. El bucle de renderizado mantenga fluidez sin fugas evidentes de memoria en texturas o buffers de audio.

## Governance

- Esta Constitución establece las reglas arquitectónicas y de ingeniería no negociables de **WATHCER 2.0** y prevalece sobre cualquier otra práctica o convención implícita.
- **Procedimiento de Enmienda**: Cualquier modificación a estos principios requiere documentar la justificación técnica, actualizar este archivo `.specify/memory/constitution.md` y registrar el cambio en el historial de versiones.
- **Política de Versionado**: Se sigue versionado semántico (`MAJOR.MINOR.PATCH`):
  - `MAJOR`: Eliminación o redefinición incompatible de principios existentes.
  - `MINOR`: Adición de nuevos principios o expansión sustancial de reglas de gobernanza.
  - `PATCH`: Aclaraciones de redacción, correcciones tipográficas o refinamientos sin impacto semántico.
- **Revisión de Cumplimiento**: Toda especificación (`spec.md`), plan de implementación (`plan.md`) y lista de tareas (`tasks.md`) generada en el proyecto DEBE ser validada contra estos cinco principios antes de su ejecución.

**Version**: 1.0.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
