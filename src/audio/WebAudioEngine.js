/**
 * WebAudioEngine: Gestiona AudioContext, AnalyserNode (FFT + TimeDomain),
 * detección de impactos rítmicos en graves (beat detection) y señal sintética de reposo (Demo/Idle).
 */
export class WebAudioEngine {
  /**
   * @param {Object} [options]
   * @param {number} [options.fftSize=512]
   * @param {() => AudioContext} [options.audioContextFactory]
   * @param {HTMLAudioElement} [options.audioElement]
   */
  constructor(options = {}) {
    this.fftSize = options.fftSize || 512;
    this.binCount = this.fftSize / 2; // 256 bins para fftSize=512
    this.audioContextFactory = options.audioContextFactory || null;

    this.audioContext = null;
    this.analyser = null;
    this.mediaSource = null;
    this.audioElement =
      options.audioElement ||
      (typeof document !== 'undefined' ? document.createElement('audio') : null);

    if (this.audioElement) {
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';
    }

    this.frequencyData = new Uint8Array(this.binCount);
    this.timeDomainData = new Uint8Array(this.binCount);

    this.beatSensitivity = 1.0;
    this.rollingBassEnergy = 0.25;
    this.beatPulse = 0.0;
    this.lastBeatTime = -10.0;
    this.beatCooldownSeconds = 0.12;

    this.isInitialized = false;
    this.isPlaying = false;
    this.simulatedActive = false;
  }

  /**
   * Inicializa o reanuda el AudioContext tras interacción del usuario o en smoke test.
   */
  async init() {
    if (!this.audioContext) {
      if (this.audioContextFactory) {
        this.audioContext = this.audioContextFactory();
      } else if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }

      if (this.audioContext) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.fftSize;
        this.analyser.smoothingTimeConstant = 0.8;

        if (this.audioElement && typeof this.audioContext.createMediaElementSource === 'function') {
          try {
            this.mediaSource = this.audioContext.createMediaElementSource(this.audioElement);
            this.mediaSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
          } catch {
            // En entornos de prueba sin HTMLMediaElement real, conectamos analyser directo si aplica
          }
        }
        this.isInitialized = true;
      }
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // Ignorar bloqueo de autoplay hasta interacción del usuario
      }
    }

    return this.isInitialized;
  }

  /**
   * Permite activar modo de lectura directa del AnalyserNode para smoke tests con mocks.
   * @param {boolean} active
   */
  setSimulatedActive(active) {
    this.simulatedActive = Boolean(active);
  }

  /**
   * Carga un ObjectURL local en el elemento de audio y opcionalmente inicia reproducción.
   * @param {string} objectUrl
   * @param {boolean} [autoPlay=true]
   */
  async loadTrackUrl(objectUrl, autoPlay = true) {
    await this.init();
    if (!this.audioElement) return;
    this.audioElement.src = objectUrl;
    if (autoPlay) {
      await this.play();
    }
  }

  async play() {
    await this.init();
    if (!this.audioElement || !this.audioElement.src) return false;
    try {
      await this.audioElement.play();
      this.isPlaying = true;
      return true;
    } catch {
      this.isPlaying = false;
      return false;
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
  }

  /**
   * Ajusta el multiplicador de sensibilidad al beat en el rango continuo [0.1, 2.0].
   * @param {number} value
   */
  setBeatSensitivity(value) {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      this.beatSensitivity = Math.min(2.0, Math.max(0.1, num));
    }
  }

  /**
   * Registra callback cuando una pista llega al final.
   * @param {() => void} handler
   */
  onTrackEnded(handler) {
    if (this.audioElement) {
      this.audioElement.addEventListener('ended', handler);
    }
  }

  /**
   * Genera una señal sintética suave en reposo (Modo Demo / Idle) para que el visualizador
   * siempre muestre actividad orgánica antes de cargar archivos locales.
   * @param {number} timeSeconds
   */
  populateSyntheticSignal(timeSeconds) {
    const pulse = Math.pow(0.5 + 0.5 * Math.sin(timeSeconds * 2.6), 4.0);
    for (let i = 0; i < this.binCount; i++) {
      const norm = i / this.binCount;
      const bassEnvelope = Math.exp(-norm * 4.5) * (145 + 95 * pulse);
      const harmonic = 38 * Math.sin(norm * 18.0 - timeSeconds * 3.2) * (1.0 - norm * 0.5);
      const shimmer = 22 * Math.cos(norm * 42.0 + timeSeconds * 5.0);
      this.frequencyData[i] = Math.min(255, Math.max(0, Math.round(bassEnvelope + harmonic + shimmer)));

      const wave =
        Math.sin(norm * Math.PI * 6.0 + timeSeconds * 4.0) * (36 + 28 * pulse) +
        Math.cos(norm * Math.PI * 14.0 - timeSeconds * 7.0) * 16;
      this.timeDomainData[i] = Math.min(255, Math.max(0, Math.round(128 + wave)));
    }
  }

  /**
   * Extrae el fotograma acústico actual (real si está reproduciendo, o sintético en modo Demo/Idle).
   * @param {number} [timeSeconds=0]
   * @returns {AudioAnalysisFrame}
   */
  getAnalysisFrame(timeSeconds = 0) {
    const hasRealAudio =
      this.simulatedActive ||
      (this.isInitialized &&
        this.analyser &&
        this.audioElement &&
        !this.audioElement.paused &&
        Boolean(this.audioElement.src));

    if (hasRealAudio && this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      this.analyser.getByteTimeDomainData(this.timeDomainData);
    } else {
      this.populateSyntheticSignal(timeSeconds);
    }

    // Calcular energía normalizada [0.0, 1.0] por bandas (Sub-bajo/Bajo: 0..11, Medio: 12..95, Agudo: 96..255)
    let bassSum = 0;
    for (let i = 0; i < 12; i++) bassSum += this.frequencyData[i];
    const bassEnergy = Math.min(1.0, Math.max(0.0, bassSum / (12 * 255)));

    let midSum = 0;
    for (let i = 12; i < 96; i++) midSum += this.frequencyData[i];
    const midEnergy = Math.min(1.0, Math.max(0.0, midSum / (84 * 255)));

    let highSum = 0;
    for (let i = 96; i < this.binCount; i++) highSum += this.frequencyData[i];
    const highEnergy = Math.min(1.0, Math.max(0.0, highSum / ((this.binCount - 96) * 255)));

    // Detección reactiva de Beat sobre frecuencias bajas modulada por beatSensitivity [0.1, 2.0]
    const dynamicThreshold = Math.max(0.14, this.rollingBassEnergy * (1.42 - this.beatSensitivity * 0.24));
    if (
      bassEnergy > dynamicThreshold &&
      timeSeconds - this.lastBeatTime >= this.beatCooldownSeconds
    ) {
      this.beatPulse = Math.min(1.0, 0.65 + bassEnergy * 0.35 * this.beatSensitivity);
      this.lastBeatTime = timeSeconds;
    } else {
      this.beatPulse = Math.max(0.0, this.beatPulse * 0.88);
    }

    this.rollingBassEnergy = this.rollingBassEnergy * 0.92 + bassEnergy * 0.08;

    return {
      frequencyData: this.frequencyData,
      timeDomainData: this.timeDomainData,
      bassEnergy,
      midEnergy,
      highEnergy,
      beatPulse: Math.min(1.0, Math.max(0.0, this.beatPulse)),
      isSynthetic: !hasRealAudio
    };
  }
}
