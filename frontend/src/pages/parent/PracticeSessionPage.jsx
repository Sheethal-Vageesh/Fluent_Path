import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui'
import { api } from '../../lib/api'
import { getKannadaDayLabel } from '../../lib/kannadaDays'

function SessionCard({ session, completed, active, expiresAt, locked, lockedUntil, onClick }) {
  let color = 'bg-slate-100 border-slate-300 text-slate-700'
  let label = 'Available / ಲಭ್ಯವಿದೆ'

  if (completed) {
    color = 'bg-green-500 border-green-600 text-white'
    label = 'Completed / ಪೂರ್ಣಗೊಂಡಿದೆ'
  } else if (active) {
    color = 'bg-amber-100 border-amber-300 text-amber-900'
    label = `Open until ${new Date(expiresAt).toLocaleString()}`
  }

  if (locked) {
    color = 'bg-slate-200 border-slate-300 text-slate-400'
    if (lockedUntil) {
      const unlocksAt = new Date(lockedUntil).toLocaleString()
      label = `Unlocks at ${unlocksAt} 
      ${unlocksAt} ರಂದು ತೆರೆಯಲಾಗುತ್ತದೆ`
    } else {
      label = `Locked: Previous session not submitted 
      ಲಾಕ್ ಮಾಡಲಾಗಿದೆ: ಹಿಂದಿನ ದಿನದ ಅಭ್ಯಾಸವನ್ನು ಇನ್ನೂ ಸಲ್ಲಿಸಲಾಗಿಲ್ಲ`
    }
  }

  return (
    <button
      disabled={locked}
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left shadow-sm transition hover:shadow-md disabled:cursor-not-allowed ${color}`}
    >
      <div className="text-lg font-bold">
        Day {session} / {getKannadaDayLabel(session)}
      </div>

      <div className="mt-1 text-xs opacity-90 whitespace-pre-line">
        {label}
      </div>
    </button>
  )
}

export function PracticeSessionsPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const nav = useNavigate()

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const { data } = await api.get('/api/parents/sessions')

        setSessions(data.sessions || [])

      } catch (err) {
        setError(
          err?.response?.data?.error ||
          'Failed to load sessions / ಸೆಷನ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="mx-auto w-full max-w-4xl">

      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          Daily Practice / ದೈನಂದಿನ ಅಭ್ಯಾಸ
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Start today's clinician-assigned strategies, practice them, and submit your progress within 24 hours.
          <br />
          ತಜ್ಞರು ನೀಡಿದ ಇಂದಿನ ತಂತ್ರಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ ಮತ್ತು 24 ಗಂಟೆಗಳೊಳಗೆ ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಸಲ್ಲಿಸಿ.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card className="mt-5">
        {loading ? (
          <div className="text-sm text-slate-600">
            Loading sessions… / ಸೆಷನ್‌ಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">

            {sessions.map((session) => (
              <SessionCard
                key={session.sessionNumber}
                session={session.sessionNumber}
                completed={session.completed}
                active={session.active}
                expiresAt={session.expiresAt}
                locked={session.locked}
                lockedUntil={session.lockedUntil}
                onClick={() => {
                  if (!session.locked) {
                    nav(
                      `/parent/dashboard/session/${session.sessionNumber}`
                    )
                  }
                }}
              />
            ))}

          </div>
        )}
      </Card>
    </div>
  )
}


// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Card } from '../../components/ui'
// import { api } from '../../lib/api'

// const SESSION_COUNT = 10

// function SessionCard({ session, completed, partial, onClick }) {
//   let color = 'bg-slate-100 border-slate-300 text-slate-700'
//   let label = 'Not started'

//   if (completed && !partial) {
//     color = 'bg-green-500 border-green-600 text-white'
//     label = 'Completed'
//   } else if (partial) {
//     color = 'bg-yellow-400 border-yellow-500 text-white'
//     label = 'Partially done'
//   }

//   return (
//     <button
//       onClick={onClick}
//       className={`rounded-2xl border-2 p-4 text-left shadow-sm transition hover:shadow-md ${color}`}
//     >
//       <div className="text-lg font-bold">Session {session}</div>
//       <div className="mt-1 text-xs opacity-90">{label}</div>
//     </button>
//   )
// }

// export function PracticeSessionsPage() {
//   const [sessions, setSessions] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)
//   const nav = useNavigate()

//   useEffect(() => {
//     async function load() {
//       setLoading(true)
//       setError(null)
//       try {
//         const { data } = await api.get('/api/parents/sessions')
//         setSessions(data.sessions || [])
//       } catch (err) {
//         setError(err?.response?.data?.error || 'Failed to load sessions')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [])

//   return (
//     <div className="mx-auto w-full max-w-4xl">
//       <div>
//         <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
//           Practice Sessions
//         </h2>
//         <p className="mt-1 text-sm text-slate-600">
//           Select a session to practice all assigned strategies and submit your progress.
//         </p>
//       </div>

//       {error && (
//         <div className="mt-4 text-sm font-medium text-red-700">
//           {error}
//         </div>
//       )}

//       <Card className="mt-5">
//         {loading ? (
//           <div className="text-sm text-slate-600">Loading sessions…</div>
//         ) : (
//           <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
//             {Array.from({ length: SESSION_COUNT }, (_, i) => {
//               const sessionNumber = i + 1
//               return (
//                 <SessionCard
//                   key={sessionNumber}
//                   session={sessionNumber}
//                   completed={sessions[i]?.completed}
//                   partial={sessions[i]?.partial}
//                   onClick={() =>
//                     nav(`/parent/dashboard/session/${sessionNumber}`)
//                   }
//                 />
//               )
//             })}
//           </div>
//         )}
//       </Card>
//     </div>
//   )
// }

