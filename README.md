# WATHCER 2.0 // Visualizador de Audio Y2K

Visualizador de audio interactivo **100% cliente** con estética retro **Y2K** (inspirado en Winamp y Windows Media Player 7), construido con **WebGL** (*ping-pong framebuffers*, *feedback loops*, *warp grid* y *palette cycling*) y **Web Audio API** (análisis FFT, forma de onda y detección de *beats* en frecuencias graves).

---

## Características Principales

- **100% Client-Side & GitHub Pages Ready**: Sin servidores backend ni dependencias en tiempo de ejecución; configurado con rutas relativas (`base: './'`).
- **Motor Visual WebGL (Ping-Pong FBOs)**:
  - **01 // Warp Tunnel**: Túnel geométrico polar con deformación de cuadrícula reactiva al bajo.
  - **02 // Oscilloscope Matrix**: Trazado de onda temporal sobre matriz digital con persistencia.
  - **03 // Plasma Feedback**: Campos de interferencia orgánica y retroalimentación cromática intensa.
  - **4 Paletas Cromáticas Y2K**: *Cyber Cyan-Magenta*, *Winamp Acid Green*, *Hyper-Chrome UV* y *Solar Overdrive*.
- **Audio Local y Cola Reordenable**:
  - Carga múltiple de archivos locales (`.mp3`, `.wav`, `.ogg`) mediante botón `+ LOAD AUDIO` o arrastrando y soltando (*Drag & Drop*) sobre la ventana.
  - Cola de reproducción con reordenamiento *Drag & Drop* en vivo, avance automático, botón de bucle (`LOOP`) y modo *Demo/Idle* autónomo cuando no hay pistas cargadas.
- **HUD Auto-Ocultable y Monitor CRT**:
  - El lienzo ocupa el **100% del viewport**; los paneles Y2K aparecen al mover el cursor y se ocultan automáticamente tras 2.5 segundos de inactividad.
  - Filtro de líneas de escaneo (**CRT Scanlines**) activable y persistencia automática de preferencias en `localStorage`.

---

## 1. Cómo Ejecutarlo en Local

### Requisitos previos
- [Node.js](https://nodejs.org/) v18 o superior.

### Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/<TU_USUARIO>/<TU_REPOSITORIO>.git
cd <TU_REPOSITORIO>

# Instalar dependencias de desarrollo (Vite + Vitest)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`) en tu navegador.

### Comandos adicionales

```bash
# Ejecutar los smoke tests de integración (AudioContext + WebGL Pipeline)
npm test

# Generar la compilación estática de producción en ./dist
npm run build

# Previsualizar localmente la carpeta ./dist compilada
npm run preview
```

---

## 2. Cómo Subirlo y Correrlo en GitHub Pages

El proyecto ya está configurado en `vite.config.js` con `base: './'`, por lo que funciona directamente en cualquier URL de repositorio (`https://<TU_USUARIO>.github.io/<TU_REPOSITORIO>/`) sin errores de rutas.

Tienes **dos formas** de publicarlo en GitHub Pages:

### Opción A: Despliegue Automático con GitHub Actions (Recomendado)

1. Sube tu código a un repositorio en GitHub:
   ```bash
   git remote add origin https://github.com/<TU_USUARIO>/<TU_REPOSITORIO>.git
   git branch -M main
   git push -u origin main
   ```
2. En tu repositorio de GitHub, ve a **Settings** → **Pages**.
3. En **Build and deployment** → **Source**, selecciona **GitHub Actions**.
4. Crea el archivo `.github/workflows/deploy.yml` en tu repositorio con el siguiente contenido:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run smoke tests
        run: npm test

      - name: Build static site
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Cada vez que hagas `git push` a `main`, GitHub ejecutará los *smoke tests*, compilará `./dist` y publicará la web automáticamente.

---

### Opción B: Publicar la carpeta `dist` manualmente (vía `gh-pages`)

Si prefieres desplegar desde tu terminal sin configurar Actions:

```bash
# 1. Compilar el proyecto
npm run build

# 2. Publicar el contenido de ./dist en la rama gh-pages
npx gh-pages -d dist
```

Luego, en GitHub ve a **Settings** → **Pages**, elige **Deploy from a branch**, selecciona la rama `gh-pages` (`/(root)`) y guarda.

---

## Estructura del Proyecto

```text
├── index.html                  # Shell HTML5 con canvas 100% viewport y contenedor HUD
├── vite.config.js              # Configuración Vite con base relativa ('./')
├── src/
│   ├── main.js                 # Orquestador principal y bucle requestAnimationFrame
│   ├── audio/
│   │   └── WebAudioEngine.js   # AudioContext, AnalyserNode (FFT/TimeDomain), beat detector y señal demo
│   ├── visualizer/
│   │   ├── WebGLShaderEngine.js       # Motor WebGL y ping-pong framebuffers (FBO_A / FBO_B)
│   │   └── shaders/
│   │       ├── fullscreen.vert.js     # Vertex shader de pantalla completa
│   │       ├── feedback.frag.js       # Pass 1: Feedback loop, warp grid y 3 modos visuales
│   │       └── postprocess.frag.js    # Pass 2: Palette cycling Y2K y filtro CRT
│   ├── queue/
│   │   └── QueueManager.js     # Cola de audio local (File API / ObjectURL), loop y Drag & Drop
│   ├── state/
│   │   └── PreferencesStore.js # Persistencia en localStorage de preferencias visuales
│   └── ui/
│       ├── UIShellY2K.js       # Paneles cromados Y2K, controles en vivo y auto-ocultamiento HUD
│       └── styles/
│           └── y2k-theme.css   # Estilos retro Winamp/WMP7, biseles metálicos y scanlines CRT
└── tests/
    └── smoke.test.js           # Suite mínima de smoke tests (AudioContext + WebGL)
```
