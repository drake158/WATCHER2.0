import { FULLSCREEN_VERTEX_SHADER } from './shaders/fullscreen.vert.js';
import { FEEDBACK_FRAGMENT_SHADER } from './shaders/feedback.frag.js';
import { POSTPROCESS_FRAGMENT_SHADER } from './shaders/postprocess.frag.js';

const MODE_TO_INT = {
  warp_tunnel: 0,
  oscilloscope_matrix: 1,
  plasma_feedback: 2
};

/**
 * WebGLShaderEngine: Gestiona el contexto WebGL, la textura acústica 256x2,
 * los dos framebuffers ping-pong (FBO_A y FBO_B) para feedback loops y el post-procesado Y2K.
 */
export class WebGLShaderEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [options]
   * @param {WebGLRenderingContext} [options.gl]
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.injectedGl = options.gl || null;
    this.gl = null;

    this.visualState = {
      mode: 'warp_tunnel',
      paletteIndex: 0,
      crtEnabled: true
    };

    this.feedbackProgram = null;
    this.postProgram = null;
    this.quadBuffer = null;
    this.audioTexture = null;
    this.audioBufferData = new Uint8Array(256 * 2);

    this.fboA = null;
    this.fboB = null;
    this.readFbo = null;
    this.writeFbo = null;

    this.isInitialized = false;
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`GLSL Shader compilation failed: ${info}`);
    }
    return shader;
  }

  createProgram(vertSource, fragSource) {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vertSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error(`WebGL Program link failed: ${info}`);
    }
    return program;
  }

  createPingPongTarget(width, height) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      Math.max(1, width),
      Math.max(1, height),
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { fbo, texture, width, height };
  }

  init() {
    this.gl =
      this.injectedGl ||
      this.canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false }) ||
      this.canvas.getContext('experimental-webgl');

    if (!this.gl) {
      throw new Error('WebGL context is not supported in this browser/environment.');
    }

    const gl = this.gl;

    // 1. Compilar programas Pass 1 (Feedback + Modos) y Pass 2 (Palette Cycling + CRT)
    this.feedbackProgram = this.createProgram(FULLSCREEN_VERTEX_SHADER, FEEDBACK_FRAGMENT_SHADER);
    this.postProgram = this.createProgram(FULLSCREEN_VERTEX_SHADER, POSTPROCESS_FRAGMENT_SHADER);

    // 2. Crear geometría de pantalla completa (2 triángulos)
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 3. Crear textura acústica 256x2 (fila 0: FFT, fila 1: TimeDomain)
    this.audioTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.audioTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      256,
      2,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      this.audioBufferData
    );

    // 4. Inicializar ping-pong FBOs (FBO_A y FBO_B)
    const width = this.canvas.width || 800;
    const height = this.canvas.height || 600;
    this.fboA = this.createPingPongTarget(width, height);
    this.fboB = this.createPingPongTarget(width, height);
    this.readFbo = this.fboA;
    this.writeFbo = this.fboB;

    this.isInitialized = true;
    return true;
  }

  resize(width, height) {
    if (!this.canvas) return;
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    if (this.canvas.width === safeWidth && this.canvas.height === safeHeight) {
      return;
    }
    this.canvas.width = safeWidth;
    this.canvas.height = safeHeight;

    if (!this.isInitialized || !this.gl) return;
    const gl = this.gl;

    if (this.fboA) {
      gl.deleteTexture(this.fboA.texture);
      gl.deleteFramebuffer(this.fboA.fbo);
    }
    if (this.fboB) {
      gl.deleteTexture(this.fboB.texture);
      gl.deleteFramebuffer(this.fboB.fbo);
    }

    this.fboA = this.createPingPongTarget(safeWidth, safeHeight);
    this.fboB = this.createPingPongTarget(safeWidth, safeHeight);
    this.readFbo = this.fboA;
    this.writeFbo = this.fboB;
  }

  setVisualState(partialState = {}) {
    if (partialState.mode && Object.prototype.hasOwnProperty.call(MODE_TO_INT, partialState.mode)) {
      this.visualState.mode = partialState.mode;
    }
    if (partialState.paletteIndex !== undefined) {
      const idx = Number(partialState.paletteIndex);
      if (idx >= 0 && idx <= 3) {
        this.visualState.paletteIndex = idx;
      }
    }
    if (typeof partialState.crtEnabled === 'boolean') {
      this.visualState.crtEnabled = partialState.crtEnabled;
    }
  }

  updateAudioTexture(audioFrame) {
    const gl = this.gl;
    if (audioFrame && audioFrame.frequencyData && audioFrame.timeDomainData) {
      this.audioBufferData.set(audioFrame.frequencyData.subarray(0, 256), 0);
      this.audioBufferData.set(audioFrame.timeDomainData.subarray(0, 256), 256);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.audioTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      256,
      2,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      this.audioBufferData
    );
  }

  bindQuadPosition(program) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  }

  /**
   * Renderiza el fotograma actual en dos pasadas (Pass 1: Ping-Pong Feedback FBO, Pass 2: Pantalla con Paleta + CRT).
   * @param {AudioAnalysisFrame} audioFrame
   * @param {number} timeSeconds
   */
  renderFrame(audioFrame, timeSeconds = 0) {
    if (!this.isInitialized || !this.gl) return;
    const gl = this.gl;
    const width = this.canvas.width || 800;
    const height = this.canvas.height || 600;

    this.updateAudioTexture(audioFrame);

    const bass = audioFrame ? audioFrame.bassEnergy : 0.0;
    const mid = audioFrame ? audioFrame.midEnergy : 0.0;
    const high = audioFrame ? audioFrame.highEnergy : 0.0;
    const beatPulse = audioFrame ? audioFrame.beatPulse : 0.0;
    const modeInt = MODE_TO_INT[this.visualState.mode] ?? 0;

    // --- PASS 1: Renderizar hacia writeFbo leyendo de readFbo (Feedback Loop + Geometría) ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.writeFbo.fbo);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.feedbackProgram);
    this.bindQuadPosition(this.feedbackProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.readFbo.texture);
    gl.uniform1i(gl.getUniformLocation(this.feedbackProgram, 'u_prevFrame'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.audioTexture);
    gl.uniform1i(gl.getUniformLocation(this.feedbackProgram, 'u_audioData'), 1);

    gl.uniform2f(gl.getUniformLocation(this.feedbackProgram, 'u_resolution'), width, height);
    gl.uniform1f(gl.getUniformLocation(this.feedbackProgram, 'u_time'), timeSeconds);
    gl.uniform1f(gl.getUniformLocation(this.feedbackProgram, 'u_bass'), bass);
    gl.uniform1f(gl.getUniformLocation(this.feedbackProgram, 'u_mid'), mid);
    gl.uniform1f(gl.getUniformLocation(this.feedbackProgram, 'u_high'), high);
    gl.uniform1f(gl.getUniformLocation(this.feedbackProgram, 'u_beatPulse'), beatPulse);
    gl.uniform1i(gl.getUniformLocation(this.feedbackProgram, 'u_mode'), modeInt);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- PASS 2: Renderizar a Pantalla aplicando Palette Cycling Y2K y Filtro CRT ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.postProgram);
    this.bindQuadPosition(this.postProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.writeFbo.texture);
    gl.uniform1i(gl.getUniformLocation(this.postProgram, 'u_prevFrame'), 0);

    gl.uniform2f(gl.getUniformLocation(this.postProgram, 'u_resolution'), width, height);
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'u_time'), timeSeconds);
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'u_bass'), bass);
    gl.uniform1f(gl.getUniformLocation(this.postProgram, 'u_beatPulse'), beatPulse);
    gl.uniform1i(
      gl.getUniformLocation(this.postProgram, 'u_palette'),
      this.visualState.paletteIndex
    );
    gl.uniform1i(
      gl.getUniformLocation(this.postProgram, 'u_crtEnabled'),
      this.visualState.crtEnabled ? 1 : 0
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- Intercambio Ping-Pong ---
    const temp = this.readFbo;
    this.readFbo = this.writeFbo;
    this.writeFbo = temp;
  }
}
