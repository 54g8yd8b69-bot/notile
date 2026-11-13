// Notile on-device dictation worker (used by Notile's Dictate buttons and the Dictate app).
// Runs OpenAI Whisper (base.en, or tiny.en for Fast mode; 8-bit) with transformers.js entirely in the browser.
// The engine and model are served from this site (vendor/ and models/); nothing is
// fetched from anywhere else and audio never leaves the device.
import { pipeline, env } from './vendor/transformers/transformers.min.js';

const base = new URL('./', self.location.href).href;
const MODELS = { base: 'onnx-community/whisper-base.en', fast: 'onnx-community/whisper-tiny.en' };
const MODEL_CACHE = 'notile-dictate-v1'; // bump when the model or engine files change

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.useBrowserCache = false; // this worker keeps its own single copy (below)
// site-relative path: transformers.js only probes for optional files (tokenizer, preprocessor) on non-http paths
env.localModelPath = new URL('./', self.location.href).pathname + 'models/';
env.backends.onnx.wasm.wasmPaths = base + 'vendor/transformers/';
env.backends.onnx.wasm.numThreads = 1; // GitHub Pages is not cross-origin isolated

// ---- download each file once, keep it (Cache API), share in-flight downloads ----
// transformers.js requests each model file more than once (a probe, then the load), and the browser's
// HTTP cache is not reliable behind the site login, so without this ~100 MB was fetched 2-4 times per visit.
const inflight = new Map();
const progress = {};
function report() {
  let l = 0, t = 0;
  for (const [a, b] of Object.values(progress)) { l += a; t += b; }
  if (t) postMessage({ type: 'progress', loaded: l, total: t });
}
async function openCache() { try { return await caches.open(MODEL_CACHE); } catch (e) { return null; } }
async function download(url, cache) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok || !res.body) return res;
  const total = Number(res.headers.get('content-length')) || 0;
  const name = url.split('/').pop();
  const reader = res.body.getReader();
  const parts = []; let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); loaded += value.length;
    if (total > 1e6) { progress[name] = [loaded, Math.max(total, loaded)]; report(); }
  }
  const blob = new Blob(parts);
  const type = res.headers.get('content-type') || 'application/octet-stream';
  const keep = new Response(blob, { status: 200, headers: { 'content-type': type, 'content-length': String(blob.size) } });
  if (cache) { try { await cache.put(url, keep.clone()); } catch (e) { /* storage full: still works, just not kept */ } }
  return keep;
}
async function cachedFetch(input, init) {
  const url = new URL(typeof input === 'string' ? input : (input.url || String(input)), self.location.href).href;
  if (!url.startsWith(base + 'models/') && !url.startsWith(base + 'vendor/')) return fetch(input, init);
  const cache = await openCache();
  if (cache) { const hit = await cache.match(url); if (hit) return hit; }
  if (!inflight.has(url)) inflight.set(url, download(url, cache).finally(() => setTimeout(() => inflight.delete(url), 0)));
  const res = await inflight.get(url);
  return res.clone();
}
env.fetch = cachedFetch;
// drop caches left by older versions of this worker, and transformers.js's own duplicate copy
caches.keys().then(ks => ks.filter(k => (k.startsWith('notile-dictate-') && k !== MODEL_CACHE) || k === 'transformers-cache').forEach(k => caches.delete(k))).catch(() => {});

const pipes = {};
async function load(key) {
  const k = MODELS[key] ? key : 'base';
  if (!pipes[k]) {
    pipes[k] = (async () => {
      // hand the WebAssembly engine to ONNX Runtime from the same cache, so it isn't re-downloaded either
      if (!env.backends.onnx.wasm.wasmBinary) {
        try {
          const w = await cachedFetch(base + 'vendor/transformers/ort-wasm-simd-threaded.asyncify.wasm');
          if (w.ok) env.backends.onnx.wasm.wasmBinary = await w.arrayBuffer();
        } catch (e) { /* falls back to ONNX Runtime's own fetch */ }
      }
      return pipeline('automatic-speech-recognition', MODELS[k], { device: 'wasm', dtype: 'q8' });
    })().catch((e) => { delete pipes[k]; throw e; });
  }
  return pipes[k];
}

self.onmessage = async (e) => {
  const m = e.data || {};
  try {
    if (m.type === 'load') {
      await load(m.model);
      postMessage({ type: 'ready', model: m.model });
    } else if (m.type === 'run') {
      const asr = await load(m.model);
      const secs = m.audio.length / 16000;
      const t0 = performance.now();
      const out = await asr(m.audio, {
        chunk_length_s: 30, stride_length_s: 5,
        // speech is ~3 words a second; capping tokens stops Whisper looping on noise or silence for minutes
        max_new_tokens: Math.min(440, Math.ceil(Math.min(secs, 30) * 7) + 24),
      });
      postMessage({ type: 'result', id: m.id, text: String((out && out.text) || '').trim(), ms: Math.round(performance.now() - t0) });
    }
  } catch (err) {
    postMessage({ type: 'error', id: m.id, message: String((err && err.message) || err) });
  }
};
