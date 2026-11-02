# Notile

Click-through clinical note templates for UK dental hospital use. Tap through a template, check the note, and copy it into the records system.

Open the app: https://notile.co.uk/notile/

Build your own templates with **+ New template**: add sections and fields (short or long text, pick-one or pick-any chips, numbers, tooth chart) or ready-made sets (medical history, consent, local anaesthetic, isolation, radiographs, BPE). Your templates are saved on your device and included in Backup.

## Notile Chart

Palmer dental charting and six-point pocket charting (6PPC). Charts existing and planned work, caries depth, root caries, fixed and removable prosthodontics, mixed dentition and retained primary teeth, then builds a copy-paste note and a chart image.

Open the chart: https://notile.co.uk/notile/chart/

The same chart is built into Notile (Dental chart button), where the summary and image go into the main note.

## Privacy

- Runs entirely in the browser. Nothing is sent anywhere.
- Notile drafts are kept on the device you use and clear 12 hours after each patient is started. Standalone charts stay in that browser until deleted.
- Do not type patient names, CHI or hospital numbers.
- Notile and Notile Chart are writing and recording aids, not clinical decision tools. Check every note and chart before it goes into the record; the clinician remains responsible for its accuracy.
- Clinic and supervisor names are typed by each user and remembered only on their own device.

## Tests

Every push runs browser tests (`tests/smoke.js`) on GitHub Actions: every template must build a note, the chart must draw, and template sharing and the trauma grid must work. Run them locally with `BASE=http://localhost:8765 node tests/smoke.js` while serving the site.
