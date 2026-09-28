# Validation record — 28 September 2026

## Passed locally

15 automated server-policy and function-entry checks (`npm test`):
- Missing JWT and non-POST requests denied.
- Unverified email denied educational records; identity lookup uses the authenticated account ID, not a supplied user-ID header.
- Tutor academy boundary, student peer boundary and employer assignment boundary.
- Student denied academy/account creation.
- Disabled accounts and temporary-password restriction.
- VRQ learner denied an unenrolled NVQ unit.
- Employer profile/record field restrictions.
- Practical submission > assessor decision > independent IQA sample.
- Duplicate assessment decisions rejected.
- Review approval requires student and required employer signatures.
- Duplicate administrator decision rejected.
- Unit sign-off blocked without a configured checklist.
- Spoofed evidence file and unauthorized upload rejected.
- Photo-consent refusal accepted; admin cannot impersonate student consent.
- Admin/assessor cannot IQA their own assessment.
- Course resources limited to enrolled course.

Browser checks with a simulated Appwrite transport calling the actual domain logic:
- Owner sign-in and creation of a second academy.
- Student role navigation, signed practical submission.
- Tutor assessment and review creation.
- IQA sampling flow.
- Support dialog and external support links.
- Desktop and 390px phone layout; no horizontal document overflow.
- No uncaught page JavaScript errors in the completed browser run.

Screenshots in docs/ show fictional records. They are not screenshots of a live Appwrite deployment.

## Not yet verified

No administrator API key or authenticated cloud access was supplied. The Appwrite provisioning script, backend deployment, live CORS/session behavior, actual file storage, verification/reset emails, GitHub Actions and cross-device access have not been executed against the user's project. Schema/index availability and free-plan compatibility must be checked during installation.

This is a code package awaiting live acceptance checks, not evidence that the service is production-ready. Complete docs/LIVE-CHECKS.md before real enrolment.

## Reproduce

Node 22+: npm ci; npm test; npm run build.
Browser test: install playwright-core and provide CHROMIUM_EXECUTABLE for an installed Chromium binary, then run node tests/browser.mjs from the project folder. PLAYWRIGHT_MODULE_PATH can point to a preinstalled module. CHROMIUM_ARGS can supply a JSON array of browser arguments. Browser network is intercepted by the harness; no real student data or cloud credentials are used.
