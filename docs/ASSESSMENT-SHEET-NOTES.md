# Supplied assessment sheets — 29 September 2026

Implemented from the eight photographs supplied by the academy. Editions and qualification approval numbers were not visible. These are VRQ presets, not assumed NVQ requirements.

| Unit | Preset | Marking |
|---|---|---|
| 202 | Tasks 1a chart, 1b poster, 1c leaflet, 1d chart OR approved online test | Completion/pass decisions; no practical task |
| 203 | Shampoo/conditioning, styling, one other consultation service | Nine criteria per service; criteria 1, 2, 7 score 1–3; others 1. Pass 9–10, Merit 11–13, Distinction 14–15 |
| 204 | Dry, product build-up/oily, normal hair | Nine criteria per service; criteria 2, 4, 8, 9 score 1–3. Pass 9–10, Merit 11–14, Distinction 15–17 |
| 210 | Uniform layered and graduated looks | All 15 criteria per style; criteria 2, 3, 5, 14, 15 score 1–3. Pass 15–17, Merit 18–22, Distinction 23–25 |
| 211 | Tapered beardline, full beard outline, moustache only | Thirteen criteria per service; criteria 2, 3, 5, 12, 13 score 1–3. Pass 13–15, Merit 16–20, Distinction 21–23 |

Unmarked criteria remain incomplete. Zero means not yet achieved and prevents a pass, regardless of the total. Grades apply to each service observation, not to the entire qualification. Marks cannot exceed the source scale. A learner’s claim is separate from the assessor’s confirmation and marks.

The consultation form includes client reference and new/regular status, characteristics, hair/scalp condition, growth, products, face shape, tools, looks, techniques, outlines, finish, contraindication answers and aftercare. Unanswered contraindications stay Not assessed. The signed record retains the choices. Images are uploaded privately and can be linked to multi-unit evidence.

The academy planning sheet’s extra looks (including partial beard and eyebrow shape) are retained as descriptive choices; they do not substitute for the logbook service ranges. Its heading 210 Style & Finish / 209 Cutting conflicts with the photographed VRQ logbook’s Unit 210 cutting. The preset follows the photographed VRQ logbook. The planning sheet’s shaving section is not added as an enrolled VRQ unit without its approved requirements.

## Still needed

- Full knowledge requirements for practical units, Unit 202 task briefs, and any required further observations/ranges.
- Qualification title, code and edition to confirm the applicable version.
- Separate NVQ sheets for the NVQ route.

All photo presets have unitCompletionReady=false: practical criteria can earn independently verified criterion coverage, but final whole-unit sign-off stays blocked. An administrator can publish a complete, centre-approved manual framework once the full requirements are established. Previous signed versions stay intact; new versions do not automatically transfer old criterion credit. Never claim the photo presets alone establish qualification completion.

## Deployment and validation

See UPDATE-INSTRUCTIONS.txt. Upload server/assessment-sheets.mjs along with the other backend files before running the update workflow; then publish the rebuilt index.html. No live deployment or database mutation was performed while preparing this package.

34 automated tests and the simulated browser workflow passed. The new browser journey publishes Unit 211, captures signed consultation information, submits the thirteen tapered-beardline criteria and verifies assessor marks total 23 with Distinction. Appwrite calls are simulated with the real domain rules and fictional accounts; live project settings still need checking after deployment.

Unit 210 continuation received and added: criteria 12 finished cut/client satisfaction, 13 safe and hygienic practice, 14 aftercare, 15 professional communication. Practical grading is enabled. Old partial checklist versions remain unchanged; publish the complete preset as a new version before new evidence is submitted.
