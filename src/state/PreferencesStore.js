const STORAGE_KEY = 'wathcer_y2k_prefs_v1';

export const VALID_MODES = ['warp_tunnel', 'oscilloscope_matrix', 'plasma_feedback'];
export const VALID_PALETTES = [0, 1, 2, 3];

export const DEFAULT_PREFERENCES = Object.freeze({
  mode: 'warp_tunnel',
  paletteIndex: 0,
  beatSensitivity: 1.0,
  crtEnabled: true,
  loopQueue: true
});

/**
 * Gestiona la persistencia local de VisualPresetState bajo localStorage (wathcer_y2k_prefs_v1)
 * con validación estricta de rangos y valores permitidos.
 */
export class PreferencesStore {
  constructor(storage = typeof window !== 'undefined' ? window.localStorage : null) {
    this.storage = storage;
    this.state = { ...DEFAULT_PREFERENCES };
    this.load();
  }

  /**
   * Valida y normaliza un objeto parcial o completo de preferencias.
   * @param {Partial<typeof DEFAULT_PREFERENCES>} raw
   */
  sanitize(raw = {}) {
    const mode = VALID_MODES.includes(raw.mode) ? raw.mode : this.state.mode;
    const paletteNum = Number(raw.paletteIndex);
    const paletteIndex = VALID_PALETTES.includes(paletteNum) ? paletteNum : this.state.paletteIndex;

    let beatSensitivity = Number(raw.beatSensitivity);
    if (Number.isNaN(beatSensitivity)) {
      beatSensitivity = this.state.beatSensitivity;
    } else {
      beatSensitivity = Math.min(2.0, Math.max(0.1, beatSensitivity));
    }

    const crtEnabled = typeof raw.crtEnabled === 'boolean' ? raw.crtEnabled : this.state.crtEnabled;
    const loopQueue = typeof raw.loopQueue === 'boolean' ? raw.loopQueue : this.state.loopQueue;

    return {
      mode,
      paletteIndex,
      beatSensitivity,
      crtEnabled,
      loopQueue
    };
  }

  load() {
    if (!this.storage) {
      return { ...this.state };
    }
    try {
      const saved = this.storage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = this.sanitize(parsed);
      }
    } catch {
      this.state = { ...DEFAULT_PREFERENCES };
    }
    return { ...this.state };
  }

  getState() {
    return { ...this.state };
  }

  update(partial) {
    this.state = this.sanitize({ ...this.state, ...partial });
    if (this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Fallback silencioso en memoria si localStorage está bloqueado
      }
    }
    return { ...this.state };
  }

  reset() {
    this.state = { ...DEFAULT_PREFERENCES };
    if (this.storage) {
      try {
        this.storage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    return { ...this.state };
  }
}
