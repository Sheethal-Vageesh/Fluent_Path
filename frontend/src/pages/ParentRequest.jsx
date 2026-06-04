import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button, Card, Container, Input, Select } from '../components/ui'
import { api } from '../lib/api'

export function ParentRequest() {
  const [clinicians, setClinicians] = useState([])
  const [loadingClinicians, setLoadingClinicians] = useState(true)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [form, setForm] = useState({
    clinicianId: '',
    childName: '',
    childAge: '',
    parentName: '',
    email: '',
    phone: '',
  })

  const selectedClinician = useMemo(
    () => clinicians.find((c) => c.id === form.clinicianId) || null,
    [clinicians, form.clinicianId],
  )

  useEffect(() => {
    let mounted = true

    async function run() {
      try {
        setLoadingClinicians(true)

        const { data } = await api.get('/api/clinicians/public')

        if (!mounted) return

        setClinicians(data.clinicians || [])
      } catch {
        if (!mounted) return
        setClinicians([])
      } finally {
        if (mounted) setLoadingClinicians(false)
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [])

  const onChange =
    (key) =>
    (e) =>
      setForm((s) => ({
        ...s,
        [key]: e.target.value,
      }))

  async function onSubmit(e) {
    e.preventDefault()

    setError(null)
    setSuccess(null)
    setBusy(true)

    try {
      const payload = {
        clinicianId: form.clinicianId,
        childName: form.childName,
        childAge: form.childAge,
        parentName: form.parentName,
        email: form.email,
        phone: form.phone,
      }

      const { data } = await api.post(
        '/api/auth/parent/request',
        payload,
      )

      setSuccess(
        `Request sent successfully. Request ID: ${data.requestId}`
      )

      setForm((s) => ({
        ...s,
        childName: '',
        childAge: '',
        parentName: '',
        email: '',
        phone: '',
      }))
    } catch (err) {
      setError(
        err?.response?.data?.error || 'Failed to send request',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <Container>
        <div className="mx-auto max-w-3xl">

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Send Request to Your Clinician
            </h2>

            <div className="mt-2 text-lg font-medium text-indigo-700">
              ನಿಮ್ಮ ತಜ್ಞರಿಗೆ ವಿನಂತಿ ಕಳುಹಿಸಿ
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Choose a clinician, enter child & parent details,
              and submit your request.
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              ತಜ್ಞರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ, ಮಗು ಮತ್ತು ಪೋಷಕರ ವಿವರಗಳನ್ನು
              ನಮೂದಿಸಿ ಹಾಗೂ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ.
            </p>
          </div>

          {/* Form Card */}
          <Card className="mt-6 border border-indigo-100 shadow-sm">

            {/* Kannada Help Box */}
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="text-sm font-semibold text-indigo-800">
                Help / ಸಹಾಯ
              </div>

              <div className="mt-1 text-sm text-slate-700 leading-relaxed">
                ತಜ್ಞರು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಸ್ವೀಕರಿಸಿದ ನಂತರ,
                ನಿಮಗೆ ಮಗುವಿನ ಐಡಿ ಇಮೇಲ್ ಮೂಲಕ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.
              </div>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4">

              {/* Clinician Select */}
              <Select
                label="Select Clinician / ತಜ್ಞರನ್ನು ಆಯ್ಕೆಮಾಡಿ"
                value={form.clinicianId}
                onChange={onChange('clinicianId')}
                disabled={loadingClinicians}
              >
                <option value="">
                  {loadingClinicians
                    ? 'Loading clinicians…'
                    : 'Choose a clinician'}
                </option>

                {clinicians.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.specialization} ({c.clinicName})
                  </option>
                ))}
              </Select>

              {/* Selected Clinician */}
              {selectedClinician ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-slate-700">
                  <div>
                    Selected:
                    <span className="ml-1 font-semibold">
                      {selectedClinician.name}
                    </span>
                  </div>

                  <div className="mt-1 text-slate-600">
                    ಆಯ್ಕೆ ಮಾಡಿದ ತಜ್ಞರು:
                    <span className="ml-1 font-semibold">
                      {selectedClinician.clinicName}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Child Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Child Name / ಮಗುವಿನ ಹೆಸರು"
                  value={form.childName}
                  onChange={onChange('childName')}
                />

                <Input
                  label="Child Age / ಮಗುವಿನ ವಯಸ್ಸು"
                  type="number"
                  step="0.1"
                  min="3"
                  max="6"
                  value={form.childAge}
                  onChange={e => {
                    let val = e.target.value;
                    if (val.includes('.')) {
                      const [intPart, decPart] = val.split('.');
                      val = intPart + (decPart ? '.' + decPart.slice(0, 1) : '');
                    }
                    setForm(s => ({ ...s, childAge: val }));
                  }}
                  placeholder="e.g., 4.2"
                />
                {form.childAge && (Number(form.childAge) < 3 || Number(form.childAge) > 6) ? (
                  <div className="mt-2 text-sm text-red-700">
                    Child age must be between 3 and 6 years. Please enter the correct age.
                    <br />
                    ಮಗುವಿನ ವಯಸ್ಸು 3 ರಿಂದ 6 ವರ್ಷಗಳವರೆಗೆ ಇರಬೇಕು. ದಯವಿಟ್ಟು ಸರಿಯಾದ ಮೌಲ್ಯವನ್ನು ನಮೂದಿಸಿ.
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">
                    Enter your child’s age between 3 and 6 years, e.g. 4.2.
                  </div>
                )}
              </div>

              {/* Parent Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Parent Name / ಪೋಷಕರ ಹೆಸರು"
                  value={form.parentName}
                  onChange={onChange('parentName')}
                />

                <Input
                  label="Phone / ದೂರವಾಣಿ ಸಂಖ್ಯೆ"
                  value={form.phone}
                  onChange={onChange('phone')}
                />
              </div>

              {/* Email */}
              <Input
                label="Email (optional) / ಇಮೇಲ್ (ಐಚ್ಛಿಕ)"
                value={form.email}
                onChange={onChange('email')}
                placeholder="parent@email.com"
              />

              {/* Error */}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Success */}
              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
                  <div>{success}</div>

                  <div className="mt-1 font-normal text-slate-700">
                    ಈಗ ತಜ್ಞರು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಸ್ವೀಕರಿಸುವವರೆಗೆ ಕಾಯಿರಿ.
                    ನಂತರ ಮಗುವಿನ ಐಡಿ ಬಳಸಿ ಲಾಗಿನ್ ಮಾಡಬಹುದು.
                  </div>
                </div>
              ) : null}

              {/* Bottom Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <Link
                  className="text-sm font-semibold text-indigo-700"
                  to="/parent/login"
                >
                  Already have Child ID?
                  <span className="ml-1 text-slate-600">
                    / ಈಗಾಗಲೇ ಮಗುವಿನ ಐಡಿ ಇದೆಯೆ?
                  </span>
                </Link>

                <Button
                  disabled={
                    busy ||
                    !form.clinicianId ||
                    (form.childAge &&
                      (Number(form.childAge) < 1 || Number(form.childAge) > 6))
                  }
                  className="w-full sm:w-auto"
                >
                  {busy
                    ? 'Sending… / ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…'
                    : 'Send Request / ವಿನಂತಿ ಕಳುಹಿಸಿ'}
                </Button>

              </div>
            </form>
          </Card>

         

        </div>
      </Container>
    </AppShell>
  )
}

// import { useEffect, useMemo, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { AppShell } from '../components/AppShell'
// import { Button, Card, Container, Input, Select } from '../components/ui'
// import { api } from '../lib/api'

// export function ParentRequest() {
//   const [clinicians, setClinicians] = useState([])
//   const [loadingClinicians, setLoadingClinicians] = useState(true)
//   const [busy, setBusy] = useState(false)
//   const [error, setError] = useState(null)
//   const [success, setSuccess] = useState(null)

//   const [form, setForm] = useState({
//     clinicianId: '',
//     childName: '',
//     childAge: '',
//     parentName: '',
//     email: '',
//     phone: '',
//   })

//   const selectedClinician = useMemo(
//     () => clinicians.find((c) => c.id === form.clinicianId) || null,
//     [clinicians, form.clinicianId],
//   )

//   useEffect(() => {
//     let mounted = true
//     async function run() {
//       try {
//         setLoadingClinicians(true)
//         const { data } = await api.get('/api/clinicians/public')
//         if (!mounted) return
//         setClinicians(data.clinicians || [])
//       } catch (_e) {
//         if (!mounted) return
//         setClinicians([])
//       } finally {
//         if (mounted) setLoadingClinicians(false)
//       }
//     }
//     run()
//     return () => {
//       mounted = false
//     }
//   }, [])

//   const onChange = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

//   async function onSubmit(e) {
//     e.preventDefault()
//     setError(null)
//     setSuccess(null)
//     setBusy(true)
//     try {
//       const payload = {
//         clinicianId: form.clinicianId,
//         childName: form.childName,
//         childAge: form.childAge,
//         parentName: form.parentName,
//         email: form.email,
//         phone: form.phone,
//       }
//       const { data } = await api.post('/api/auth/parent/request', payload)
//       setSuccess(`Request sent successfully. Request ID: ${data.requestId}`)
//       setForm((s) => ({ ...s, childName: '', childAge: '', parentName: '', email: '', phone: '' }))
//     } catch (err) {
//       setError(err?.response?.data?.error || 'Failed to send request')
//     } finally {
//       setBusy(false)
//     }
//   }

//   return (
//     <AppShell>
//       <Container>
//         <div className="mx-auto max-w-3xl">
//           <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Send request to your clinician</h2>
//           <p className="mt-2 text-sm text-slate-600">
//             Choose a clinician, enter child & parent details, and submit your request. Once accepted, you’ll receive a
//             unique Child ID by email.
//           </p>

//           <Card className="mt-5">
//             <form onSubmit={onSubmit} className="grid gap-3">
//               <Select
//                 label="Select clinician"
//                 value={form.clinicianId}
//                 onChange={onChange('clinicianId')}
//                 disabled={loadingClinicians}
//               >
//                 <option value="">{loadingClinicians ? 'Loading clinicians…' : 'Choose a clinician'}</option>
//                 {clinicians.map((c) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name} — {c.specialization} ({c.clinicName})
//                   </option>
//                 ))}
//               </Select>

//               {selectedClinician ? (
//                 <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
//                   Selected: <span className="font-semibold">{selectedClinician.name}</span> ({selectedClinician.clinicName}
//                   )
//                 </div>
//               ) : null}

//               <div className="grid gap-3 sm:grid-cols-2">
//                 <Input label="Child name" value={form.childName} onChange={onChange('childName')} />
//                 <Input label="Child age" value={form.childAge} onChange={onChange('childAge')} placeholder="e.g., 4" />
//               </div>
//               <div className="grid gap-3 sm:grid-cols-2">
//                 <Input label="Parent name" value={form.parentName} onChange={onChange('parentName')} />
//                 <Input label="Phone" value={form.phone} onChange={onChange('phone')} />
//               </div>
//               <Input label="Email" value={form.email} onChange={onChange('email')} placeholder="parent@email.com" />

//               {error ? <div className="text-sm font-medium text-red-700">{error}</div> : null}
//               {success ? (
//                 <div className="text-sm font-medium text-emerald-700">
//                   {success}{' '}
//                   <span className="font-normal text-slate-600">
//                     (Now wait for the clinician to accept. Then use your Child ID to log in.)
//                   </span>
//                 </div>
//               ) : null}

//               <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//                 <Link className="text-sm font-semibold text-indigo-700" to="/parent/login">
//                   Already have Child ID? Login
//                 </Link>
//                 <Button disabled={busy || !form.clinicianId} className="w-full sm:w-auto">
//                   {busy ? 'Sending…' : 'Send request'}
//                 </Button>
//               </div>
//             </form>
//           </Card>
//         </div>
//       </Container>
//     </AppShell>
//   )
// }

