import { PreferencesStore } from './state/PreferencesStore.js';
import { WebAudioEngine } from './audio/WebAudioEngine.js';
import { WebGLShaderEngine } from './visualizer/WebGLShaderEngine.js';
import { QueueManager } from './queue/QueueManager.js';
import { UIShellY2K } from './ui/UIShellY2K.js';

/**
 * Bootstrapper principal de WATHCER 2.0:
 * Conecta PreferencesStore, WebAudioEngine, WebGLShaderEngine, QueueManager y UIShellY2K
 * dentro de un bucle requestAnimationFrame a 60 FPS.
 */
export function bootstrapApp() {
  const canvas = document.getElementById('visualizer-canvas');
  const hudContainer = document.getElementById('y2k-hud');
  if (!canvas || !hudContainer) return null;

  const prefsStore = new PreferencesStore();
  const initialPrefs = prefsStore.getState();

  const audioEngine = new WebAudioEngine({ fftSize: 512 });
  audioEngine.setBeatSensitivity(initialPrefs.beatSensitivity);

  const visualizer = new WebGLShaderEngine(canvas);
  canvas.width = window.innerWidth || 1280;
  canvas.height = window.innerHeight || 720;
  visualizer.init();
  visualizer.setVisualState({
    mode: initialPrefs.mode,
    paletteIndex: initialPrefs.paletteIndex,
    crtEnabled: initialPrefs.crtEnabled
  });

  let uiShell = null;

  const queueManager = new QueueManager({
    onTrackChange: async (track) => {
      if (track && track.objectUrl) {
        await audioEngine.loadTrackUrl(track.objectUrl, true);
      } else {
        audioEngine.pause();
      }
    },
    onQueueUpdate: (queueState) => {
      if (uiShell) {
        uiShell.updateQueueView(queueState);
      }
    },
    onInvalidFiles: (rejectedCount) => {
      if (uiShell) {
        uiShell.showToast(
          `[WARN]: ${rejectedCount} archivo(s) omitido(s). Formatos soportados: MP3, WAV, OGG.`
        );
      }
    }
  });

  queueManager.setLoopQueue(initialPrefs.loopQueue);

  audioEngine.onTrackEnded(() => {
    queueManager.nextTrack();
  });

  uiShell = new UIShellY2K(hudContainer, {
    onFilesSelected: (fileList) => {
      queueManager.addFiles(fileList);
    },
    onPlayPauseToggle: async () => {
      const state = queueManager.getState();
      if (state.tracks.length === 0) {
        await audioEngine.init();
        uiShell.showToast('[INFO]: Modo Demo activo. Carga archivos MP3/WAV/OGG para reproducir.');
        return;
      }
      if (state.playbackState === 'playing') {
        audioEngine.pause();
        queueManager.setPlaybackState('paused');
      } else {
        if (state.currentIndex === -1) {
          queueManager.selectTrack(0);
        } else {
          await audioEngine.play();
          queueManager.setPlaybackState('playing');
        }
      }
    },
    onPrevTrack: () => {
      queueManager.prevTrack();
    },
    onNextTrack: () => {
      queueManager.nextTrack();
    },
    onSelectTrack: (index) => {
      queueManager.selectTrack(index);
    },
    onReorderTrack: (fromIndex, toIndex) => {
      queueManager.reorderTrack(fromIndex, toIndex);
    },
    onLoopToggle: (enabled) => {
      queueManager.setLoopQueue(enabled);
      prefsStore.update({ loopQueue: enabled });
    },
    onPresetChange: (partialPreset) => {
      const updated = prefsStore.update(partialPreset);
      visualizer.setVisualState(updated);
    },
    onBeatSensitivityChange: (sensitivity) => {
      const updated = prefsStore.update({ beatSensitivity: sensitivity });
      audioEngine.setBeatSensitivity(updated.beatSensitivity);
    }
  });

  uiShell.init(initialPrefs, queueManager.getState());

  window.addEventListener('resize', () => {
    visualizer.resize(window.innerWidth, window.innerHeight);
  });

  const startTime = performance.now();
  function animate(now) {
    const elapsedSeconds = (now - startTime) * 0.001;
    const analysisFrame = audioEngine.getAnalysisFrame(elapsedSeconds);
    visualizer.renderFrame(analysisFrame, elapsedSeconds);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  return {
    prefsStore,
    audioEngine,
    visualizer,
    queueManager,
    uiShell
  };
}

if (typeof window !== 'undefined' && document.getElementById('visualizer-canvas')) {
  bootstrapApp();
}
