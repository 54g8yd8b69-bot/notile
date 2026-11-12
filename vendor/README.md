# Vendored libraries

Served from this site so Notile's dictation needs no third-party requests (the page CSP allows only `'self'`).

| File | Source | Licence |
|---|---|---|
| `transformers/transformers.min.js` | `@huggingface/transformers` 4.3.2 (npm) | Apache-2.0 (`LICENSE-transformers.txt`) |
| `transformers/ort-wasm-simd-threaded.asyncify.{mjs,wasm}` | `onnxruntime-web` 1.31.0-dev.20260914-8d85527a0 (npm, the version transformers.js 4.3.2 expects) | MIT (`LICENSE-onnxruntime.txt`) |

The speech model in `../models/onnx-community/whisper-base.en/` is OpenAI Whisper base.en (MIT), ONNX export by onnx-community on Hugging Face; only the 8-bit (`_quantized`) encoder and merged decoder are included.

To upgrade transformers.js, replace `transformers.min.js` and copy the matching `ort-wasm-simd-threaded.asyncify.*` files from the `onnxruntime-web` version listed in its `package.json`, then run the browser tests.
