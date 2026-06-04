import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button } from '../../components/ui'
import { api } from '../../lib/api'
import { motion } from 'framer-motion'

export function SessionStrategiesPage() {
  const { sessionNumber } = useParams()
  const nav = useNavigate()

  const [assignments, setAssignments] = useState([])
  const [submittedIds, setSubmittedIds] = useState([])
  const [sessionSubmitted, setSessionSubmitted] = useState(false)
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionAutoSubmitted, setSessionAutoSubmitted] = useState(false)
  const [sessionLocked, setSessionLocked] = useState(false)
  const [sessionLockedUntil, setSessionLockedUntil] = useState(null)
  const [severityRating, setSeverityRating] = useState(null)
  const [naturalnessRating, setNaturalnessRating] = useState(null)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const { data } = await api.get(
          `/api/parents/session/${sessionNumber}`
        )

        setAssignments(data.assignments || [])

        const submitted = (data.submissions || []).map(
          (s) => s.assignmentId
        )

        setSubmittedIds(submitted)
        setSessionSubmitted(data.sessionSubmitted || false)
        setSessionExpiresAt(data.sessionExpiresAt || null)
        setSessionActive(data.sessionActive || false)
        setSessionAutoSubmitted(data.sessionAutoSubmitted || false)
        setSessionLocked(data.sessionLocked || false)
        setSessionLockedUntil(data.sessionLockedUntil || null)

      } catch (err) {
        // Check if this is a lock error from backend (400 status)
        if (err?.response?.status === 400 && err?.response?.data?.lockedUntil) {
          setSessionLocked(true)
          setSessionLockedUntil(err.response.data.lockedUntil)
          setError(
            err.response.data.error ||
            'Session is locked'
          )
        } else {
          setError(
            err?.response?.data?.error ||
            'Failed to load session data'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionNumber])

  async function submitSession() {
    try {
      setBusy(true)
      setError(null)

      await api.post(
        `/api/parents/session/${sessionNumber}/submit`,
        {
          StutteringSeverityRating: severityRating,
          SpeechNaturalnessRating: naturalnessRating,
        }
      )

      setSessionSubmitted(true)

    } catch (err) {
      setError(
        err?.response?.data?.error ||
        'Failed to submit session'
      )
    } finally {
      setBusy(false)
    }
  }

  const kannadaDays = {
    1: "ಮೊದಲನೇ ದಿನ",
    2: "ಎರಡನೇ ದಿನ",
    3: "ಮೂರನೇ ದಿನ",
    4: "ನಾಲ್ಕನೇ ದಿನ",
    5: "ಐದನೇ ದಿನ",
    6: "ಆರನೇ ದಿನ",
    7: "ಏಳನೇ ದಿನ",
    8: "ಎಂಟನೇ ದಿನ",
    9: "ಒಂಬತ್ತನೇ ದಿನ",
    10: "ಹತ್ತನೇ ದಿನ",
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-end justify-between gap-3">
  
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Day {sessionNumber || '–'} /  {kannadaDays[sessionNumber] || '-'} 
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Practice all assigned strategies and submit progress.
            <br />
            ನೀಡಲಾದ ಎಲ್ಲಾ ತಂತ್ರಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ ಮತ್ತು ಪ್ರಗತಿಯನ್ನು ಸಲ್ಲಿಸಿ.
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-slate-600">
                Completed / ಪೂರ್ಣಗೊಂಡಿದೆ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-slate-600">
                Not Practiced / ಅಭ್ಯಾಸ ಮಾಡಿಲ್ಲ
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => nav('/parent/dashboard/practice')}
        >
          Back / ಹಿಂದೆ
        </Button>
      </div>

      {error && (
        <div className={`mt-4 rounded-xl border p-3 text-sm font-medium ${
          sessionLocked
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <div>{error}</div>
          {sessionLocked && sessionLockedUntil && (
            <div className="mt-2 text-xs opacity-90">
              This session will unlock at midnight IST on {new Date(sessionLockedUntil).toLocaleString()}
            </div>
          )}
        </div>
      )}

      <Card className="mt-5">

        {loading ? (
          <div className="text-sm text-slate-600">
            Loading strategies…
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No strategies assigned.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {assignments.map((a) => {
                const isSubmitted = submittedIds.includes(a.id)

                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <button
                      onClick={() =>
                        nav(
                          `/parent/strategies/${a.id}?session=${sessionNumber}`
                        )
                      }
                      className={`w-full rounded-2xl border p-4 text-left transition hover:shadow-md ${
                        isSubmitted
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {a.strategy?.title || 'Strategy'}
                      </div>

                      <div className="mt-2 text-xs">
                        {isSubmitted ? (
                          <span className="font-medium text-green-700">
                            ✔ Practiced / ಅಭ್ಯಾಸ ಮಾಡಲಾಗಿದೆ
                          </span>
                        ) : (
                          <span className="font-medium text-red-700">
                            ✖ Not Practiced / ಅಭ್ಯಾಸ ಮಾಡಿಲ್ಲ
                          </span>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        {a.strategy?.demoVideoUrl
                          ? 'Demo video available / ಡೆಮೊ ವೀಡಿಯೊ ಲಭ್ಯವಿದೆ'
                          : 'No demo video / ಡೆಮೊ ವೀಡಿಯೊ ಇಲ್ಲ'}
                      </div>

                      <div className="mt-4 text-xs font-semibold text-indigo-700">
                        View Strategy / ತಂತ್ರವನ್ನು ವೀಕ್ಷಿಸಿ →
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </div>

            {sessionActive && sessionExpiresAt ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This session is active until {new Date(sessionExpiresAt).toLocaleString()}.
                <br />
                ಈ ಸೆಷನ್ {new Date(sessionExpiresAt).toLocaleString()} ರವರೆಗೆ ಸಕ್ರಿಯವಾಗಿದೆ.
              </div>
            ) : null}

            {sessionAutoSubmitted ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
                This session was auto-submitted after 24 hours.
                <br />
                24 ಘಂಟೆಗಳ ನಂತರ ಈ ಸೆಷನ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Stuttering Severity Rating (0–9)
                 <br />
                ತೊದಲುವಿಕೆ ತೀವ್ರತಾ ಮೌಲ್ಯಮಾಪನ (0–9)
              </div>
               <div className="mt-1 text-xs text-slate-500">
                      0 = No stuttering / ತೊದಲುವಿಕೆ ಇಲ್ಲ
                      <br />
                      1 = Extremely mild stuttering / ಅತ್ಯಂತ ಕಡಿಮೆ ತೊದಲುವಿಕೆ
                      <br />
                      9 = Extremely severe stuttering / ಅತ್ಯಂತ ತೀವ್ರ ತೊದಲುವಿಕೆ
                    </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...Array(10)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSeverityRating(i)}
                    className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
                      severityRating === i
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">
                Speech Naturalness Rating (1–9)
                 <br />
                ಮಾತಿನ ಸಹಜತೆ ಮೌಲ್ಯಮಾಪನ (1–9)
              </div>
               <div className="mt-1 text-xs text-slate-500">
                      1 = Highly natural sounding speech / ಅತ್ಯಂತ ಸಹಜ ಮಾತು
                      <br />
                      9 = Highly unnatural sounding speech / ಅತ್ಯಂತ ಅಸಹಜ ಮಾತು
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...Array(9)].map((_, i) => {
                  const value = i + 1
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNaturalnessRating(value)}
                      className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
                        naturalnessRating === value
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="text-base text-red-600">
             Submit both ratings after completing all the strategies assigned for this day.
              <br />
            ಈ ದಿನಕ್ಕೆ ನಿಯೋಜಿಸಲಾದ ಎಲ್ಲಾ ತಂತ್ರಗಳ ಅಭ್ಯಾಸವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ ನಂತರ, ಎರಡೂ ಮೌಲ್ಯಮಾಪನಗಳನ್ನು ಸಲ್ಲಿಸಿ.
            </div>

            <div className="flex justify-end">
              <Button
                disabled={
                  busy ||
                  sessionSubmitted ||
                  !sessionActive ||
                  severityRating === null ||
                  naturalnessRating === null
                }
                onClick={submitSession}
              >
                {sessionSubmitted
                  ? 'Session Submitted / ಸೆಷನ್ ಸಲ್ಲಿಸಲಾಗಿದೆ'
                  : sessionActive
                  ? busy
                    ? 'Submitting...'
                    : 'Submit Session / ಸೆಷನ್ ಸಲ್ಲಿಸಿ'
                  : 'Session not active'
                }
              </Button>
            </div>
          </div>
          </>
        )}
      </Card>
    </div>
  )
}

// import { useEffect, useState } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import { Card } from '../../components/ui'
// import { api } from '../../lib/api'
// import { motion } from 'framer-motion'

// export function SessionStrategiesPage() {
//   const { sessionNumber } = useParams()
//   const nav = useNavigate()

//   const [assignments, setAssignments] = useState([])
//   const [submittedIds, setSubmittedIds] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   useEffect(() => {
//     async function load() {
//       setLoading(true)
//       setError(null)

//       try {
//         const { data } = await api.get(`/api/parents/session/${sessionNumber}`)

//         setAssignments(data.assignments || [])

//         // store submitted assignment IDs
//         const submitted = (data.submissions || []).map(
//           (s) => s.assignmentId
//         )
//         setSubmittedIds(submitted)

//       } catch (err) {
//         setError(err?.response?.data?.error || 'Failed to load session data')
//       } finally {
//         setLoading(false)
//       }
//     }

//     load()
//   }, [sessionNumber])

//   return (
//     <div className="mx-auto w-full max-w-4xl">
//       <div className="flex items-end justify-between gap-3">
//         <div>
//           <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
//             Session {sessionNumber}
//           </h2>
//           <p className="mt-1 text-sm text-slate-600">
//             Practice all assigned strategies. Green = completed, Red = not practiced.
//           </p>
//         </div>
//       </div>

//       {error && (
//         <div className="mt-4 text-sm font-medium text-red-700">
//           {error}
//         </div>
//       )}

//       <Card className="mt-5">
//         {loading ? (
//           <div className="text-sm text-slate-600">Loading strategies…</div>
//         ) : assignments.length === 0 ? (
//           <div className="text-sm text-slate-600">
//             No strategies assigned.
//           </div>
//         ) : (
//           <div className="grid gap-3 sm:grid-cols-2">
//             {assignments.map((a) => {
//               const isSubmitted = submittedIds.includes(a.id)

//               return (
//                 <motion.div
//                   key={a.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.25 }}
//                 >
//                   <button
//                     onClick={() =>
//                       nav(`/parent/strategies/${a.id}?session=${sessionNumber}`)
//                     }
//                     className={`w-full rounded-2xl border p-4 text-left transition ${
//                       isSubmitted
//                         ? 'border-green-500 bg-green-50'
//                         : 'border-red-500 bg-red-50'
//                     }`}
//                   >
//                     <div className="text-sm font-semibold text-slate-900">
//                       {a.strategy?.title || 'Strategy'}
//                     </div>

//                     <div className="mt-1 text-xs">
//                       {isSubmitted ? (
//                         <span className="text-green-700 font-medium">
//                           ✔ Practiced
//                         </span>
//                       ) : (
//                         <span className="text-red-700 font-medium">
//                           ✖ Not practiced
//                         </span>
//                       )}
//                     </div>

//                     <div className="mt-2 text-xs text-slate-500">
//                       {a.strategy?.demoVideoUrl
//                         ? 'Demo video available'
//                         : 'No demo video'}
//                     </div>
//                   </button>
//                 </motion.div>
//               )
//             })}
//           </div>
//         )}
//       </Card>
//     </div>
//   )
// }

