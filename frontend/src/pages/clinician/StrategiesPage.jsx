import { useEffect, useState } from 'react'
import { Button, Card, Input } from '../../components/ui'
import { api } from '../../lib/api'
import { resolveMediaUrl } from '../../lib/media'

export function StrategiesPage() {
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [kannadaText, setKannadaText] = useState('')
  const [demoVideo, setDemoVideo] = useState(null)

  async function refresh() {
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.get('/api/clinicians/strategies')
      setStrategies(data.strategies || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load strategies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function addStrategy(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('kannadaText', kannadaText)
      if (demoVideo) form.append('demoVideo', demoVideo)
      await api.post('/api/clinicians/strategies', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTitle('')
      setKannadaText('')
      setDemoVideo(null)
      await refresh()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add strategy')
    } finally {
      setBusy(false)
    }
  }

  async function removeStrategy(id) {
    setError(null)
    setBusy(true)
    try {
      await api.delete(`/api/clinicians/strategies/${id}`)
      await refresh()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove strategy')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Strategies</h2>
          <p className="mt-1 text-sm text-slate-600">Maintain your reusable list of strategies (add/remove).</p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {error ? <div className="mt-4 text-sm font-medium text-red-700">{error}</div> : null}

      <Card className="mt-5">
        <form onSubmit={addStrategy} className="grid gap-3">
          <Input label="Strategy in English" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Slow rate" />
          <Input
            label="Strategy in Kannada (optional)"
            value={kannadaText}
            onChange={(e) => setKannadaText(e.target.value)}
            placeholder="ಉದಾ: ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ"
          />
          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Demo video (optional)</div>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setDemoVideo(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <div className="mt-1 text-xs text-slate-500">
              Upload a short demo so parents can watch it later. (Optional)
            </div>
          </label>
          <div className="flex items-center justify-end">
            <Button disabled={busy || title.trim().length < 2}>{busy ? 'Please wait…' : 'Add strategy'}</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5">
        <div className="text-xs text-slate-500">Total: {strategies.length}</div>
        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : strategies.length === 0 ? (
            <div className="text-sm text-slate-600">No strategies yet. Add your first strategy above.</div>
          ) : (
            strategies.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                  {s.kannadaText ? (
                    <div className="mt-1 text-sm text-emerald-700 font-medium">
                      {s.kannadaText}
                    </div>
                  ) : null}
                  {s.demoVideoUrl ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo video</div>
                      <video className="mt-2 w-full max-w-md rounded-xl border border-slate-200 bg-black" controls>
                        <source src={resolveMediaUrl(s.demoVideoUrl)} />
                      </video>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-600">No demo video uploaded.</div>
                  )}
                </div>
                <div className="mt-3 sm:mt-0">
                  <Button disabled={busy} variant="secondary" onClick={() => removeStrategy(s.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

