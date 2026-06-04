import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card } from '../../components/ui'
import { api } from '../../lib/api'
import { TOTAL_SESSIONS } from '../../config/stage'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, ReferenceArea,Cell, ReferenceLine,
  Label
} from 'recharts'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars

function formatDate(d) {
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString()
}

function secondsToHms(seconds) {
  const s = Math.max(0, Number(seconds) || 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${h}h ${m}m ${ss}s`
}

export function ClinicianChildPage() {
  const nav = useNavigate()
  const { childId } = useParams()
  const [child, setChild] = useState(null)
  const [strategies, setStrategies] = useState([])
  const [assigned, setAssigned] = useState([])
  const [checked, setChecked] = useState({})
  const [submissions, setSubmissions] = useState([])
  const [sessionRatings, setSessionRatings] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)

  const [tab, setTab] = useState('assign') // assign | progress | messages
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  const assignedIds = useMemo(() => new Set(assigned.map((a) => a?.strategy?.id).filter(Boolean)), [assigned])

  async function loadAll() {
    setError(null)
    setMsg(null)
    setLoading(true)
    try {
      const [c, s, a, p] = await Promise.all([
        api.get(`/api/clinicians/children/${childId}`),
        api.get('/api/clinicians/strategies'),
        api.get(`/api/clinicians/children/${childId}/assignments`),
        api.get(`/api/clinicians/children/${childId}/progress`),
      ])
      setChild(c.data.child)
      setStrategies(s.data.strategies || [])
      setAssigned(a.data.assignments || [])
      setSubmissions(p.data.submissions || [])
      setSessionRatings(p.data.sessionRatings || [])

      const initial = {}
      ;(a.data.assignments || []).forEach((x) => {
        if (x?.strategy?.id) initial[x.strategy.id] = true
      })
      setChecked(initial)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load child')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [childId])

  async function saveAssignments() {
    setBusy(true)
    setError(null)
    setMsg(null)
    try {
      const strategyIds = Object.entries(checked)
        .filter(([, v]) => v)
        .map(([k]) => k)
      await api.post(`/api/clinicians/children/${childId}/assignments`, { strategyIds })
      setMsg('Assigned strategies updated.')
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save assignments')
    } finally {
      setBusy(false)
    }
  }

  const sessions = Array.from({ length: TOTAL_SESSIONS }, (_, i) => i + 1)

  function resolveMediaUrlLocal(url) {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''
    if (base && url.startsWith('/')) return `${base}${url}`
    return url
  }

  const filteredSubmissions = selectedSession
    ? submissions.filter((s) => s.sessionNumber === selectedSession)
    : []

  



 function TherapyDashboard({ submissions = [], assigned = [] }) {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return (
      <div className="mt-4 text-sm text-slate-600">
        No therapy data available yet.
      </div>
    )
  }

  const sessionMap = {}

  submissions.forEach((s) => {
    if (!s?.sessionNumber) return
    if (!sessionMap[s.sessionNumber]) {
      sessionMap[s.sessionNumber] = []
    }
    sessionMap[s.sessionNumber].push(s)
  })

  const sessions = Object.keys(sessionMap)
    .map(Number)
    .sort((a, b) => a - b)

  // 📊 1. Strategies per session (BAR)
    const strategiesPerSession = Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
      const sessionNum = i + 1
      const completed = sessionMap[sessionNum]?.length || 0
      const total = assigned.length || 0

      return {
        session: sessionNum,
        percent: total ? Math.round((completed / total) * 100) : 0,
        completed,   // ✅ needed for tooltip
        total,       // ✅ needed for tooltip
      }
    })
  // 📉 2. Severity (LINE)
    const sessionRatingMap = new Map(sessionRatings.map((s) => [s.sessionNumber, s]))

    const severityData = Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
      const session = i + 1
      const rating = sessionRatingMap.get(session)

      return {
        session,
        severity: rating && Number.isFinite(rating.stuttering)
          ? Number(rating.stuttering)
          : 0,
      }
    })

  // 📊 3. Strategy usage (BAR)
  const strategyCountMap = {}
  submissions.forEach((s) => {
    const name = s?.strategy?.title || 'Unknown'
    strategyCountMap[name] = (strategyCountMap[name] || 0) + 1
  })

  const strategyStats = Object.entries(strategyCountMap).map(
    ([name, count]) => ({ name, count })
  )

  const assignedCount = assigned?.length || 0

  let streak = 0
  sessions.forEach((s) => {
    if ((sessionMap[s] || []).length === assignedCount && assignedCount > 0) {
      streak++
    }
  })

    // 🚨 Risk Detection

    // severity increasing?
    let severityRisk = false

    const validSeverity = severityData
      .filter((x) => x.severity > 0)

    if (validSeverity.length >= 3) {
      const last3 = validSeverity.slice(-3)

      if (
        last3[2].severity > last3[1].severity &&
        last3[1].severity > last3[0].severity
      ) {
        severityRisk = true
      }
    }

    // incomplete strategies continuously?
    let consistencyRisk = false

    const incompleteSessionNumbers = strategiesPerSession
      .filter((x) => x.percent < 100)
      .map((x) => x.session)

    let longestRun = 0
    let currentRun = 0

    for (const session of sessions) {
      if (incompleteSessionNumbers.includes(session)) {
        currentRun += 1
        longestRun = Math.max(longestRun, currentRun)
      } else {
        currentRun = 0
      }
    }

    if (longestRun >= 2) {
      consistencyRisk = true
    }

  return (
    <div className="mt-4 space-y-5">
      {/* 🚨 Risk Alerts */}
      <div className="grid gap-4 md:grid-cols-2">

        {severityRisk ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
              <div className="flex items-start gap-3">

                <div className="text-4xl animate-pulse">
                  🚨
                </div>

                <div>
                  <div className="text-lg font-bold text-red-700">
                    Severity Increasing
                  </div>

                  <div className="mt-1 text-sm text-slate-700">
                    Child stuttering severity has increased continuously
                    over recent Days.
                  </div>

                  <div className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    High Clinical Attention Needed
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {consistencyRisk ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">

              <div className="flex items-start gap-3">

                <div className="text-4xl animate-bounce">
                  ⚠️
                </div>

                <div>
                  <div className="text-lg font-bold text-yellow-700">
                    Poor Practice Consistency
                  </div>

                  <div className="mt-1 text-sm text-slate-700">
                    Parent is repeatedly not completing the assigned strategies across Days.
                  </div>

                  <div className="mt-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                    Parent Follow-up Recommended
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}

      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2"></div>
      {/* 📊 Strategies per session */}
      <Card >
        <div className="font-semibold mb-2">Strategies Completed Per day</div>

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={strategiesPerSession || []}  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="strategyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

              <XAxis
                dataKey="session"
                type="number"
                domain={[1, TOTAL_SESSIONS]}
                tickCount={Math.min(TOTAL_SESSIONS, 10)}
                label={{ value: 'Days', position: 'insideBottom', dy: 5}}
              />

              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                label={{ value: '% of strategies completed', angle: -90,  position: 'insideLeftBottom',   dx: -35}}
              />

              
              <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null

                const data = payload[0].payload

                return (
                  <div className="bg-white border rounded-lg shadow px-3 py-2 text-sm">
                    <div className="font-semibold">Day : {data.session}</div>
                    <div>
                      Strategies: {data.completed}/{data.total}
                    </div>
                    <div className="text-blue-600 font-semibold">
                      {data.percent}%
                    </div>
                  </div>
                )
              }}
            />
              <Area
                type="monotone"
                dataKey="percent"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#strategyGradient)"
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 📉 Severity curve */}
    
      <Card>
        <div className="font-semibold mb-2">
          Stuttering Severity Trend
        </div>

        <ResponsiveContainer width="100%" height="100%" minHeight={360}>
          <AreaChart
            data={severityData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >

            {/* 🎨 Gradient for actual graph */}
            <defs>
              <linearGradient id="severityLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>

            {/* 📊 Grid */}
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

            {/* 📅 X Axis */}
            <XAxis
              dataKey="session"
              type="number"
              domain={[1, 10]}
              tickCount={10}
              label={{
                value: 'Days',
                position: 'insideBottom',
                dy: 10
              }}
            />

            {/* 📈 Y Axis */}
            <YAxis
              domain={[0, 9]}
              ticks={[0,1,2,3,4,5,6,7,8,9]}
              tickCount={Math.min(TOTAL_SESSIONS, 10)}
              tickMargin={10}
              label={{
                value: 'Stuttering Severity Rating',
                angle: -90,
                position: 'insideLeft',
                dx: -5,
                style: {
                  textAnchor: 'middle'
                }
              }}
            />

            {/* 🟢 Low Severity Zone */}
            {/* <ReferenceArea
              y1={0}
              y2={3}
              fill="#90EE90"
              fillOpacity={0.3}
            /> */}

            {/* 🟠 Moderate Severity Zone */}
            {/* <ReferenceArea
              y1={3}
              y2={6}
              fill="#FFD580"
              fillOpacity={0.3}
            /> */}

            {/* 🔴 High Severity Zone */}
            {/* <ReferenceArea
              y1={6}
              y2={9}
              fill="#FF7F7F"
              fillOpacity={0.3}
            /> */}

           

            {/* 💬 Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null

                const data = payload[0].payload

                return (
                  <div className="bg-white border rounded-lg shadow px-3 py-2 text-sm">
                    <div className="font-semibold">
                      Day : {data.session}
                    </div>

                    <div>
                      Severity : {data.severity}/9
                    </div>
                  </div>
                )
              }}
            />

            {/* 📈 Actual Severity Trend */}
            <Area
              type="monotone"
              dataKey="severity"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#severityLine)"
              dot={{
                r: 5,
                strokeWidth: 2,
                fill: "#6366f1"
              }}
              animationDuration={1200}
            />

          </AreaChart>
        </ResponsiveContainer>
        
        {/* 🎨 Severity Labels */}        
        {/* <div className="flex justify-center gap-6 mt-4 text-sm font-medium">

          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#FF7F7F' , opacity: 0.5}}
            ></div>
            <span>Low</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#FFD580' ,opacity: 0.5}}
            ></div>
            <span>Moderate</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#90EE90' , opacity: 0.5}}
            ></div>
            <span>High</span>
          </div>

        </div> */}

      </Card>

      {/* 📊 Strategy usage */}
     
    
      <Card>
        <div className="mb-3 font-semibold text-lg">
          Strategies Practiced Over {TOTAL_SESSIONS} Days
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={strategyStats}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

            {/* Hide long names from X-axis */}
            <XAxis
              dataKey="name"
              tick={false}
              label={{ value: 'Strategies', position: 'insideBottom', dy: 10}}
            />

            <YAxis 
              allowDecimals={false}  
              label={{ value: 'Number of Days Practiced', angle: -90,  position: 'insideLeftBottom',   dx: -10}}/>

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null

                const data = payload[0].payload

                return (
                  <div className="rounded-xl border bg-white px-3 py-2 shadow-lg text-sm">
                    <div className="font-semibold text-slate-800">
                      {data.name}
                    </div>

                    <div className="mt-1 text-blue-600 font-medium">
                      Practiced {data.count} days
                    </div>
                  </div>
                )
              }}
            />

            <Bar
              dataKey="count"
              radius={[10, 10, 0, 0]}
            >
              {strategyStats.map((entry, index) => {
                const colors = [
                  '#3b82f6',
                  '#22c55e',
                  '#f59e0b',
                  '#ef4444',
                  '#8b5cf6',
                  '#06b6d4',
                  '#ec4899',
                  '#14b8a6',
                ]

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* 🎨 Color labels */}
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {strategyStats.map((item, index) => {
            const colors = [
              '#3b82f6',
              '#22c55e',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#06b6d4',
              '#ec4899',
              '#14b8a6',
            ]

            return (
              <div
                key={index}
                className="flex items-start gap-2 rounded-lg bg-slate-50 p-2"
              >
                <div
                  className="mt-1 h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: colors[index % colors.length],
                  }}
                />

                <div className="text-xs text-slate-700">
                  {item.name}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 🔥 Streak */}
     
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">

          {/* Background stars */}
          <div className="absolute top-4 left-8 text-red-400 text-xl animate-bounce">
            ✨
          </div>

          <div className="absolute top-6 right-6 text-yellow-500 text-2xl animate-bounce">
            ✨
          </div>

          <div className="absolute bottom-4 left-8 text-red-400 text-xl animate-bounce">
            ✨
          </div>

          <div className="absolute bottom-4 right-8 text-red-400 text-xl animate-bounce">
            ✨
          </div>

          {/* Fire */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
            }}
            className="text-6xl"
          >
            🔥
          </motion.div>

          {/* Streak Number */}
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
            }}
            className="mt-3 text-5xl font-extrabold text-orange-600"
          >
            {streak}
          </motion.div>

          <div className="mt-2 text-lg font-semibold text-slate-700">
            Day Streak
          </div>

          <div className="mt-2 text-sm text-slate-500 text-center px-6">
            Keep practicing daily to maintain your streak and improve fluency 🚀
          </div>
        </Card>
      </motion.div>

    </div>
  )
}    


  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Child 
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Assign strategies or review parent progress submissions.
          </p>
   
         </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => nav('/clinician/dashboard/children')}>
            Back 
          </Button>

          <Button variant="secondary" onClick={loadAll}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? <div className="mt-4 text-sm font-medium text-red-700">{error}</div> : null}
      {msg ? <div className="mt-4 text-sm font-medium text-emerald-700">{msg}</div> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card>
          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : child ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Child </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{child.childName}</div>
                <div className="text-sm text-slate-600"> Age : {child.childAge}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Child ID </div>
                <div className="mt-1 font-mono text-sm font-semibold text-slate-900">{child.childId}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent </div>
                <div className="mt-1 text-sm text-slate-800">{child.parentName}</div>
                <div className="text-xs text-slate-600">{child.email}</div>
                <div className="text-xs text-slate-600">{child.phone}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">Not found.</div>
          )}
        </Card>

        <div className="min-w-0">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={tab === 'assign' ? 'primary' : 'secondary'}
              onClick={() => setTab('assign')}
            >
              Assign Strategies
              <br />
              
            </Button>

            <Button
              variant={tab === 'progress' ? 'primary' : 'secondary'}
              onClick={() => setTab('progress')}
            >
              Check Progress
              <br />
              
            </Button>

            <Button
              variant={tab === 'dashboard' ? 'primary' : 'secondary'}
              onClick={() => setTab('dashboard')}
            >
              Therapy Dashboard
              <br />
             
            </Button>

            <Button
              variant={tab === 'messages' ? 'primary' : 'secondary'}
              onClick={() => setTab('messages')}
            >
              Messages
            
            
            </Button>
          </div>

          {tab === 'assign' ? (
            <Card className="mt-4">
              <div className="text-sm font-semibold text-slate-900">Available strategies / ಲಭ್ಯವಿರುವ ತಂತ್ರಗಳು</div>
              <div className="mt-1 text-xs text-slate-500">
                Check strategies to assign. Assigned strategies are stored with the assignment date.
              </div>

              <div className="mt-4 grid gap-3">
                {loading ? (
                  <div className="text-sm text-slate-600">Loading…</div>
                ) : strategies.length === 0 ? (
                  <div className="text-sm text-slate-600">No strategies yet. Create them in the Strategies section.</div>
                ) : (
                  strategies.map((s) => (
                    <label key={s.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={Boolean(checked[s.id])}
                        onChange={(e) => setChecked((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                        {s.demoVideoUrl ? <div className="text-xs text-slate-600">Demo video attached</div> : null}
                        {assignedIds.has(s.id) ? (
                          <div className="mt-1 text-xs font-medium text-emerald-700">Currently assigned</div>
                        ) : null}
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <Button disabled={busy} onClick={saveAssignments}>
                  {busy ? 'Saving…' : 'Save assignments'}
                </Button>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="text-sm font-semibold text-slate-900">Assigned (with date)</div>
                <div className="mt-3 grid gap-2">
                  {assigned.length === 0 ? (
                    <div className="text-sm text-slate-600">No assigned strategies yet.</div>
                  ) : (
                    assigned.map((a) => (
                      <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-sm font-semibold text-slate-900">{a.strategy?.title || '—'}</div>
                        <div className="mt-1 text-xs text-slate-600">Assigned: {formatDate(a.assignedAt)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ) : tab === 'progress' ? (
            <Card className="mt-4">
             {/* Session Buttons */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {sessions.map((s) => (
                  <Button
                    key={s}
                    variant={selectedSession === s ? 'primary' : 'secondary'}
                    onClick={() => setSelectedSession(s)}
                  >
                    Day {s}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                {!selectedSession ? (
                  <div className="text-sm text-slate-600">Select a Day to view progress.</div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-sm text-slate-600">No submissions for this Day.</div>
                ) : (
                  <div className="grid gap-3">
                    {filteredSubmissions.map((s) => (
                      <div key={s.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {s.strategy?.title || 'Strategy'}
                        </div>

                        <div className="mt-1 text-xs text-slate-600">
                          Submitted: {formatDate(s.submittedAt)}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-800 sm:grid-cols-2">
                          <div>
                            Stuttering: <span className="font-semibold">{s.stuttering}/9</span>
                          </div>
                          <div>
                            Naturalness: <span className="font-semibold">{s.naturalness}/9</span>
                          </div>
                          <div>
                            Duration: <span className="font-semibold">{secondsToHms(s.durationSeconds)}</span>
                          </div>
                        </div>

                        {s.practiceVideoUrl ? (
                          <div className="mt-3">
                            <video className="mt-2 w-full max-w-xl rounded-xl border border-slate-200 bg-black" controls>
                              <source src={resolveMediaUrlLocal(s.practiceVideoUrl)} />
                            </video>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : tab === 'dashboard' ? (
            <TherapyDashboard submissions={submissions} assigned={assigned} />
          ) : (
            <MessagesPanel childId={childId} />
          )}
        </div>
      </div>
    </div>
  )
}

function DateWiseBars({ submissions }) {
  const byDay = new Map()
  for (const s of submissions) {
    const d = new Date(s.submittedAt)
    if (Number.isNaN(d.getTime())) continue
    const key = d.toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) || 0) + 1)
  }
  const rows = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const max = Math.max(1, ...rows.map(([, v]) => v))

  if (rows.length === 0) {
    return <div className="mt-2 text-sm text-slate-600">No submissions yet.</div>
  }

  return (
    <div className="mt-2 grid gap-2">
      {rows.slice(-10).map(([day, count]) => (
        <div key={day} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3">
          <div className="text-xs text-slate-600">{day}</div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-indigo-600"
              style={{ width: `${Math.max(6, Math.round((count / max) * 100))}%` }}
            />
          </div>
          <div className="text-right text-xs font-semibold text-slate-700">{count}</div>
        </div>
      ))}
      <div className="text-[11px] text-slate-500">Showing last 10 days with submissions.</div>
    </div>
  )
}

function MessagesPanel({ childId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.get(`/api/clinicians/children/${childId}/messages`)
      setMessages(data.messages || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [childId])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post(`/api/clinicians/children/${childId}/messages`, { text: trimmed })
      setMessages((m) => [...m, data.message])
      setText('')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send message')
    } finally {
      setBusy(false)
    }
  }

  function formatTime(d) {
    const dt = new Date(d)
    return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString()
  }

  return (
    <Card className="mt-4">
      {error ? <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div> : null}
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">Notification from parent</div>
          <div className="mt-1 text-xs text-slate-500">This appears in the parent dashboard under “Notifications from clinician”.</div>
        </div>
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      {/* {error ? <div className="mt-3 text-sm font-medium text-red-700">{error}</div> : null} */}

      <div className="mt-4 max-h-[45vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}
        {!loading && messages.length === 0 ? <div className="text-sm text-slate-600">No messages yet.</div> : null}

        <div className="grid gap-2">
          {messages.map((m) => {
            const mine = m.senderRole === 'clinician'
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className={`mt-1 text-[11px] ${mine ? 'text-indigo-100' : 'text-slate-500'}`}>{formatTime(m.createdAt)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-slate-900">Notify parent</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring-4"
            placeholder="Type a message to the parent…"
          />
          <Button disabled={busy} onClick={send} className="h-fit">
            {busy ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

