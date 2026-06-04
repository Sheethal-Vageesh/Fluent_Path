## FluentPath (MERN)

Full‑stack app for tracking parent–child interaction strategies in preschool children who stutter.

### Configuration

| Setting | Where | Purpose |
|--------|--------|---------|
| `STAGE_N` | `backend/.env` | Number of daily practice sessions (default **30**) |
| `VITE_STAGE_N` | `frontend/.env` | Must match `STAGE_N` for UI charts and labels |
| S3 vars | `backend/.env` | Cloud storage for practice/demo videos (see `backend/.env.example`) |

Change session count in one place on the server (`STAGE_N` in `backend/src/config/stage.js` reads from env). Mirror the same value in the frontend with `VITE_STAGE_N`.

**Video storage:** With `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET` set, uploads go to S3 and the public URL is stored in MongoDB (`practiceVideoUrl`, `demoVideoUrl`). Without S3, files are stored under `backend/uploads/` and served at `/uploads/...`.

Copy `backend/.env.example` and `frontend/.env.example` to `.env` and fill in values before running.

