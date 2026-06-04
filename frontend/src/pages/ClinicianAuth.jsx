import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button, Card, Container, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function ClinicianAuth() {
  const nav = useNavigate()
  const { loginAsClinician, registerClinician } = useAuth()

  const [mode, setMode] = useState('login') // login | register
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    name: '',
    specialization: '',
    clinicName: '',
    email: '',
    phone: '',
    password: '',
  })

  const onChange = (key) => (e) =>
    setForm((s) => ({ ...s, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      if (mode === 'login') {
        await loginAsClinician({
          email: form.email,
          password: form.password,
        })
      } else {
        await registerClinician(form)
      }

      nav('/clinician/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <Container>
        <div className="mx-auto max-w-2xl">

          {/* HEADER */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Clinician Access
              </h2>

              <div className="mt-1 text-sm font-medium text-indigo-700">
                ತಜ್ಞರ ಪ್ರವೇಶ
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Login if you already have an account, or register to begin.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                ಈಗಾಗಲೇ ಖಾತೆ ಇದ್ದರೆ ಲಾಗಿನ್ ಮಾಡಿ ಅಥವಾ ಹೊಸ ಖಾತೆ ತೆರೆಯಿರಿ.
              </p>
            </div>

            {/* MODE SWITCH */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'login' ? 'primary' : 'secondary'}
                onClick={() => setMode('login')}
              >
                Login / ಲಾಗಿನ್
              </Button>

              <Button
                type="button"
                variant={mode === 'register' ? 'primary' : 'secondary'}
                onClick={() => setMode('register')}
              >
                Register / ನೋಂದಣಿ
              </Button>
            </div>
          </div>

          {/* FORM CARD */}
          <Card className="mt-5">
            <form onSubmit={onSubmit} className="grid gap-4">

              {/* REGISTER FIELDS */}
              {mode === 'register' ? (
                <div className="grid gap-3 sm:grid-cols-2">

                  <div>
                    <Input
                      label="Name"
                      value={form.name}
                      onChange={onChange('name')}
                      placeholder="Your name"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      ಹೆಸರು
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Specialization"
                      value={form.specialization}
                      onChange={onChange('specialization')}
                      placeholder="e.g., Fluency specialist"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      ಪರಿಣಿತಿ
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Clinic name"
                      value={form.clinicName}
                      onChange={onChange('clinicName')}
                      placeholder="Clinic / hospital"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      ಕ್ಲಿನಿಕ್ / ಆಸ್ಪತ್ರೆ ಹೆಸರು
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Phone"
                      value={form.phone}
                      onChange={onChange('phone')}
                      placeholder="Phone number"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      ದೂರವಾಣಿ ಸಂಖ್ಯೆ
                    </div>
                  </div>
                </div>
              ) : null}

              {/* EMAIL + PASSWORD */}
              <div className="grid gap-3 sm:grid-cols-2">

                <div>
                  <Input
                    label="Email"
                    value={form.email}
                    onChange={onChange('email')}
                    placeholder="name@email.com"
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    ಇಮೇಲ್ ವಿಳಾಸ
                  </div>
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={onChange('password')}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-8 text-slate-500 hover:text-slate-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M15.75 15.75A6 6 0 018.25 8.25m7.5 7.5A6 6 0 008.25 8.25m7.5 7.5L3 3" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C3.75 7.5 7.5 4.5 12 4.5c4.5 0 8.25 3 9.75 7.5-1.5 4.5-5.25 7.5-9.75 7.5-4.5 0-8.25-3-9.75-7.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    )}
                  </button>
                  <div className="mt-1 text-xs text-slate-500">
                    ಗುಪ್ತಪದ
                  </div>
                </div>
  

              </div>

              {/* ERROR */}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <div className="text-sm font-medium text-red-700">
                    {error}
                  </div>

                  <div className="mt-1 text-xs text-red-600">
                    ದಯವಿಟ್ಟು ಮಾಹಿತಿಯನ್ನು ಸರಿಯಾಗಿ ಪರಿಶೀಲಿಸಿ.
                  </div>
                </div>
              ) : null}

              {/* INFO + BUTTON */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-xs text-slate-500">
                  {mode === 'register' ? (
                    <>
                      After registering, you will be taken to your Clinician dashboard.
                      <br />
                      <span className="text-slate-400">
                        ನೋಂದಣಿ ನಂತರ ತಜ್ಞರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಕರೆದೊಯ್ಯಲಾಗುತ್ತದೆ.
                      </span>
                    </>
                  ) : (
                    <>
                      After login, you will be taken to your Clinician dashboard.
                      <br />
                      <span className="text-slate-400">
                        ಲಾಗಿನ್ ನಂತರ ತಜ್ಞರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಕರೆದೊಯ್ಯಲಾಗುತ್ತದೆ.
                      </span>
                    </>
                  )}
                </div>

                <Button
                  disabled={busy}
                  className="w-full sm:w-auto"
                >
                  {busy
                    ? 'Please wait… / ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ…'
                    : mode === 'login'
                    ? 'Login / ಲಾಗಿನ್'
                    : 'Create Account / ಖಾತೆ ರಚಿಸಿ'}
                </Button>

              </div>
            </form>
          </Card>
        </div>
      </Container>
    </AppShell>
  )
}

