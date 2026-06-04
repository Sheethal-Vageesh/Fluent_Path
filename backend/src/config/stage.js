/**
 * Stage configuration — change session count in one place.
 * Set STAGE_N in backend/.env (e.g. STAGE_N=30).
 */
const raw = process.env.STAGE_N ?? process.env.TOTAL_SESSIONS ?? '30';
const n = Number(raw);

if (!Number.isFinite(n) || n < 1 || n > 365) {
  throw new Error(
    `Invalid STAGE_N="${raw}". Must be a number between 1 and 365.`
  );
}

module.exports = { n, TOTAL_SESSIONS: n };
