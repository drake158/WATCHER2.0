const AUTO_HIDE_DELAY_MS = 2500;

/**
 * UIShellY2K: Construye la interfaz retro Y2K (inspirada en Winamp / Windows Media Player 7),
 * gestiona el auto-ocultamiento de paneles tras 2500 ms de inactividad del cursor (FR-001),
 * y conecta todos los controles interactivos de audio, presets, paletas, CRT y playlist Drag & Drop.
 */
export class UIShellY2K {
  /**
   * @param {HTMLElement} hudContainer
   * @param {Object} handlers
   */
  constructor(hudContainer, handlers = {}) {
    this.hudContainer = hudContainer;
    this.crtOverlay = document.getElementById('crt-overlay');
    this.handlers = handlers;

    this.hideTimer = null;
    this.isPointerInsidePanel = false;
    this.draggedTrackIndex = null;
  }

  init(initialPrefs, initialQueueState) {
    this.renderTemplate(initialPrefs);
    this.bindEvents();
    this.updateQueueView(initialQueueState);
    this.applyCrtOverlay(initialPrefs.crtEnabled);
    this.resetInactivityTimer();
  }

  renderTemplate(prefs) {
    this.hudContainer.innerHTML = `
      <div class="y2k-top-row">
        <!-- Main Transport & LCD Deck -->
        <section class="y2k-window y2k-deck" aria-label="Reproductor Principal Y2K">
          <header class="y2k-titlebar">
            <span><span class="y2k-titlebar__led"></span>WATHCER 2.0 // CYBER-DECK</span>
            <span>WINAMP-WMP7 DSP</span>
          </header>
          <div class="y2k-deck__body">
            <div class="y2k-lcd">
              <div class="y2k-lcd__track" id="lcd-track-title">[DEMO SIGNAL ACTIVE // DROP AUDIO FILES]</div>
              <div class="y2k-lcd__meta">
                <span id="lcd-playback-status">STATUS: IDLE DEMO</span>
                <span id="lcd-queue-count">QUEUE: 0 TRACKS</span>
              </div>
            </div>
            <div class="y2k-controls-row">
              <button type="button" class="y2k-btn y2k-btn--accent" id="btn-load-files" title="Cargar archivos MP3, WAV, OGG">
                + LOAD AUDIO
              </button>
              <input
                type="file"
                id="file-input-audio"
                multiple
                accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                hidden
              />
              <button type="button" class="y2k-btn" id="btn-prev" title="Pista Anterior">|&lt;&lt;</button>
              <button type="button" class="y2k-btn" id="btn-play-pause" title="Reproducir / Pausar">PLAY</button>
              <button type="button" class="y2k-btn" id="btn-next" title="Siguiente Pista">&gt;&gt;|</button>
              <button
                type="button"
                class="y2k-btn ${prefs.loopQueue ? 'y2k-btn--active' : ''}"
                id="btn-loop"
                title="Repetir cola automáticamente"
              >
                LOOP: ${prefs.loopQueue ? 'ON' : 'OFF'}
              </button>
            </div>
            <div id="y2k-toast" class="y2k-toast" role="status"></div>
          </div>
        </section>

        <!-- Visual Preset & FX Matrix Panel -->
        <section class="y2k-window y2k-fx-panel" aria-label="Configuración del Motor Visual">
          <header class="y2k-titlebar">
            <span><span class="y2k-titlebar__led"></span>WEBGL SHADER MATRIX</span>
            <span>PING-PONG FBO</span>
          </header>
          <div class="y2k-fx-panel__body">
            <div class="y2k-field">
              <label class="y2k-label" for="select-visual-mode">VISUAL PRESET</label>
              <select class="y2k-select" id="select-visual-mode">
                <option value="warp_tunnel" ${prefs.mode === 'warp_tunnel' ? 'selected' : ''}>01 // WARP TUNNEL</option>
                <option value="oscilloscope_matrix" ${prefs.mode === 'oscilloscope_matrix' ? 'selected' : ''}>02 // OSCILLOSCOPE MATRIX</option>
                <option value="plasma_feedback" ${prefs.mode === 'plasma_feedback' ? 'selected' : ''}>03 // PLASMA FEEDBACK</option>
              </select>
            </div>

            <div class="y2k-field">
              <label class="y2k-label" for="select-palette">CHROMATIC PALETTE</label>
              <select class="y2k-select" id="select-palette">
                <option value="0" ${prefs.paletteIndex === 0 ? 'selected' : ''}>PAL 01 // CYBER CYAN-MAGENTA</option>
                <option value="1" ${prefs.paletteIndex === 1 ? 'selected' : ''}>PAL 02 // WINAMP ACID GREEN</option>
                <option value="2" ${prefs.paletteIndex === 2 ? 'selected' : ''}>PAL 03 // HYPER-CHROME UV</option>
                <option value="3" ${prefs.paletteIndex === 3 ? 'selected' : ''}>PAL 04 // SOLAR OVERDRIVE</option>
              </select>
            </div>

            <div class="y2k-field y2k-field--full">
              <label class="y2k-label" for="slider-beat-sensitivity">
                <span>BASS BEAT SENSITIVITY</span>
                <span id="label-beat-value">${Number(prefs.beatSensitivity).toFixed(2)}x</span>
              </label>
              <input
                type="range"
                class="y2k-slider"
                id="slider-beat-sensitivity"
                min="0.1"
                max="2.0"
                step="0.05"
                value="${prefs.beatSensitivity}"
              />
            </div>

            <div class="y2k-field y2k-field--full">
              <button
                type="button"
                class="y2k-btn ${prefs.crtEnabled ? 'y2k-btn--active' : ''}"
                id="btn-crt-toggle"
              >
                CRT SCANLINE MONITOR: ${prefs.crtEnabled ? 'ENABLED' : 'OFF'}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="y2k-bottom-row">
        <!-- Playlist Queue Window -->
        <section class="y2k-window y2k-playlist-panel" aria-label="Cola de Reproducción">
          <header class="y2k-titlebar">
            <span><span class="y2k-titlebar__led"></span>PLAYLIST QUEUE // DRAG TO REORDER</span>
            <span>MP3 / WAV / OGG</span>
          </header>
          <div class="y2k-playlist__body">
            <ul class="y2k-playlist__list" id="playlist-list"></ul>
          </div>
        </section>
      </div>
    `;
  }

  bindEvents() {
    const fileInput = this.hudContainer.querySelector('#file-input-audio');
    const btnLoad = this.hudContainer.querySelector('#btn-load-files');
    const btnPlayPause = this.hudContainer.querySelector('#btn-play-pause');
    const btnPrev = this.hudContainer.querySelector('#btn-prev');
    const btnNext = this.hudContainer.querySelector('#btn-next');
    const btnLoop = this.hudContainer.querySelector('#btn-loop');
    const selectMode = this.hudContainer.querySelector('#select-visual-mode');
    const selectPalette = this.hudContainer.querySelector('#select-palette');
    const sliderBeat = this.hudContainer.querySelector('#slider-beat-sensitivity');
    const labelBeatValue = this.hudContainer.querySelector('#label-beat-value');
    const btnCrt = this.hudContainer.querySelector('#btn-crt-toggle');

    btnLoad.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handlers.onFilesSelected?.(e.target.files);
        fileInput.value = '';
      }
    });

    btnPlayPause.addEventListener('click', () => this.handlers.onPlayPauseToggle?.());
    btnPrev.addEventListener('click', () => this.handlers.onPrevTrack?.());
    btnNext.addEventListener('click', () => this.handlers.onNextTrack?.());

    btnLoop.addEventListener('click', () => {
      const nextLoop = !btnLoop.classList.contains('y2k-btn--active');
      btnLoop.classList.toggle('y2k-btn--active', nextLoop);
      btnLoop.textContent = `LOOP: ${nextLoop ? 'ON' : 'OFF'}`;
      this.handlers.onLoopToggle?.(nextLoop);
    });

    selectMode.addEventListener('change', (e) => {
      this.handlers.onPresetChange?.({ mode: e.target.value });
    });

    selectPalette.addEventListener('change', (e) => {
      this.handlers.onPresetChange?.({ paletteIndex: Number(e.target.value) });
    });

    sliderBeat.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      labelBeatValue.textContent = `${val.toFixed(2)}x`;
      this.handlers.onBeatSensitivityChange?.(val);
    });

    btnCrt.addEventListener('click', () => {
      const nextCrt = !btnCrt.classList.contains('y2k-btn--active');
      btnCrt.classList.toggle('y2k-btn--active', nextCrt);
      btnCrt.textContent = `CRT SCANLINE MONITOR: ${nextCrt ? 'ENABLED' : 'OFF'}`;
      this.applyCrtOverlay(nextCrt);
      this.handlers.onPresetChange?.({ crtEnabled: nextCrt });
    });

    // Detectar si el puntero está sobre una ventana Y2K para no ocultar mientras el usuario opera controles
    const windows = this.hudContainer.querySelectorAll('.y2k-window');
    windows.forEach((win) => {
      win.addEventListener('mouseenter', () => {
        this.isPointerInsidePanel = true;
        this.showHud();
      });
      win.addEventListener('mouseleave', () => {
        this.isPointerInsidePanel = false;
        this.resetInactivityTimer();
      });
    });

    // Eventos globales de actividad de cursor/teclado para mostrar HUD temporalmente (FR-001)
    const activityHandler = () => this.resetInactivityTimer();
    window.addEventListener('mousemove', activityHandler, { passive: true });
    window.addEventListener('mousedown', activityHandler, { passive: true });
    window.addEventListener('touchstart', activityHandler, { passive: true });
    window.addEventListener('keydown', activityHandler, { passive: true });

    // Soporte Drag & Drop de archivos de audio locales en toda la ventana (FR-006)
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.showHud();
      document.body.classList.add('y2k-dropzone-active');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null) {
        document.body.classList.remove('y2k-dropzone-active');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      document.body.classList.remove('y2k-dropzone-active');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handlers.onFilesSelected?.(e.dataTransfer.files);
      }
    });
  }

  showHud() {
    this.hudContainer.classList.add('y2k-hud--visible');
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  resetInactivityTimer() {
    this.showHud();
    this.hideTimer = setTimeout(() => {
      if (!this.isPointerInsidePanel && this.draggedTrackIndex === null) {
        this.hudContainer.classList.remove('y2k-hud--visible');
      }
    }, AUTO_HIDE_DELAY_MS);
  }

  applyCrtOverlay(enabled) {
    if (this.crtOverlay) {
      this.crtOverlay.classList.toggle('crt-overlay--active', Boolean(enabled));
    }
  }

  showToast(message) {
    const toast = this.hudContainer.querySelector('#y2k-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('y2k-toast--visible');
    setTimeout(() => {
      toast.classList.remove('y2k-toast--visible');
    }, 3200);
  }

  updateQueueView(queueState) {
    if (!queueState) return;
    const titleEl = this.hudContainer.querySelector('#lcd-track-title');
    const statusEl = this.hudContainer.querySelector('#lcd-playback-status');
    const countEl = this.hudContainer.querySelector('#lcd-queue-count');
    const btnPlayPause = this.hudContainer.querySelector('#btn-play-pause');
    const listEl = this.hudContainer.querySelector('#playlist-list');

    if (titleEl) {
      titleEl.textContent = queueState.currentTrack
        ? `${queueState.currentIndex + 1}. ${queueState.currentTrack.name}`
        : '[DEMO SIGNAL ACTIVE // DROP AUDIO FILES]';
    }

    if (statusEl) {
      statusEl.textContent = `STATUS: ${queueState.playbackState.toUpperCase()}`;
    }

    if (countEl) {
      countEl.textContent = `QUEUE: ${queueState.tracks.length} TRACKS`;
    }

    if (btnPlayPause) {
      const isPlaying = queueState.playbackState === 'playing';
      btnPlayPause.textContent = isPlaying ? 'PAUSE' : 'PLAY';
      btnPlayPause.classList.toggle('y2k-btn--active', isPlaying);
    }

    if (!listEl) return;
    listEl.innerHTML = '';

    if (queueState.tracks.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'y2k-playlist__empty';
      emptyLi.textContent = 'Drag & Drop MP3 / WAV / OGG files here or click + LOAD AUDIO';
      listEl.appendChild(emptyLi);
      return;
    }

    queueState.tracks.forEach((track, idx) => {
      const li = document.createElement('li');
      li.className = `y2k-playlist__item ${idx === queueState.currentIndex ? 'y2k-playlist__item--active' : ''}`;
      li.draggable = true;
      li.dataset.index = String(idx);

      const leftSpan = document.createElement('span');
      const handleSpan = document.createElement('span');
      handleSpan.className = 'y2k-playlist__handle';
      handleSpan.textContent = '::';
      leftSpan.appendChild(handleSpan);
      leftSpan.appendChild(
        document.createTextNode(`${String(idx + 1).padStart(2, '0')}. ${track.name}`)
      );

      const statusBadge = document.createElement('span');
      statusBadge.textContent = idx === queueState.currentIndex ? '[ACTIVE]' : '';

      li.appendChild(leftSpan);
      li.appendChild(statusBadge);

      // Clic para reproducir pista directamente
      li.addEventListener('click', () => {
        this.handlers.onSelectTrack?.(idx);
      });

      // Eventos HTML5 Drag & Drop para reordenar pistas en vivo (FR-007)
      li.addEventListener('dragstart', (e) => {
        this.draggedTrackIndex = idx;
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(idx));
        }
      });

      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.add('y2k-playlist__item--dragover');
      });

      li.addEventListener('dragleave', () => {
        li.classList.remove('y2k-playlist__item--dragover');
      });

      li.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.remove('y2k-playlist__item--dragover');
        const fromIdx =
          this.draggedTrackIndex !== null
            ? this.draggedTrackIndex
            : Number(e.dataTransfer?.getData('text/plain'));
        const toIdx = idx;
        this.draggedTrackIndex = null;
        if (!Number.isNaN(fromIdx) && fromIdx !== toIdx) {
          this.handlers.onReorderTrack?.(fromIdx, toIdx);
        }
      });

      li.addEventListener('dragend', () => {
        this.draggedTrackIndex = null;
        li.classList.remove('y2k-playlist__item--dragover');
      });

      listEl.appendChild(li);
    });
  }
}
