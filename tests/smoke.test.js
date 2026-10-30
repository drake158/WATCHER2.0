import { describe, it, expect } from 'vitest';
import { WebAudioEngine } from '../src/audio/WebAudioEngine.js';
import { WebGLShaderEngine } from '../src/visualizer/WebGLShaderEngine.js';

/**
 * Suite mínima constitucional (Principio IV - Minimal Testing):
 * Exactamente 2 smoke tests de integración:
 * 1. Instanciación de AudioContext y extracción de AudioAnalysisFrame con señal simulada.
 * 2. Inicialización y compilación del pipeline WebGL (shaders + ping-pong FBOs).
 */
describe('WATHCER 2.0 Minimal Integration Smoke Suite', () => {
  it('Smoke Test 1: initializes AudioContext + AnalyserNode and decodes simulated audio frame', async () => {
    class MockAnalyserNode {
      constructor() {
        this.fftSize = 512;
        this.smoothingTimeConstant = 0.8;
      }
      get frequencyBinCount() {
        return this.fftSize / 2;
      }
      connect() {}
      getByteFrequencyData(array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = i < 12 ? 220 : 90;
        }
      }
      getByteTimeDomainData(array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128 + Math.round(Math.sin(i * 0.2) * 40);
        }
      }
    }

    class MockAudioContext {
      constructor() {
        this.state = 'suspended';
        this.destination = {};
      }
      async resume() {
        this.state = 'running';
      }
      createAnalyser() {
        return new MockAnalyserNode();
      }
      createMediaElementSource() {
        return { connect() {} };
      }
    }

    const engine = new WebAudioEngine({
      fftSize: 512,
      audioContextFactory: () => new MockAudioContext()
    });

    await engine.init();
    expect(engine.isInitialized).toBe(true);

    // Verificar extracción con señal activa simulada desde el AnalyserNode
    engine.setSimulatedActive(true);
    const activeFrame = engine.getAnalysisFrame(1.25);

    expect(activeFrame.frequencyData).toBeInstanceOf(Uint8Array);
    expect(activeFrame.frequencyData.length).toBe(256);
    expect(activeFrame.timeDomainData).toBeInstanceOf(Uint8Array);
    expect(activeFrame.timeDomainData.length).toBe(256);
    expect(activeFrame.bassEnergy).toBeGreaterThan(0.5);
    expect(activeFrame.beatPulse).toBeGreaterThanOrEqual(0.0);
    expect(activeFrame.beatPulse).toBeLessThanOrEqual(1.0);
    expect(activeFrame.isSynthetic).toBe(false);
  });

  it('Smoke Test 2: initializes WebGL pipeline, compiles GLSL shaders, and renders ping-pong FBOs', () => {
    const compiledShaders = [];
    const createdFbos = [];
    const createdTextures = [];

    const mockGl = {
      VERTEX_SHADER: 0x8b31,
      FRAGMENT_SHADER: 0x8b30,
      COMPILE_STATUS: 0x8b81,
      LINK_STATUS: 0x8b82,
      ARRAY_BUFFER: 0x8892,
      STATIC_DRAW: 0x88e4,
      FLOAT: 0x1406,
      TEXTURE_2D: 0x0de1,
      TEXTURE0: 0x84c0,
      TEXTURE1: 0x84c1,
      TEXTURE_MIN_FILTER: 0x2801,
      TEXTURE_MAG_FILTER: 0x2800,
      TEXTURE_WRAP_S: 0x2802,
      TEXTURE_WRAP_T: 0x2803,
      LINEAR: 0x2601,
      CLAMP_TO_EDGE: 0x812f,
      RGBA: 0x1908,
      LUMINANCE: 0x1909,
      UNSIGNED_BYTE: 0x1401,
      FRAMEBUFFER: 0x8d40,
      COLOR_ATTACHMENT0: 0x8ce0,
      FRAMEBUFFER_COMPLETE: 0x8cd5,
      TRIANGLES: 0x0004,
      COLOR_BUFFER_BIT: 0x4000,

      createShader: (type) => ({ type, source: '' }),
      shaderSource: (shader, source) => {
        shader.source = source;
      },
      compileShader: (shader) => {
        compiledShaders.push(shader);
      },
      getShaderParameter: (shader) => Boolean(shader.source && shader.source.includes('void main')),
      getShaderInfoLog: () => '',
      deleteShader: () => {},

      createProgram: () => ({ linked: false }),
      attachShader: () => {},
      linkProgram: (program) => {
        program.linked = true;
      },
      getProgramParameter: (program) => Boolean(program.linked),
      getProgramInfoLog: () => '',
      useProgram: () => {},
      getAttribLocation: () => 0,
      getUniformLocation: (_prog, name) => ({ name }),

      createBuffer: () => ({}),
      bindBuffer: () => {},
      bufferData: () => {},
      enableVertexAttribArray: () => {},
      vertexAttribPointer: () => {},

      createTexture: () => {
        const tex = { id: createdTextures.length + 1 };
        createdTextures.push(tex);
        return tex;
      },
      bindTexture: () => {},
      ActiveTexture: () => {},
      activeTexture: () => {},
      texParameteri: () => {},
      texImage2D: () => {},
      texSubImage2D: () => {},
      deleteTexture: () => {},

      createFramebuffer: () => {
        const fbo = { id: createdFbos.length + 1 };
        createdFbos.push(fbo);
        return fbo;
      },
      bindFramebuffer: () => {},
      framebufferTexture2D: () => {},
      checkFramebufferStatus: () => 0x8cd5,
      deleteFramebuffer: () => {},

      viewport: () => {},
      clearColor: () => {},
      clear: () => {},
      uniform1i: () => {},
      uniform1f: () => {},
      uniform2f: () => {},
      drawArrays: () => {}
    };

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    const visualizer = new WebGLShaderEngine(canvas, { gl: mockGl });
    visualizer.init();

    expect(visualizer.isInitialized).toBe(true);
    expect(compiledShaders.length).toBeGreaterThanOrEqual(4);
    expect(createdFbos.length).toBe(2); // Ping-pong FBO_A and FBO_B

    // Probar cambio de modos y renderizado de un fotograma
    visualizer.setVisualState({ mode: 'oscilloscope_matrix', paletteIndex: 2, crtEnabled: true });
    visualizer.renderFrame(
      {
        frequencyData: new Uint8Array(256).fill(120),
        timeDomainData: new Uint8Array(256).fill(128),
        bassEnergy: 0.75,
        midEnergy: 0.4,
        highEnergy: 0.3,
        beatPulse: 0.9,
        isSynthetic: true
      },
      2.5
    );

    expect(visualizer.visualState.mode).toBe('oscilloscope_matrix');
    expect(visualizer.visualState.paletteIndex).toBe(2);
  });
});
