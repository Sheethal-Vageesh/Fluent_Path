import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button, Card, Container, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function ParentLogin() {
  const nav = useNavigate()
  const { loginAsParent } = useAuth()

  const [childId, setChildId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()

    setError(null)
    setBusy(true)

    try {
      await loginAsParent({
        childId: childId.trim().toUpperCase(),
      })

      nav('/parent/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <Container>
        <div className="mx-auto max-w-xl">

          {/* Heading */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Parent Login
            </h2>

            <div className="mt-2 text-lg font-medium text-indigo-700">
              ಪೋಷಕರ ಲಾಗಿನ್
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Enter the unique Child ID assigned by your clinician after
              they accept your request.
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ತಜ್ಞರು ಸ್ವೀಕರಿಸಿದ ನಂತರ ನೀಡಲಾದ ಮಗುವಿನ ಐಡಿಯನ್ನು ನಮೂದಿಸಿ.
            </p>
          </div>

          {/* Login Card */}
          <Card className="mt-6 border border-indigo-100 shadow-sm">

            {/* Kannada help box */}
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="text-sm font-semibold text-indigo-800">
                Login Help / ಲಾಗಿನ್ ಸಹಾಯ
              </div>

              <div className="mt-1 text-sm text-slate-700 leading-relaxed">
                ನಿಮ್ಮ ತಜ್ಞರಿಂದ ಪಡೆದ ಮಗುವಿನ ಐಡಿ ಬಳಸಿ ಲಾಗಿನ್ ಮಾಡಿ.
              </div>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4">

              {/* Child ID */}
              <div>
                <Input
                  label="Child ID / ಮಗುವಿನ ಐಡಿ"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  placeholder="e.g., 7K3Q9P2A"
                />

               
              </div>

              {/* Error */}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Login Button */}
              <Button
                disabled={busy || !childId.trim()}
                className="mt-2"
              >
                {busy
                  ? 'Logging in… / ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ…'
                  : 'Login / ಲಾಗಿನ್'}
              </Button>

            </form>
          </Card>

         

        </div>
      </Container>
    </AppShell>
  )
}





// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { AppShell } from '../components/AppShell'
// import { Button, Card, Container, Input } from '../components/ui'
// import { useAuth } from '../context/AuthContext'

// export function ParentLogin() {
//   const nav = useNavigate()
//   const { loginAsParent } = useAuth()
//   const [childId, setChildId] = useState('')
//   const [busy, setBusy] = useState(false)
//   const [error, setError] = useState(null)

//   async function onSubmit(e) {
//     e.preventDefault()
//     setError(null)
//     setBusy(true)
//     try {
//       await loginAsParent({ childId: childId.trim().toUpperCase() })
//       nav('/parent/dashboard', { replace: true })
//     } catch (err) {
//       setError(err?.response?.data?.error || 'Login failed')
//     } finally {
//       setBusy(false)
//     }
//   }

//   return (
//     <AppShell>
//       <Container>
//         <div className="mx-auto max-w-xl">
//           <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Parent login</h2>
//           <p className="mt-2 text-sm text-slate-600">
//             Enter the unique Child ID assigned by your clinician after they accept your request.
//           </p>

//           <Card className="mt-5">
//             <form onSubmit={onSubmit} className="grid gap-3">
//               <Input label="Child ID" value={childId} onChange={(e) => setChildId(e.target.value)} placeholder="e.g., 7K3Q9P2A" />
//               {error ? <div className="text-sm font-medium text-red-700">{error}</div> : null}
//               <Button disabled={busy || !childId.trim()}>{busy ? 'Logging in…' : 'Login'}</Button>
//             </form>
//           </Card>
//         </div>
//       </Container>
//     </AppShell>
//   )
// }

