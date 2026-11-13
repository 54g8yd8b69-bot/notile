# Notile

Click-through clinical note templates for UK dental hospital use. Tap through a template, check the note, and copy it into the records system.

Open the app: https://notile.co.uk/notile/

Build your own templates with **+ New template**: add sections and fields (short or long text, pick-one or pick-any chips, numbers, tooth chart) or ready-made sets (medical history, consent, local anaesthetic, isolation, radiographs, BPE). Your templates are saved on your device and included in Backup.

## Notile Chart

Palmer dental charting and six-point pocket charting (6PPC). Charts existing and planned work, caries depth, root caries, fixed and removable prosthodontics, mixed dentition and retained primary teeth, then builds a copy-paste note and a chart image.

Open the chart: https://notile.co.uk/notile/chart/

The same chart is built into Notile (Dental chart button), where the summary and image go into the main note.

## Results from Guide Card

On notile.co.uk, the BSP periodontal diagnosis, IOTN and RD-IOTN tools in Guide Card have a **Send to Notile** button. The result waits in a bar above the note until you tap **Add to** the patient you mean (or Dismiss); it then appears in the note under *Assessments (from Guide Card)*. It is passed through this browser's storage only and clears after 12 hours.

## Dictation

Every free-text box, and the note itself, has a **🎤 Dictate** button. Tap it, speak, then tap **Stop** (or press Esc). Speech is turned into text in the browser by OpenAI's Whisper model (base.en), which is served from this site, so audio never leaves the device. The microphone is on only between Dictate and Stop.

- The first use downloads about 100 MB from this site (engine in `vendor/`, model in `models/`), once; the browser keeps it.
- Fast mode (chosen in the Dictate app, shared with these buttons) uses Whisper tiny.en (about 40 MB): roughly twice as fast, a little less accurate.
- If it is slow in Microsoft Edge, turn off enhanced security for the site (padlock → "Use enhanced security for this site"): Edge runs WebAssembly in a slow interpreter on sites it doesn't know.
- Say "full stop", "comma", "question mark", "new line" or "new paragraph" for layout. "Upper left six" becomes UL6, and spelt-out letters like G.I.C. become GIC.
- Where on-device dictation can't run (the offline single file, an older browser, no microphone), the button falls back to the device's own voice typing tip.

## Privacy

- Runs entirely in the browser. Nothing is sent anywhere, including dictation audio, which is transcribed on the device.
- Notile drafts are kept on the device you use and clear 12 hours after each patient is started. Standalone charts stay in that browser until deleted.
- Do not type patient names, CHI or hospital numbers.
- Notile and Notile Chart are writing and recording aids, not clinical decision tools. Check every note and chart before it goes into the record; the clinician remains responsible for its accuracy.
- Clinic and supervisor names are typed by each user and remembered only on their own device.

## Tests

Every push runs browser tests (`tests/smoke.js`) on GitHub Actions: every template must build a note, the chart must draw, and template sharing and the trauma grid must work. Run them locally with `BASE=http://localhost:8765 node tests/smoke.js` while serving the site.
