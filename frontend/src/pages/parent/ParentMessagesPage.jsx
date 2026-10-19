import { useEffect, useRef, useState } from 'react'
import { Button, Card, Skeleton } from '../../components/ui'
import { api } from '../../lib/api'

function formatTime(d) {
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString()
}

export function ParentMessagesPage() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  async function load() {
    setError(null)
    setLoading(true)

    try {
      const { data } = await api.get('/api/parents/messages')
      setMessages(data.messages || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send() {
    const trimmed = text.trim()

    if (!trimmed) return

    setBusy(true)
    setError(null)

    try {
      const { data } = await api.post('/api/parents/messages', {
        text: trimmed,
      })

      setMessages((m) => [...m, data.message])
      setText('')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send message')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Messages
          </h2>

          {/* Kannada */}
          <div className="mt-1 text-base font-semibold text-indigo-700">
            ಸಂದೇಶಗಳು
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Use this to interact with your clinician.
            Messages you send appear in the clinician’s
            “Notifications from parent”.
          </p>

          {/* Kannada */}
          <p className="mt-1 text-sm text-slate-500">
            ನಿಮ್ಮ ತಜ್ಞರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಲು ಇದನ್ನು ಬಳಸಿ.
            ನೀವು ಕಳುಹಿಸುವ ಸಂದೇಶಗಳು ತಜ್ಞರ “ಪೋಷಕರ ಸೂಚನೆಗಳು”
            ವಿಭಾಗದಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.
          </p>
        </div>

        <Button variant="secondary" onClick={load}>
          Refresh / ಮರುಲೋಡ್
        </Button>
      </div>

      {/* Error
      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}

          <div className="mt-1 text-xs">
            ಸಂದೇಶಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ
          </div>
        </div>
      ) : null} */}

      <Card className="mt-5">
        
        {/* Chat Title */}
        <div className="text-sm font-semibold text-slate-900">
          Notification from Clinician
        </div>

        <div className="text-xs font-medium text-indigo-700">
        ತಜ್ಞರಿಂದ ಸೂಚನೆಗಳು
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Conversation thread (latest at bottom).
        </div>

        <div className="text-[11px] text-slate-400">
          ಸಂಭಾಷಣೆ (ಹೊಸ ಸಂದೇಶಗಳು ಕೆಳಭಾಗದಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ)
        </div>

        {/* Chat Area */}
        <div className="mt-4 max-h-[55vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          
          {/* Loading */}
          {loading ? (
            <div className="grid gap-2">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-2/3 ml-auto" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          ) : null}

          {/* Empty */}
          {!loading && messages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              
              <div>
                No messages yet.
                Send a note to your clinician to start the conversation.
              </div>

              <div className="mt-2 text-slate-500">
                ಇನ್ನೂ ಯಾವುದೇ ಸಂದೇಶಗಳಿಲ್ಲ.
                ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ತಜ್ಞರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ.
              </div>
            </div>
          ) : null}

          {/* Messages */}
          <div className="grid gap-2">
            {messages.map((m) => {
              const mine = m.senderRole === 'parent'

              return (
                <div
                  key={m.id}
                  className={`flex ${
                    mine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                  >
                    {/* Sender Label */}
                    <div
                      className={`mb-1 text-[11px] font-semibold ${
                        mine ? 'text-indigo-100' : 'text-indigo-600'
                      }`}
                    >
                      {mine
                        ? 'You / ನೀವು'
                        : 'Clinician / ತಜ್ಞರು'}
                    </div>

                    {/* Message */}
                    <div className="whitespace-pre-wrap">
                      {m.text}
                    </div>

                    {/* Time */}
                    <div
                      className={`mt-1 text-[11px] ${
                        mine
                          ? 'text-indigo-100'
                          : 'text-slate-500'
                      }`}
                    >
                      {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}

            <div ref={endRef} />
          </div>
        </div>

        {/* Send Message */}
        <div className="mt-4">
          
          <div className="text-sm font-semibold text-slate-900">
            Notify Clinician
          </div>

          <div className="text-xs font-medium text-indigo-700">
          ತಜ್ಞರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm outline-none transition focus-visible:fp-focus"
              placeholder="Type a message to your clinician… / ನಿಮ್ಮ ತಜ್ಞರಿಗೆ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ..."
            />

            <Button
              disabled={busy}
              onClick={send}
              className="h-fit sm:mt-0"
            >
              {busy
                ? 'Sending… / ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...'
                : 'Send / ಕಳುಹಿಸಿ'}
            </Button>
          </div>

          {/* Tip */}
          <div className="mt-2 text-xs text-slate-500">
            Tip: Keep messages short and clear for faster responses.
          </div>

          <div className="text-[11px] text-slate-400">
            ಸೂಚನೆ: ಶೀಘ್ರ ಉತ್ತರಕ್ಕಾಗಿ ಸಂದೇಶಗಳನ್ನು ಚಿಕ್ಕದಾಗಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿ ಬರೆಯಿರಿ.
          </div>
        </div>
      </Card>
    </div>
  )
}



// import { useEffect, useRef, useState } from 'react'
// import { Button, Card, Skeleton } from '../../components/ui'
// import { api } from '../../lib/api'

// function formatTime(d) {
//   const dt = new Date(d)
//   return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString()
// }

// export function ParentMessagesPage() {
//   const [messages, setMessages] = useState([])
//   const [text, setText] = useState('')
//   const [loading, setLoading] = useState(true)
//   const [busy, setBusy] = useState(false)
//   const [error, setError] = useState(null)
//   const endRef = useRef(null)

//   async function load() {
//     setError(null)
//     setLoading(true)
//     try {
//       const { data } = await api.get('/api/parents/messages')
//       setMessages(data.messages || [])
//     } catch (err) {
//       setError(err?.response?.data?.error || 'Failed to load messages')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     load()
//   }, [])

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages.length])

//   async function send() {
//     const trimmed = text.trim()
//     if (!trimmed) return
//     setBusy(true)
//     setError(null)
//     try {
//       const { data } = await api.post('/api/parents/messages', { text: trimmed })
//       setMessages((m) => [...m, data.message])
//       setText('')
//     } catch (err) {
//       setError(err?.response?.data?.error || 'Failed to send message')
//     } finally {
//       setBusy(false)
//     }
//   }

//   return (
//     <div className="mx-auto w-full max-w-4xl">
//       <div className="flex items-end justify-between gap-3">
//         <div>
//           <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Messages</h2>
//           <p className="mt-1 text-sm text-slate-600">
//             Use this to interact with your clinician. Messages you send appear in the clinician’s “Notifications from parent”.
//           </p>
//         </div>
//         <Button variant="secondary" onClick={load}>
//           Refresh
//         </Button>
//       </div>

//       {error ? <div className="mt-4 text-sm font-medium text-red-700">{error}</div> : null}

//       <Card className="mt-5">
//         <div className="text-sm font-semibold text-slate-900">Notification from clinician</div>
//         <div className="mt-1 text-xs text-slate-500">Conversation thread (latest at bottom).</div>

//         <div className="mt-4 max-h-[55vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
//           {loading ? (
//             <div className="grid gap-2">
//               <Skeleton className="h-10 w-3/4" />
//               <Skeleton className="h-10 w-2/3 ml-auto" />
//               <Skeleton className="h-10 w-1/2" />
//             </div>
//           ) : null}
//           {!loading && messages.length === 0 ? (
//             <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
//               No messages yet. Send a note to your clinician to start the conversation.
//             </div>
//           ) : null}

//           <div className="grid gap-2">
//             {messages.map((m) => {
//               const mine = m.senderRole === 'parent'
//               return (
//                 <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
//                   <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
//                     <div className="whitespace-pre-wrap">{m.text}</div>
//                     <div className={`mt-1 text-[11px] ${mine ? 'text-indigo-100' : 'text-slate-500'}`}>{formatTime(m.createdAt)}</div>
//                   </div>
//                 </div>
//               )
//             })}
//             <div ref={endRef} />
//           </div>
//         </div>

//         <div className="mt-4">
//           <div className="text-sm font-semibold text-slate-900">Notify clinician</div>
//           <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
//             <textarea
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               rows={3}
//               className="w-full resize-none rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm outline-none transition focus-visible:fp-focus"
//               placeholder="Type a message to your clinician…"
//             />
//             <Button disabled={busy} onClick={send} className="h-fit sm:mt-0">
//               {busy ? 'Sending…' : 'Send'}
//             </Button>
//           </div>
//           <div className="mt-1 text-xs text-slate-500">Tip: Keep messages short and clear for faster responses.</div>
//         </div>
//       </Card>
//     </div>
//   )
// }

