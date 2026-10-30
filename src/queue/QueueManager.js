const SUPPORTED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'application/ogg'
]);

const SUPPORTED_EXTENSIONS = /\.(mp3|wav|ogg)$/i;

let trackCounter = 0;

/**
 * QueueManager: Gestiona las entidades Track y PlaylistQueue para archivos de audio locales
 * vía File API / URL.createObjectURL, incluyendo bucle de cola (loopQueue) y reordenamiento Drag & Drop.
 */
export class QueueManager {
  /**
   * @param {Object} [callbacks]
   * @param {(track: Object | null) => void} [callbacks.onTrackChange]
   * @param {(state: Object) => void} [callbacks.onQueueUpdate]
   * @param {(rejectedCount: number) => void} [callbacks.onInvalidFiles]
   */
  constructor(callbacks = {}) {
    this.onTrackChange = callbacks.onTrackChange || (() => {});
    this.onQueueUpdate = callbacks.onQueueUpdate || (() => {});
    this.onInvalidFiles = callbacks.onInvalidFiles || (() => {});

    this.tracks = [];
    this.currentIndex = -1;
    this.playbackState = 'idle'; // 'idle' | 'playing' | 'paused'
    this.loopQueue = true;
  }

  isValidAudioFile(file) {
    if (!file || typeof file.size !== 'number' || file.size <= 0) {
      return false;
    }
    const name = (file.name || '').trim();
    if (!name) return false;
    const hasValidMime = file.type && SUPPORTED_MIME_TYPES.has(file.type.toLowerCase());
    const hasValidExt = SUPPORTED_EXTENSIONS.test(name);
    return Boolean(hasValidMime || hasValidExt);
  }

  generateTrackId() {
    trackCounter += 1;
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `track_${Date.now()}_${trackCounter}`;
  }

  getState() {
    return {
      tracks: [...this.tracks],
      currentIndex: this.currentIndex,
      currentTrack:
        this.currentIndex >= 0 && this.currentIndex < this.tracks.length
          ? this.tracks[this.currentIndex]
          : null,
      playbackState: this.playbackState,
      loopQueue: this.loopQueue
    };
  }

  notifyUpdate() {
    this.onQueueUpdate(this.getState());
  }

  /**
   * Filtra archivos válidos (.mp3, .wav, .ogg con fileSize > 0), crea ObjectURLs y los añade a la cola.
   * Si la cola estaba vacía, selecciona automáticamente la primera pista añadida.
   * @param {FileList | File[]} fileList
   */
  addFiles(fileList) {
    if (!fileList || !fileList.length) return [];
    const added = [];
    let rejected = 0;

    for (const file of Array.from(fileList)) {
      if (!this.isValidAudioFile(file)) {
        rejected += 1;
        continue;
      }

      const cleanName = file.name.replace(/^.*[\\/]/, '').trim();
      const objectUrl =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : `blob:simulated/${encodeURIComponent(cleanName)}`;

      const track = {
        id: this.generateTrackId(),
        name: cleanName,
        mimeType: file.type || 'audio/mpeg',
        objectUrl,
        fileSize: file.size
      };

      this.tracks.push(track);
      added.push(track);
    }

    if (rejected > 0) {
      this.onInvalidFiles(rejected);
    }

    const wasEmpty = this.currentIndex === -1 && added.length > 0;
    if (wasEmpty) {
      this.selectTrack(0);
    } else if (added.length > 0) {
      this.notifyUpdate();
    }

    return added;
  }

  /**
   * Selecciona y activa una pista por su índice.
   * @param {number} index
   */
  selectTrack(index) {
    if (index < 0 || index >= this.tracks.length) {
      return null;
    }
    this.currentIndex = index;
    this.playbackState = 'playing';
    const activeTrack = this.tracks[this.currentIndex];
    this.onTrackChange(activeTrack);
    this.notifyUpdate();
    return activeTrack;
  }

  setPlaybackState(state) {
    if (state === 'idle' || state === 'playing' || state === 'paused') {
      this.playbackState = state;
      this.notifyUpdate();
    }
  }

  /**
   * Avanza a la siguiente pista (respetando loopQueue cuando termina la última pista).
   */
  nextTrack() {
    if (this.tracks.length === 0) {
      this.currentIndex = -1;
      this.playbackState = 'idle';
      this.notifyUpdate();
      return null;
    }

    const nextIdx = this.currentIndex + 1;
    if (nextIdx < this.tracks.length) {
      return this.selectTrack(nextIdx);
    }

    if (this.loopQueue) {
      return this.selectTrack(0);
    }

    this.playbackState = 'idle';
    this.onTrackChange(null);
    this.notifyUpdate();
    return null;
  }

  /**
   * Retrocede a la pista anterior.
   */
  prevTrack() {
    if (this.tracks.length === 0) return null;
    const prevIdx =
      this.currentIndex > 0
        ? this.currentIndex - 1
        : this.loopQueue
          ? this.tracks.length - 1
          : 0;
    return this.selectTrack(prevIdx);
  }

  /**
   * Reordena una pista de fromIndex a toIndex sin cortar ni reiniciar la reproducción actual.
   * @param {number} fromIndex
   * @param {number} toIndex
   */
  reorderTrack(fromIndex, toIndex) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tracks.length ||
      toIndex >= this.tracks.length
    ) {
      return;
    }

    const activeTrackId =
      this.currentIndex >= 0 && this.currentIndex < this.tracks.length
        ? this.tracks[this.currentIndex].id
        : null;

    const [moved] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, moved);

    if (activeTrackId) {
      this.currentIndex = this.tracks.findIndex((t) => t.id === activeTrackId);
    }

    this.notifyUpdate();
  }

  setLoopQueue(enabled) {
    this.loopQueue = Boolean(enabled);
    this.notifyUpdate();
  }

  dispose() {
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      for (const track of this.tracks) {
        if (track.objectUrl && track.objectUrl.startsWith('blob:')) {
          URL.revokeObjectURL(track.objectUrl);
        }
      }
    }
    this.tracks = [];
    this.currentIndex = -1;
    this.playbackState = 'idle';
    this.notifyUpdate();
  }
}
