# HF Training — developer handover

This package is a first Appwrite-backed deployment candidate. It has local policy and simulated browser coverage, but has not been deployed to or tested against the owner's Appwrite project. A working cloud integration and a security/privacy review remain release gates. Do not describe it as a complete, validated learning-management product.

## Architecture

GitHub Pages serves the self-contained index.html. Its Appwrite Web SDK is bundled, not fetched from a third-party CDN. Browser sessions call Appwrite Functions through the authenticated executions API. The function verifies the invoking JWT through Account.get, checks the enrolled profile and active status, and checks hfadmin for administrator profiles. It never trusts an email or role sent in a request body. Unverified accounts can manage their password and view their own account screen; they cannot access educational records.

The function's ephemeral server key can read/write rows, users and files. Because it bypasses database permissions, every operation is authorized in server/domain.mjs. New tables and the document bucket have no direct client permissions. Do not add public or general authenticated-user permissions. The pre-existing Academies table keeps the owner's explicitly configured hfadmin access. It contains academy names only. Tutors see educational records for students currently assigned to their academy; IQAs see educational records across academies; employers see linked students' reviews/signatures only. Student contact details are withheld from employers and non-admin staff responses. Photo-consent records are visible to the student and administrators. Safeguarding messages are email drafts and are never stored in these tables.

Public identifiers in server/config.mjs are configuration, not credentials. There is no static owner password, API key or email-based privilege bypass. The setup key is supplied through a GitHub Actions secret, then revoked. The backend package is built separately with a pinned Node SDK. Default function logging is off, and code never logs request bodies or credentials. Administrators with Appwrite console access still control underlying resources and may inspect execution metadata: application signatures are not tamper-proof against project owners.

## Implemented workflows

- Appwrite email/password sign-in, verification, password recovery, temporary-password replacement, sign-out.
- Administrator creates academies, student/staff/employer accounts, optional 6008 unit assignments, and academy/employer assignments. Account deactivation protects the owner and the acting admin from self-disable.
- Students aged 16+ enrolment fields: name, email, date of birth, contact/address, emergency contact, parent/carer details where appropriate, employer/placement, course and start date.
- Separate VRQ course with the five requested units, and 6008-04 with mandatory headings plus selectable optional units.
- Student practical submissions and private PDF/JPG/PNG evidence, tutor assessment, independent IQA sampling and checklists.
- Administrator-published versioned unit checklists and tutor unit sign-off tied to an approved version and evidence references.
- Attendance, learning-hour records, exam results, course resources.
- Four-week VRQ review target, immutable attendance snapshot, tutor signature, student/employer feedback and signatures, administrator approval/return.
- Separate teaching/marketing photo choices, including refusal, with dated user-linked acknowledgements and retained history.
- Admin student-record JSON export. File bytes remain separate in the private bucket.
- Persistent support button, named safeguarding contacts, relevant external links and user-sent email drafts.
- Responsive phone layout and home-screen manifest. Online access required.

## Material limits and follow-up work

- Live Appwrite API compatibility, plan quotas, email deliverability, browser session behavior and GitHub deployment are not yet verified. The installer may need adjustments for the project's deployed cloud version. No cloud access was available to the author.
- This is an initial implementation, not certification of compliance or a complete apprenticeship management system. The NVQ is a qualification, not the entire apprenticeship standard, EPA or funding compliance workflow.
- Full copyrighted assessment requirements are not copied. The centre must publish and validate checklists, including required observations, range and knowledge, against its correct handbook. Default unit headings are not a complete assessment framework. NVQ optional credit combinations are not automatically validated. VRQ selected units are not represented as a complete diploma.
- Signed educational submissions and decisions are append-only in the application. Corrections require a new record and an explanation referencing the original; there is no general record amendment UI. One assessor decision and one IQA response per assessed record are enforced with deterministic IDs. Reassessment uses a new practical submission; a returned review requires a new review.
- There is no configurable IQA annual sampling-plan calendar or repeated action-resolution thread. Sample reason, checklist, decision and feedback are supported.
- Digital acknowledgements store authenticated user ID, typed name, server timestamp and review/sign-off digest. They are not qualified digital certificates. No claim of automatic legal compliance is made.
- Guardian accounts/guardian countersignatures, retention/deletion administration, attendance correction controls, enrolment transfer between courses, notification automation and bulk imports are not implemented.
- Photo consent wording is a starting form. The academy must approve its privacy notice, image-use purposes and any parent/carer process before using it with minors. Emergency contact collection is not proof of guardian consent.
- Files limited to 1 MB each, PDF/JPG/PNG; max 10 attachments to a practical record. The function handles bytes after access checks; it does not expose permanent public URLs. Appwrite antivirus/encryption options are requested but must be verified as active and available on the selected plan. No video upload or custom malware scanner.
- Records use JSON payloads with 14,000-character maximum; oversized reviews fail instead of silently truncating. A developer should normalize high-volume data and add full pagination. Internal list limit is 10,000 rows, with a visible error above it. Attendance snapshots currently include all available attendance, not a selectable date range.
- Current tutorial-style manual hfadmin access to the Academies table permits trusted admins to directly change academy names outside the function audit. Consider removing direct table access in a production audit design.
- There are no scheduled backups or notifications provisioned. Free projects have quota/inactivity constraints. Exporting JSON alone does not back up authentication or evidence bytes. A developer must implement and test complete backup/restore, retention and operational monitoring.
- Do not rely on the site for emergency safeguarding alerts. Email opens a compose window and cannot report delivery. No automatic admin message or case record is created.
- Home-screen installation depends on browser support. No service worker or offline record cache is included. Appwrite SDK may use its documented session fallback storage when cross-site cookies are blocked; do not equate this with local-only accounts.

## Testing and development

Run `npm ci`, `npm test`, `npm run build` with Node 22+. The root index.html is generated from web sources; edit sources and rebuild. The browser test uses Playwright and a mocked Appwrite transport calling the actual domain logic; it is not proof of cloud deployment. See TEST-RESULTS.md.

Setup is deliberately explicit through workflow_dispatch. Never add secrets to client config or expose a provisioning route on the public app. Backend schemas are reused, not dropped, by the installer. Do not rerun against a different project without reviewing every configured ID.

## Confirmed identifiers

| Resource | ID |
|---|---|
| Project | 6ab9947a003c1ea2f143 |
| Database | 6ab99eb9001702599541 |
| Academies table | 6ab99f580005a8ab2027 |
| Existing academy row | 6ab9a033002263bf0b07 |
| Owner user | 6ab99c6600126c17cd4f |
| Owner label | hfadmin |
| New profiles table | hfprofiles |
| New records table | hfrecords |
| New file bucket | hfdocuments |
| New function | hfapi |

Region endpoint: https://fra.cloud.appwrite.io/v1
