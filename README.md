# HF Training — learning workflow update

This is the 29 September 2026 update for the existing GitHub Pages / Appwrite application. Start with **UPDATE-INSTRUCTIONS.txt**. Both the backend function and the website must be updated.

Changes include separate sign-up and start dates, 28-day VRQ / 84-day NVQ review reminders, named tutor assignments, multi-unit practical evidence with versioned criterion checklists, independent IQA progress verification, training check-in/register/calendar, signed work experience logs, eight-character password requirements with live indicators, contact information, and private learning-resource attachments.

`npm test` runs backend/authentication regression tests. `npm run build` produces the self-contained `index.html`. Browser testing uses `tests/browser.mjs`, Playwright and an installed Chromium binary; it simulates Appwrite with the real domain rules and does not modify the live project.

Use `setup/deploy-backend.mjs` through the new manual Update HF Training backend workflow for this existing installation. The original installer remains available for the original installation process.

Centre-approved qualification criteria must be populated before real criterion sign-off. The included learning-resource starters and consultation prompts are editable teaching aids, not an approved qualification handbook. Assessor and tutor remain a combined role with explicitly assigned learners.


The supplied consultation and VRQ marking sheets are included in this revision. See docs/ASSESSMENT-SHEET-NOTES.md (ASSESSMENT-SHEET-NOTES.md within docs) for coverage, marking rules and missing requirements. The source module is server/assessment-sheets.mjs.
