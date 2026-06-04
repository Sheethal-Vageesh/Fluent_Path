import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Button, Card, Container, Input } from '../../components/ui'
import { api } from '../../lib/api'
import { resolveMediaUrl } from '../../lib/media'

function toSeconds({ h, m, s }) {
  const hh = Math.max(0, Number(h) || 0)
  const mm = Math.max(0, Number(m) || 0)
  const ss = Math.max(0, Number(s) || 0)
  return hh * 3600 + mm * 60 + ss
}

export function ParentStrategyPage() {
  const nav = useNavigate()
  const { assignmentId } = useParams()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  const [assignment, setAssignment] = useState(null)
  const [dur, setDur] = useState({ h: '0', m: '0', s: '0' })

  const durationSeconds = useMemo(() => toSeconds(dur), [dur])

  const [practiceVideo, setPracticeVideo] = useState(null)

  const location = useLocation()
  const sessionNumber = new URLSearchParams(location.search).get('session')

  async function load() {
    setError(null)
    setMsg(null)
    setLoading(true)

    try {
      const { data } = await api.get(`/api/parents/assignments/${assignmentId}`)
      setAssignment(data.assignment)
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Failed to load strategy / ತಂತ್ರವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [assignmentId])

  async function submit() {
    setBusy(true)
    setError(null)
    setMsg(null)

    try {
      const form = new FormData()

      form.append('durationSeconds', String(durationSeconds))
      form.append('sessionNumber', String(sessionNumber))

      if (practiceVideo) {
        form.append('practiceVideo', practiceVideo)
      }

      await api.post(
        `/api/parents/assignments/${assignmentId}/progress`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setMsg(
        'Submitted successfully for this session / ಈ ಸೆಷನ್‌ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ'
      )

      setPracticeVideo(null)

      setTimeout(() => {
        nav(`/parent/dashboard/session/${sessionNumber}`)
      }, 600)

    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Failed to submit progress / ಪ್ರಗತಿಯನ್ನು ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <Container>
        <div className="mx-auto max-w-3xl">

          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                 Parent-Child Interaction Strategies to implement / ಅಳವಡಿಸಿಕೊಳ್ಳಬೇಕಾದ ಪೋಷಕ-ಮಕ್ಕಳ ಸಂವಹನ ತಂತ್ರಗಳು
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Watch the demo (if available), practice, then submit your progress.
                <br />
                (ಲಭ್ಯವಿದ್ದರೆ) ಡೆಮೊ ವೀಡಿಯೊ ನೋಡಿ , ಅಭ್ಯಾಸ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಸಲ್ಲಿಸಿ.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => nav(`/parent/dashboard/session/${sessionNumber}`)}
            >
              Back / ಹಿಂದಕ್ಕೆ
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {msg ? (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              {msg}
            </div>
          ) : null}

          <Card className="mt-5">
            {loading ? (
              <div className="text-sm text-slate-600">
                Loading... / ಲೋಡ್ ಆಗುತ್ತಿದೆ...
              </div>
            ) : assignment?.strategy ? (
              <>
                <div className="text-lg font-bold text-slate-900">
                  {assignment.strategy.title}
                </div>

                <div className="mt-1 text-xs font-medium text-indigo-600">
                  Practice Day {sessionNumber} / ಅಭ್ಯಾಸ ದಿನ {sessionNumber}
                </div>

                {assignment.strategy.demoVideoUrl ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Demo Video / ಡೆಮೊ ವೀಡಿಯೊ
                    </div>
                      <video
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-black"
                        controls
                      >
                        <source src={resolveMediaUrl(assignment.strategy.demoVideoUrl)} />
                      </video>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-600">
                    No demo video provided by clinician.
                    <br />
                    ಕ್ಲಿನಿಷಿಯನ್ ಯಾವುದೇ ಡೆಮೊ ವೀಡಿಯೊ ನೀಡಿಲ್ಲ.
                  </div>
                )}
              
                <div className="mt-6 grid gap-6 bg-gray-200 rounded-xl p-8">


                  {/* Duration */}
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Duration Practiced / ಅಭ್ಯಾಸ ಮಾಡಿದ ಸಮಯ
                    </div>

                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <Input
                        label="Hours / ಗಂಟೆಗಳು"
                        value={dur.h}
                        onChange={(e) =>
                          setDur((p) => ({
                            ...p,
                            h: e.target.value,
                          }))
                        }
                      />

                      <Input
                        label="Minutes / ನಿಮಿಷಗಳು"
                        value={dur.m}
                        onChange={(e) =>
                          setDur((p) => ({
                            ...p,
                            m: e.target.value,
                          }))
                        }
                      />

                      <Input
                        label="Seconds / ಸೆಕೆಂಡುಗಳು"
                        value={dur.s}
                        onChange={(e) =>
                          setDur((p) => ({
                            ...p,
                            s: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Total seconds / ಒಟ್ಟು ಸೆಕೆಂಡುಗಳು: {durationSeconds}
                    </div>
                  </div>

                  {/* Video Upload */}
                  <label className="block">
                    <div className="mb-1 text-sm font-semibold text-slate-900">
                      Practice Video (Optional)
                      <br />
                      ಅಭ್ಯಾಸ ವೀಡಿಯೊ (ಐಚ್ಛಿಕ)
                    </div>

                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setPracticeVideo(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />

                    <div className="mt-1 text-xs text-slate-500">
                      Optional video for clinician reference.
                      <br />
                      ಕ್ಲಿನಿಷಿಯನ್ ಪರಿಶೀಲನೆಗಾಗಿ ಐಚ್ಛಿಕ ವೀಡಿಯೊ.
                    </div>
                  </label>

                  {/* Buttons */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => nav('/parent/dashboard/assigned')}
                    >
                      Back / ಹಿಂದಕ್ಕೆ
                    </Button>

                    <Button
                      disabled={busy}
                      onClick={submit}
                    >
                      {busy
                        ? 'Submitting... / ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...'
                        : 'Submit / ಸಲ್ಲಿಸಿ'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600">
                Not found / ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ
              </div>
            )}
          </Card>
        </div>
      </Container>
    </AppShell>
  )
}







// import { useEffect, useMemo, useState } from 'react'
// import { useNavigate, useParams, useLocation } from 'react-router-dom'
// import { AppShell } from '../../components/AppShell'
// import { Button, Card, Container, Input } from '../../components/ui'
// import { api } from '../../lib/api'



// function toSeconds({ h, m, s }) {
//   const hh = Math.max(0, Number(h) || 0)
//   const mm = Math.max(0, Number(m) || 0)
//   const ss = Math.max(0, Number(s) || 0)
//   return hh * 3600 + mm * 60 + ss
// }

// export function ParentStrategyPage() {
//   const nav = useNavigate()
//   const { assignmentId } = useParams()

//   const [loading, setLoading] = useState(true)
//   const [busy, setBusy] = useState(false)
//   const [error, setError] = useState(null)
//   const [msg, setMsg] = useState(null)

//   const [assignment, setAssignment] = useState(null)

//   const [severityRating, setSeverityRating] = useState(0)
//   const [naturalnessRating, setNaturalnessRating] = useState(5)
//   const [dur, setDur] = useState({ h: '0', m: '0', s: '0' })
//   const durationSeconds = useMemo(() => toSeconds(dur), [dur])
//   const [practiceVideo, setPracticeVideo] = useState(null)
//   const location = useLocation()
//   const sessionNumber = new URLSearchParams(location.search).get('session')
//   async function load() {
//     setError(null)
//     setMsg(null)
//     setLoading(true)
//     try {
//       const { data } = await api.get(`/api/parents/assignments/${assignmentId}`)
//       setAssignment(data.assignment)
//     } catch (err) {
//       setError(err?.response?.data?.error || 'Failed to load strategy')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     load()
//   }, [assignmentId])

 
//   async function submit() {
//     setBusy(true)
//     setError(null)
//     setMsg(null)

//     try {
//       const form = new FormData()

//       form.append('StutteringSeverityRating', String(severityRating))
//       form.append('SpeechNaturalnessRating', String(naturalnessRating))
//       form.append('durationSeconds', String(durationSeconds))

//       // ✅ NEW (CRITICAL)
//       form.append('sessionNumber', String(sessionNumber))

//       if (practiceVideo) {
//         form.append('practiceVideo', practiceVideo)
//       }

//       await api.post(
//         `/api/parents/assignments/${assignmentId}/progress`,
//         form,
//         {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         }
//       )

//       setMsg('Submitted successfully for this session.')

//       setPracticeVideo(null)

//       // ✅ Go back to session page (not completed page anymore)
//       setTimeout(() => {
//         nav(`/parent/dashboard/session/${sessionNumber}`)
//       }, 600)

//     } catch (err) {
//       setError(err?.response?.data?.error || 'Failed to submit progress')
//     } finally {
//       setBusy(false)
//     }
//   }



//   return (
//     <AppShell>
//       <Container>
//         <div className="mx-auto max-w-3xl">
//           <div className="flex items-end justify-between gap-3">
//             <div>
//               <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Strategy</h2>
//               <p className="mt-2 text-sm text-slate-600">Watch the demo, practice, then submit your progress.</p>
//             </div>
//             <Button variant="secondary" onClick={() => nav('/parent/dashboard/assigned')}>
//               Back
//             </Button>
//           </div>

//           {error ? <div className="mt-4 text-sm font-medium text-red-700">{error}</div> : null}
//           {msg ? <div className="mt-4 text-sm font-medium text-emerald-700">{msg}</div> : null}

//           <Card className="mt-5">
//             {loading ? (
//               <div className="text-sm text-slate-600">Loading…</div>
//             ) : assignment?.strategy ? (
//               <>
//                 <div className="text-sm font-semibold text-slate-900">{assignment.strategy.title}</div>
//                 <div className="mt-1 text-xs text-indigo-600 font-medium">
//                   Session {sessionNumber}
//                 </div>
//                 {assignment.strategy.demoVideoUrl ? (
//                   <div className="mt-4">
//                     <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo video</div>
//                     <video className="mt-2 w-full rounded-xl border border-slate-200 bg-black" controls>
//                       <source src={assignment.strategy.demoVideoUrl} />
//                     </video>
//                   </div>
//                 ) : (
//                   <div className="mt-3 text-sm text-slate-600">No demo video provided by clinician.</div>
//                 )}

//                 <div className="mt-6 grid gap-4">
//                  <div className="grid gap-6">

//                     {/* Stuttering Severity Rating */}
//                     <div>
//                       <div className="text-sm font-semibold text-slate-900">
//                         Stuttering Severity Rating (0–9)
//                       </div>
//                       <div className="mt-1 text-xs text-slate-500">
//                         0 = No stuttering, 1 = Extremely mild stuttering, 9 = Extremely severe stuttering
//                       </div>

//                       <div className="mt-2 flex flex-wrap gap-2">
//                         {[...Array(10)].map((_, i) => (
//                           <button
//                             key={i}
//                             type="button"
//                             onClick={() => setSeverityRating(i)}
//                             className={`h-10 w-10 rounded-xl border text-sm font-semibold ${
//                               severityRating === i
//                                 ? 'border-red-600 bg-red-600 text-white'
//                                 : 'border-slate-200 bg-white text-slate-800'
//                             }`}
//                           >
//                             {i}
//                           </button>
//                         ))}
//                       </div>
//                     </div>

//                     {/* Speech Naturalness Rating */}
//                     <div>
//                       <div className="text-sm font-semibold text-slate-900">
//                         Speech Naturalness Rating (1–9)
//                       </div>
//                       <div className="mt-1 text-xs text-slate-500">
//                         1 = Highly natural sounding speech, 9 = Highly unnatural sounding speech
//                       </div>

//                       <div className="mt-2 flex flex-wrap gap-2">
//                         {[...Array(9)].map((_, i) => {
//                           const value = i + 1
//                           return (
//                             <button
//                               key={value}
//                               type="button"
//                               onClick={() => setNaturalnessRating(value)}
//                               className={`h-10 w-10 rounded-xl border text-sm font-semibold ${
//                                 naturalnessRating === value
//                                   ? 'border-indigo-600 bg-indigo-600 text-white'
//                                   : 'border-slate-200 bg-white text-slate-800'
//                               }`}
//                             >
//                               {value}
//                             </button>
//                           )
//                         })}
//                       </div>
//                     </div>

//                   </div>

//                   <div>
//                     <div className="text-sm font-semibold text-slate-900">Duration practiced</div>
//                     <div className="mt-2 grid gap-3 sm:grid-cols-3">
//                       <Input label="Hours" value={dur.h} onChange={(e) => setDur((p) => ({ ...p, h: e.target.value }))} />
//                       <Input label="Minutes" value={dur.m} onChange={(e) => setDur((p) => ({ ...p, m: e.target.value }))} />
//                       <Input label="Seconds" value={dur.s} onChange={(e) => setDur((p) => ({ ...p, s: e.target.value }))} />
//                     </div>
//                     <div className="mt-1 text-xs text-slate-500">Total seconds: {durationSeconds}</div>
//                   </div>

//                   <label className="block">
//                     <div className="mb-1 text-sm font-semibold text-slate-900">Practice video (optional)</div>
//                     <input
//                       type="file"
//                       accept="video/*"
//                       onChange={(e) => setPracticeVideo(e.target.files?.[0] || null)}
//                       className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
//                     />
//                     <div className="mt-1 text-xs text-slate-500">Optional video for clinician reference.</div>
//                   </label>

//                   <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
//                     <Button variant="secondary" onClick={() => nav('/parent/dashboard/assigned')}>
//                       Back
//                     </Button>
//                     <Button disabled={busy} onClick={submit}>
//                       {busy ? 'Submitting…' : 'Submit'}
//                     </Button>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div className="text-sm text-slate-600">Not found.</div>
//             )}
//           </Card>
//         </div>
//       </Container>
//     </AppShell>
//   )
// }

