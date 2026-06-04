/**
 * Must match backend STAGE_N. Override with VITE_STAGE_N in frontend/.env.
 */
const raw = import.meta.env.VITE_STAGE_N ?? import.meta.env.VITE_TOTAL_SESSIONS ?? '30';
const n = Number(raw);

export const TOTAL_SESSIONS = Number.isFinite(n) && n >= 1 ? n : 30;
export { TOTAL_SESSIONS as n };
