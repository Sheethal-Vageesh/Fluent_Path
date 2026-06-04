import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Skeleton } from '../../components/ui'
import { api } from '../../lib/api'
import { motion } from 'framer-motion'

export function AssignedStrategiesPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.get('/api/parents/assignments')
      setAssignments(data.assignments || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load assigned strategies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Assigned Strategies
          </h2>

          {/* Kannada */}
          <div className="mt-1 text-base font-semibold text-indigo-700">
            ನೀಡಲಾದ ತಂತ್ರಗಳು
          </div>

          {/* <p className="mt-2 text-sm text-slate-600">
            Practice today's assigned strategies and submit your progress.
          </p> */}

          {/* Kannada */}
          {/* <p className="mt-1 text-sm text-slate-500">
           ಇಂದು ನಿಮಗೆ ನೀಡಲಾದ ತಂತ್ರಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಸಲ್ಲಿಸಿ.
          </p> */}
        </div>

        <Button variant="secondary" onClick={load}>
          Refresh / ಮರುಲೋಡ್
        </Button>
      </div>

      {/* {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
          <div className="mt-1 text-xs">
            ತಂತ್ರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ
          </div>
        </div>
      ) : null} */}

      <Card className="mt-5">
        <div className="text-xs text-slate-500">
          Total Strategies / ಒಟ್ಟು ತಂತ್ರಗಳು : {assignments.length}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </>
          ) : assignments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div>
                No assigned strategies yet. Once your clinician assigns strategies,
                they will appear here.
              </div>

              {/* Kannada */}
              <div className="mt-2 text-slate-500">
                ಇನ್ನೂ ಯಾವುದೇ ತಂತ್ರಗಳನ್ನು ನೀಡಲಾಗಿಲ್ಲ. ನಿಮ್ಮ ವೈದ್ಯರು ತಂತ್ರಗಳನ್ನು
                ನೀಡಿದ ನಂತರ ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.
              </div>
            </div>
          ) : (
            assignments.map((a, idx) => (
              // <Link key={a.id} to={`/parent/strategies/${a.id}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: 'easeOut',
                    delay: Math.min(idx * 0.06, 0.3),
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  {/* Strategy Title */}
                  <div className="text-sm font-semibold text-slate-900">
                    {a.strategy?.title || 'Strategy'}
                  </div>

                  {/* Kannada Instruction if available */}
                  {a.strategy?.kannadaText ? (
                    <div className="mt-2 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">
                      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        Kannada Instructions / ಕನ್ನಡ ಸೂಚನೆ
                      </div>

                      <div className="mt-1 leading-relaxed">
                        {a.strategy.kannadaText}
                      </div>
                    </div>
                  ) : null}

                  {/* Demo Video */}
                  <div className="mt-3 text-xs text-slate-600">
                    {a.strategy?.demoVideoUrl
                      ? 'Demo video available / ಮಾದರಿ ವೀಡಿಯೊ ಲಭ್ಯವಿದೆ'
                      : 'No demo video / ಮಾದರಿ ವೀಡಿಯೊ ಇಲ್ಲ'}
                  </div>

                  {/* Assigned Date */}
                  <div className="mt-2 text-xs text-slate-500">
                    Assigned:
                    {' '}
                    {new Date(a.assignedAt).toLocaleDateString()}
                  </div>

                  <div className="text-xs text-slate-400">
                    ನೀಡಿದ ದಿನಾಂಕ :
                    {' '}
                    {new Date(a.assignedAt).toLocaleDateString()}
                  </div>

                  {/* Open Button
                  <div className="mt-4">
                    <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      View Strategy / ತಂತ್ರವನ್ನು ವೀಕ್ಷಿಸಿ
                    </div>
                  </div> */}
                </motion.div>
              // </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}



// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { Button, Card, Skeleton } from '../../components/ui'
// import { api } from '../../lib/api'
// import { motion } from 'framer-motion'

// export function AssignedStrategiesPage() {
//   const [assignments, setAssignments] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   async function load() {
//     setError(null)
//     setLoading(true)
//     try {
//       const { data } = await api.get('/api/parents/assignments')
//       setAssignments(data.assignments || [])
//     } catch (err) {
//       setError(err?.response?.data?.error || 'Failed to load assigned strategies')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     load()
//   }, [])

//   return (
//     <div className="mx-auto w-full max-w-4xl">
//       <div className="flex items-end justify-between gap-3">
//         <div>
//           <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Assigned strategies</h2>
//           <p className="mt-1 text-sm text-slate-600">Practice and submit the strategies that are assigned to you for today.</p>
//         </div>
//         <Button variant="secondary" onClick={load}>
//           Refresh
//         </Button>
//       </div>

//       {error ? <div className="mt-4 text-sm font-medium text-red-700">{error}</div> : null}

//       <Card className="mt-5">
//         <div className="text-xs text-slate-500">Total: {assignments.length}</div>
//         <div className="mt-4 grid gap-3 sm:grid-cols-2">
//           {loading ? (
//             <>
//               <Skeleton className="h-24 w-full rounded-2xl" />
//               <Skeleton className="h-24 w-full rounded-2xl" />
//             </>
//           ) : assignments.length === 0 ? (
//             <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
//               No assigned strategies yet. Once your clinician assigns strategies, they will appear here.
//             </div>
//           ) : (
//             assignments.map((a) => (
//               <Link key={a.id} to={`/parent/strategies/${a.id}`} className="block">
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.25, ease: 'easeOut' }}
//                   className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
//                 >
//                   <div className="text-sm font-semibold text-slate-900">{a.strategy?.title || 'Strategy'}</div>
//                   <div className="mt-1 text-xs text-slate-600">
//                     {a.strategy?.demoVideoUrl ? 'Demo video available' : 'No demo video'}
//                   </div>
//                   <div className="mt-2 text-xs text-slate-500">Assigned: {new Date(a.assignedAt).toLocaleDateString()}</div>
//                 </motion.div>
//               </Link>
//             ))
//           )}
//         </div>
//       </Card>
//     </div>
//   )
// }

