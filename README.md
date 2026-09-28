# HF Training

Hairforce1 Training Academy learning workspace. GitHub Pages frontend with an Appwrite backend.

Start with [START-HERE.txt](START-HERE.txt). This is a deployment candidate: cloud installation and the checks in [docs/LIVE-CHECKS.md](docs/LIVE-CHECKS.md) are still required before real enrolment.

No API key or password belongs in this repository. Initial setup uses the APPWRITE_SETUP_KEY GitHub Actions secret; revoke it after installation.

- `index.html`: generated, self-contained website
- `web/`: editable website source
- `server/`: Appwrite API, permission checks and data access
- `setup/`: build and backend installation
- `.github/workflows/`: explicit backend installation and website publication
- `tests/`: role/workflow checks
- `docs/HANDOVER.md`: architecture, capabilities and limits

Node 22+: `npm ci`, `npm test`, `npm run build`.
