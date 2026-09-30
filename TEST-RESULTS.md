# Validation — 29 September 2026

**34 automated tests passed. Build succeeded. Chromium desktop and mobile workflow tests passed.**

The tests run locally with fictional learners. Browser requests to Appwrite are intercepted and handled by the actual domain logic with an in-memory store. No live account, password, database or deployment was changed during these tests.

## Verified

- Authentication requires the caller's Appwrite JWT; verification and temporary-password gates remain enforced.
- Existing shorter current passwords are accepted by the change-password handler; 8–128 characters, uppercase and number requirements are enforced for new passwords. Leading/trailing spaces are preserved.
- Review dates use 28 days for VRQ and 84 for NVQ, handle leap dates and honour a recorded next-review date.
- Named tutor assignments restrict same-academy access; cross-academy, peer, employer and unauthorised role access remain blocked.
- Multi-unit evidence carries learner-signed criterion claims. Assessors cannot add unsupported claims. Stale frameworks and invalid criteria are rejected.
- Criterion percentages do not advance before independent IQA verification. Returned assessments/action-required IQA records do not add credit. Final unit progress requires the separate assessor and IQA unit sign-off.
- Student check-in is not confirmed attendance. Bulk register checks all requested permissions before writing; display and totals use the latest correction for each day.
- Placement targets require three separate six-hour days. Duplicate dates are blocked until a tutor returns a record; signed replacements do not double-count time. Students cannot approve their own logs.
- Private learning-resource attachments are restricted by role, course and assigned-student access.
- Existing upload type/size checks, immutable review approvals, photo consent and course-scoped resources still pass.

## Browser journey

The Chromium journey exercised sign-up date editing and named assignments, role-specific enrolment fields, green password indicators, student check-in, tutor register, calendar, signed placement log and tutor approval, a practical mapped to two units and four criteria, assessor confirmation, independent IQA verification, progress review, an image resource, complete unit sign-off and a student dashboard showing 20% finalised units (one of five).

Desktop and 390px-wide phone screenshots were inspected. No uncaught browser page errors or page-width overflow occurred. Expected 401 responses from the simulated signed-out account lookup are part of the login test.

During testing, a build bug caused JavaScript dollar sequences to be interpreted as HTML replacement text. The build now uses callback replacements; the rebuilt page passed the complete browser journey.

## Not verified live

- Deployment of this update into the user's Appwrite project and GitHub Pages.
- Appwrite project password-strength configuration and real email password recovery.
- Actual approved unit criteria, required observation counts, consultation sheets and learning-image rights.
- Production load, very large learner histories and external security review.

Use UPDATE-INSTRUCTIONS.txt for the short live test checklist after upload.

## Reproducing tests

Run `npm ci --ignore-scripts`, `npm test`, and `npm run build`.

For browser testing, install Playwright Core and Chromium, then run `node tests/browser.mjs` with PLAYWRIGHT_MODULE_PATH and CHROMIUM_EXECUTABLE pointing to those installations. Tests use a local server on port 8124 and do not require production credentials.

## Photographed assessment sheets

Five additional tests cover service-column separation, marking limits, incomplete/failed outcomes, Unit 202 alternatives, VRQ-only presets, blocked premature whole-unit sign-off and signed consultation validation. The browser journey also publishes the Unit 211 preset, records consultation fields, and validates thirteen assessor decisions with a 23-mark Distinction. No live writes.

Unit 210 continuation: all 15 criteria and both service columns tested, including Pass/Merit/Distinction boundary scores, unmarked second service, failed required criterion and the additional 1/1/3/3 mark scales. Build regenerated.
