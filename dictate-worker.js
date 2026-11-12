// Notile on-device dictation worker.
// Runs OpenAI Whisper (base.en, 8-bit) with transformers.js entirely in the browser.
// The engine and model are served from this site (vendor/ and models/); nothing is
// fetched from anywhere else and audio never leaves the device.
import { pipeline, env } from './vendor/transformers/transformers.min.js';

const base = new URL('./', self.location.href).href;
env.allowRemoteModels = false;
env.allowLocalModels = true;
// site-relative path: transformers.js only probes for optional files (tokenizer, preprocessor) on non-http paths
env.localModelPath = new URL('./', self.location.href).pathname + 'models/';
env.backends.onnx.wasm.wasmPaths = base + 'vendor/transformers/';
env.backends.onnx.wasm.numThreads = 1; // GitHub Pages is not cross-origin isolated

const MODEL = 'onnx-community/whisper-base.en';
let asrP = null;
const files = {};

function load() {
  if (!asrP) {
    asrP = pipeline('automatic-speech-recognition', MODEL, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: (p) => {
        if (p && p.file && typeof p.loaded === 'number' && p.total) {
          files[p.file] = [p.loaded, p.total];
          let l = 0, t = 0;
          for (const [a, b] of Object.values(files)) { l += a; t += b; }
          postMessage({ type: 'progress', loaded: l, total: t });
        }
      },
    }).catch((e) => { asrP = null; throw e; });
  }
  return asrP;
}

self.onmessage = async (e) => {
  const m = e.data || {};
  try {
    if (m.type === 'load') {
      await load();
      postMessage({ type: 'ready' });
    } else if (m.type === 'run') {
      const asr = await load();
      const out = await asr(m.audio, { chunk_length_s: 30, stride_length_s: 5 });
      postMessage({ type: 'result', id: m.id, text: String((out && out.text) || '').trim() });
    }
  } catch (err) {
    postMessage({ type: 'error', id: m.id, message: String((err && err.message) || err) });
  }
};
