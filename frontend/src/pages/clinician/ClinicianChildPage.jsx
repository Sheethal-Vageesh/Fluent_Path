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
  const [assignmentHistory, setAssignmentHistory] = useState([])
  const [clinicianRatings, setClinicianRatings] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)

  const [tab, setTab] = useState('assign') // assign | progress | dashboard | rate | messages
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
      const [c, s, a, p, cr] = await Promise.all([
        api.get(`/api/clinicians/children/${childId}`),
        api.get('/api/clinicians/strategies'),
        api.get(`/api/clinicians/children/${childId}/assignments`),
        api.get(`/api/clinicians/children/${childId}/progress`),
        api.get(`/api/clinicians/children/${childId}/clinician-ratings`),
      ])
      setChild(c.data.child)
      setStrategies(s.data.strategies || [])
      setAssigned(a.data.assignments || [])
      setSubmissions(p.data.submissions || [])
      setSessionRatings(p.data.sessionRatings || [])
      setAssignmentHistory(p.data.assignmentHistory || [])
      setClinicianRatings(cr.data.ratings || [])

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
  const selectedSessionRating = sessionRatings.find(
    (rating) => rating.sessionNumber === selectedSession
  )

  



 function TherapyDashboard({
  child,
  submissions = [],
  assigned = [],
  sessionRatings = [],
  clinicianRatings = [],
}) {
  function printReport() {
    const previousTitle = document.title
    const reportName = [child?.childName, child?.childId]
      .filter(Boolean)
      .join(' - ')
    document.title = reportName
      ? `${reportName} Progress Report`
      : 'Child Progress Report'

    const restoreTitle = () => {
      document.title = previousTitle
      window.removeEventListener('afterprint', restoreTitle)
    }

    window.addEventListener('afterprint', restoreTitle)
    window.print()
  }

  const hasSubmissions = Array.isArray(submissions) && submissions.length > 0
  const hasClinicianRatings =
    Array.isArray(clinicianRatings) && clinicianRatings.length > 0
  const hasParentRatings =
    Array.isArray(sessionRatings) &&
    sessionRatings.some((s) => s.stuttering != null && s.stuttering !== '')

  if (!hasSubmissions && !hasClinicianRatings && !hasParentRatings) {
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

  const sessionRatingMap = new Map(sessionRatings.map((s) => [s.sessionNumber, s]))

  // 📊 1. Strategies per session (BAR)
  const strategiesPerSession = Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
    const sessionNum = i + 1
    const sessionRating = sessionRatingMap.get(sessionNum)
    const sessionDate = new Date(
      sessionRating?.startedAt || sessionRating?.submittedAt || 0
    )
    const hasSessionDate = !Number.isNaN(sessionDate.getTime()) && sessionDate.getTime() > 0
    const daySubmissions = sessionMap[sessionNum] || []
    const completed = daySubmissions.length
    const manualSessionComplete = Boolean(
      sessionRating?.submittedAt && !sessionRating.autoSubmitted
    )
    const historicalAssignmentCount = hasSessionDate
      ? assignmentHistory.filter((assignment) => {
          const assignedAt = new Date(assignment.assignedAt)
          const updatedAt = new Date(assignment.updatedAt)
          const wasAssigned = !Number.isNaN(assignedAt.getTime()) && assignedAt <= sessionDate
          const wasStillActive = assignment.active || (
            !Number.isNaN(updatedAt.getTime()) && sessionDate < updatedAt
          )
          return wasAssigned && wasStillActive
        }).length
      : 0
    const expectedAssignments = manualSessionComplete
      ? completed
      : historicalAssignmentCount || assigned.length

    return {
      session: sessionNum,
      percent: expectedAssignments
        ? Math.min(100, Math.round((completed / expectedAssignments) * 100))
        : 0,
      completed,
      total: expectedAssignments,
    }
  })
  // 📉 2. Severity (LINE)
    const severityData = Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
      const session = i + 1
      const rating = sessionRatingMap.get(session)

      return {
        session,
        severity:
          rating && Number.isFinite(rating.stuttering)
            ? Number(rating.stuttering)
            : null,
      }
    })

    const naturalnessData = Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
      const session = i + 1
      const rating = sessionRatingMap.get(session)

      return {
        session,
        naturalness:
          rating && Number.isFinite(rating.naturalness)
            ? Number(rating.naturalness)
            : null,
      }
    })

  const clinicianSeverityData = [...(clinicianRatings || [])]
    .sort((a, b) => a.day - b.day)
    .map((r) => ({
      day: r.day,
      dayValue: r.dayValue,
      severity: r.rating,
    }))

  const maxClinicianDay = clinicianSeverityData.length
    ? Math.max(...clinicianSeverityData.map((d) => d.day))
    : 1

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

    const validSeverity = severityData.filter(
      (x) => x.severity != null && x.severity > 0
    )

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

    const finalizedSessions = sessionRatings
      .filter((rating) => rating.submittedAt)
      .map((rating) => rating.sessionNumber)
      .sort((a, b) => a - b)
    const incompleteSessionNumbers = new Set(
      strategiesPerSession
        .filter((session) => {
          const rating = sessionRatingMap.get(session.session)
          return (
            rating?.autoSubmitted &&
            finalizedSessions.includes(session.session) &&
            session.total > 0 &&
            session.percent < 100
          )
        })
        .map((session) => session.session)
    )

    let longestRun = 0
    let currentRun = 0
    let previousSession = null

    for (const session of finalizedSessions) {
      if (previousSession !== null && session !== previousSession + 1) {
        currentRun = 0
      }
      if (incompleteSessionNumbers.has(session)) {
        currentRun += 1
        longestRun = Math.max(longestRun, currentRun)
      } else {
        currentRun = 0
      }
      previousSession = session
    }

    if (longestRun >= 2) {
      consistencyRisk = true
    }

  return (
    <div id="printable-progress-report" className="mt-4 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {child?.childName || 'Child'}
            {child?.childId ? ` (${child.childId})` : ''} Progress Report
          </h2>
          <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
            <div>Child: <span className="font-semibold text-slate-900">{child?.childName || '—'}</span></div>
            <div>Age: <span className="font-semibold text-slate-900">{child?.childAge ?? '—'}</span></div>
            <div>Child ID: <span className="font-semibold text-slate-900">{child?.childId || '—'}</span></div>
            <div>Baseline severity: <span className="font-semibold text-slate-900">{child?.baselineSeverity || '—'}</span></div>
            <div>Report generated: <span className="font-semibold text-slate-900">{new Date().toLocaleDateString()}</span></div>
          </div>
        </div>
        <Button className="no-print" onClick={printReport}>
          Download / Print PDF
        </Button>
      </div>

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

      {/* 📉 Parent-reported severity */}
    
      <Card>
        <div className="font-semibold mb-2">
          Parent-Reported Stuttering Severity
        </div>

        {!hasParentRatings ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No parent severity ratings yet.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={360}>
          <AreaChart
            data={severityData.filter((d) => d.severity != null)}
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
              domain={[1, TOTAL_SESSIONS]}
              tickCount={Math.min(TOTAL_SESSIONS, 10)}
              label={{
                value: 'Practice days',
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
        )}
        
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

      {/* 📈 Parent-reported speech naturalness */}
      <Card>
        <div className="font-semibold mb-2">
          Parent-Reported Speech Naturalness
        </div>

        {!naturalnessData.some((d) => d.naturalness != null) ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No parent speech naturalness ratings yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={360}>
            <AreaChart
              data={naturalnessData.filter((d) => d.naturalness != null)}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="naturalnessLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

              <XAxis
                dataKey="session"
                type="number"
                domain={[1, TOTAL_SESSIONS]}
                tickCount={Math.min(TOTAL_SESSIONS, 10)}
                label={{
                  value: 'Practice days',
                  position: 'insideBottom',
                  dy: 10,
                }}
              />

              <YAxis
                domain={[1, 9]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                tickMargin={10}
                label={{
                  value: 'Speech Naturalness Rating',
                  angle: -90,
                  position: 'insideLeft',
                  dx: -5,
                  style: { textAnchor: 'middle' },
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null

                  const data = payload[0].payload
                  return (
                    <div className="bg-white border rounded-lg shadow px-3 py-2 text-sm">
                      <div className="font-semibold">Day: {data.session}</div>
                      <div>Naturalness: {data.naturalness}/9</div>
                    </div>
                  )
                }}
              />

              <Area
                type="monotone"
                dataKey="naturalness"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#naturalnessLine)"
                dot={{ r: 5, strokeWidth: 2, fill: '#10b981' }}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 📉 Clinician live-session severity */}
      <Card>
        <div className="font-semibold mb-2">
          Clinician Live Session — Stuttering Severity
        </div>

        {!hasClinicianRatings ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No clinician ratings yet. Add ratings in the &quot;Rate Stuttering Severity&quot; tab.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <AreaChart
              data={clinicianSeverityData}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="clinicianSeverityLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

              <XAxis
                dataKey="day"
                type="number"
                domain={[1, maxClinicianDay]}
                allowDecimals={false}
                label={{
                  value: 'Live session #',
                  position: 'insideBottom',
                  dy: 10,
                }}
              />

              <YAxis
                domain={[0, 9]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                label={{
                  value: 'Stuttering Severity (0–9)',
                  angle: -90,
                  position: 'insideLeft',
                  dx: -5,
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white border rounded-lg shadow px-3 py-2 text-sm">
                      <div className="font-semibold">
                        Session {data.day}: {data.dayValue}
                      </div>
                      <div className="text-emerald-700 font-medium">
                        Severity: {data.severity}/9
                      </div>
                    </div>
                  )
                }}
              />

              <Area
                type="monotone"
                dataKey="severity"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#clinicianSeverityLine)"
                dot={{ r: 5, strokeWidth: 2, fill: '#10b981' }}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
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
              variant={tab === 'rate' ? 'primary' : 'secondary'}
              onClick={() => setTab('rate')}
            >
              Rate Stuttering Severity
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
                ) : (
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        Day {selectedSession} ratings
                      </div>
                      {selectedSessionRating ? (
                        <>
                          <div className="mt-1 text-xs text-slate-600">
                            Submitted: {formatDate(selectedSessionRating.submittedAt)}
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-slate-800 sm:grid-cols-2">
                            <div>
                              Stuttering severity:{' '}
                              <span className="font-semibold">
                                {selectedSessionRating.stuttering ?? 'Not recorded'}
                                {selectedSessionRating.stuttering != null ? '/9' : ''}
                              </span>
                            </div>
                            <div>
                              Speech naturalness:{' '}
                              <span className="font-semibold">
                                {selectedSessionRating.naturalness ?? 'Not recorded'}
                                {selectedSessionRating.naturalness != null ? '/9' : ''}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 text-sm text-slate-600">
                          No day ratings submitted.
                        </div>
                      )}
                    </div>

                    {filteredSubmissions.length === 0 ? (
                      <div className="text-sm text-slate-600">No strategy submissions for this Day.</div>
                    ) : (
                      filteredSubmissions.map((s) => (
                        <div key={s.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-sm font-semibold text-slate-900">
                            {s.strategy?.title || 'Strategy'}
                          </div>

                          <div className="mt-1 text-xs text-slate-600">
                            Submitted: {formatDate(s.submittedAt)}
                          </div>

                          <div className="mt-3 text-sm text-slate-800">
                            Duration: <span className="font-semibold">{secondsToHms(s.durationSeconds)}</span>
                          </div>

                          {s.practiceVideoUrl ? (
                            <div className="mt-3">
                              {s.practiceMediaType === 'audio' ? (
                                <audio
                                  className="mt-2 w-full max-w-xl"
                                  controls
                                  src={resolveMediaUrlLocal(s.practiceVideoUrl)}
                                >
                                  Your browser does not support audio playback.
                                </audio>
                              ) : (
                                <video className="mt-2 w-full max-w-xl rounded-xl border border-slate-200 bg-black" controls>
                                  <source src={resolveMediaUrlLocal(s.practiceVideoUrl)} />
                                </video>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : tab === 'dashboard' ? (
            <TherapyDashboard
              child={child}
              submissions={submissions}
              assigned={assigned}
              sessionRatings={sessionRatings}
              clinicianRatings={clinicianRatings}
            />
          ) : tab === 'rate' ? (
            <ClinicianRatingPanel
              childId={childId}
              ratings={clinicianRatings}
              onUpdated={(change) => {
                if (change?.type === 'replace' && Array.isArray(change.ratings)) {
                  setClinicianRatings(change.ratings)
                } else if (change?.type === 'add' && change.rating) {
                  setClinicianRatings((current) =>
                    current.some((rating) => rating.id === change.rating.id)
                      ? current
                      : [...current, change.rating]
                  )
                } else if (change?.type === 'delete') {
                  setClinicianRatings((current) =>
                    current.filter((rating) => rating.id !== change.ratingId)
                  )
                }
              }}
            />
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

const WEEKDAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function ClinicianRatingPanel({ childId, ratings = [], onUpdated }) {
  const [dayValue, setDayValue] = useState('')
  const [rating, setRating] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  const sortedRatings = [...ratings].sort((a, b) => a.day - b.day)
  const nextDay = sortedRatings.length
    ? Math.max(...sortedRatings.map((r) => r.day)) + 1
    : 1

  async function refreshRatings(showError = true) {
    if (showError) setError(null)
    try {
      const { data } = await api.get(
        `/api/clinicians/children/${childId}/clinician-ratings`
      )
      if (!Array.isArray(data?.ratings)) {
        throw new Error('Ratings endpoint returned an invalid response')
      }
      onUpdated?.({ type: 'replace', ratings: data.ratings })
      return data.ratings
    } catch (err) {
      if (showError) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Failed to reload recorded ratings'
        )
      }
      return null
    }
  }

  async function submitRating() {
    const trimmed = dayValue.trim()
    if (!trimmed) {
      setError('Enter when the live session occurred (e.g. Tuesday).')
      return
    }
    if (rating === null) {
      setError('Select a severity rating from 0 to 9.')
      return
    }

    setBusy(true)
    setError(null)
    setMsg(null)
    try {
      const { data } = await api.post(
        `/api/clinicians/children/${childId}/clinician-ratings`,
        {
          dayValue: trimmed,
          rating,
        }
      )
      if (typeof data === 'string') {
        throw new Error(
          'The configured backend does not have the clinician ratings API. Start the local backend or deploy the latest backend version.'
        )
      }
      let savedRating = data?.rating
      if (savedRating) {
        onUpdated?.({ type: 'add', rating: savedRating })
      } else {
        const refreshedRatings = await refreshRatings(false)
        savedRating = refreshedRatings
          ?.filter(
            (item) => item.dayValue === trimmed && item.rating === rating
          )
          .sort((left, right) => right.day - left.day)[0]
      }

      setMsg(
        savedRating
          ? `Rating saved as live session ${savedRating.day}.`
          : 'The server accepted the rating, but it could not be confirmed in the recorded ratings list. Refresh the list or check the backend deployment.'
      )
      setDayValue('')
      setRating(null)
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to save rating'
      )
    } finally {
      setBusy(false)
    }
  }

  async function removeRating(ratingId) {
    if (!window.confirm('Remove this rating?')) return
    setBusy(true)
    setError(null)
    try {
      await api.delete(
        `/api/clinicians/children/${childId}/clinician-ratings/${ratingId}`
      )
      onUpdated?.({ type: 'delete', ratingId })
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete rating')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-4">
      <div className="text-sm font-semibold text-slate-900">
        Rate stuttering severity (live sessions)
      </div>
      <p className="mt-1 text-xs text-slate-600">
        After each live session with the child, record when it happened and a severity
        score (0–9). Sessions are numbered automatically (1, 2, 3…) and are separate
        from parent daily practice ratings.
      </p>

      {error ? (
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {msg ? (
        <div
          className={`mt-3 rounded-xl p-3 text-sm font-medium ${
            msg.startsWith('The server accepted')
              ? 'bg-amber-50 text-amber-800'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {msg}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Next live session: Day {nextDay}
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-900">
            Session day / date label
          </label>
          <p className="mt-1 text-xs text-slate-500">
            e.g. Tuesday, Thursday, or 4 June 2026
          </p>
          <input
            type="text"
            value={dayValue}
            onChange={(e) => setDayValue(e.target.value)}
            placeholder="Tuesday"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            maxLength={100}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDayValue(d)}
                className={`rounded-lg border px-2 py-1 text-xs font-medium transition ${
                  dayValue === d
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-semibold text-slate-900">
            Stuttering severity (0–9)
          </div>
          <div className="mt-1 text-xs text-slate-500">
            0 = no stuttering · 9 = extremely severe
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
                  rating === i
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button disabled={busy} onClick={submitRating}>
            {busy ? 'Saving…' : `Save as session ${nextDay}`}
          </Button>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Recorded ratings</div>
          <Button variant="secondary" disabled={busy} onClick={refreshRatings}>
            Refresh ratings
          </Button>
        </div>
        {sortedRatings.length === 0 ? (
          <div className="mt-3 text-sm text-slate-600">No ratings yet.</div>
        ) : (
          <div className="mt-3 grid gap-2">
            {sortedRatings.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Session {r.day}: {r.dayValue}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Severity {r.rating}/9 · {formatDate(r.ratedAt)}
                  </div>
                </div>
                {/* <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => removeRating(r.id)}
                >
                  Remove
                </Button> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
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
