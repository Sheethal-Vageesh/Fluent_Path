import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui'
import { api } from '../../lib/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export function ClinicianProgressDashboard() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // const [severityFilter, setSeverityFilter] = useState('all')
  const [ageFilter, setAgeFilter] = useState('all')
  const [progressFilter, setProgressFilter] = useState('all')
  const [baselineFilter, setBaselineFilter] = useState('all')
  const [selectedChildren, setSelectedChildren] =  useState([])
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        const { data } = await api.get(
          '/api/clinicians/progress-dashboard'
        )

        setChildren(data.children || [])
      } catch (err) {
        setError(
          err?.response?.data?.error ||
          'Failed to load dashboard'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredChildren = useMemo(() => {
    return children.filter((c) => {

      // severity
      // if (severityFilter !== 'all') {
      //   if (severityFilter === 'low' && c.averageSeverity >= 3)
      //     return false

      //   if (
      //     severityFilter === 'moderate' &&
      //     (c.averageSeverity < 3 || c.averageSeverity > 6)
      //   )
      //     return false

      //   if (severityFilter === 'high' && c.averageSeverity <= 6)
      //     return false
      // }

      // baseline severity filter
      if (baselineFilter !== 'all') {

        if (
          c.baselineSeverity !== baselineFilter
        ) {
          return false
        }
      }
      // age (include all children in the selected year range)
      if (
        ageFilter !== 'all' &&
        !(Number(c.childAge) >= Number(ageFilter) && Number(c.childAge) < Number(ageFilter) + 1)
      ) {
        return false
      }

      // progress
      if (progressFilter !== 'all') {

        if (
          progressFilter === 'completed' &&
          c.completedSessions < 10
        ) {
          return false
        }

        if (
          progressFilter === 'ongoing' &&
          c.completedSessions === 10
        ) {
          return false
        }
      }

      return true
    })
  }, [
    children,
    // severityFilter,
    baselineFilter,
    ageFilter,
    progressFilter,
  ])

  const selectedChildObjects =
      filteredChildren.filter((c) =>
        selectedChildren.includes(c.id)
      )

    const combinedGraphData = []

    for (let day = 1; day <= 10; day++) {

      const row = { day }

      selectedChildObjects.forEach((child) => {

        const session = child.severityTrend?.find(
          (s) => s.day === day
        )

        row[child.childName] =
          session?.severity || null
      })

      combinedGraphData.push(row)
    }

  return (
    <div className="mx-auto max-w-7xl">

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Progress Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Track and evaluate therapy progress across all children.
        </p>
      </div>

      {/* Filters */}
      <Card className="mt-5 p-4">
        <div className="grid gap-4 md:grid-cols-4">

          {/* <div>
            <label className="text-sm font-medium text-slate-700">
              Stutterig Severity Rating
            </label>

            <select
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-2"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div> */}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Baseline Severity
            </label>

            <select
              value={baselineFilter}
              onChange={(e) =>
                setBaselineFilter(e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-2"
            >
              <option value="all">All</option>
              <option value="Very Mild">Very Mild</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Very Severe">Very Severe</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
                Age
            </label>

            <select
                value={ageFilter}
                onChange={(e) =>
                setAgeFilter(e.target.value)
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="all">All Ages</option>

                {Array.from({ length: 4 }, (_, i) => i + 3).map(
                  (age) => (
                    <option key={age} value={age}>
                      {age} years ({age}.0–{age}.9)
                    </option>
                  )
                )}
            </select>
            </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Progress
            </label>

            <select
              value={progressFilter}
              onChange={(e) =>
                setProgressFilter(e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-2"
            >
              <option value="all">All</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">
                Completed
              </option>
            </select>
          </div>

        </div>
      </Card>

      {/* Table */}
      <Card className="mt-5 overflow-x-auto">

        {loading ? (
          <div className="p-4 text-sm text-slate-600">
            Loading...
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">
            {error}
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">
            No data found.
          </div>
        ) : (
          <table className="min-w-full text-sm">

            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 text-left">Child ID</th>
                <th className="p-3 text-left">Child Name</th>
                <th className="p-3 text-left">Age</th>
                <th className="p-3 text-left">Parent</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">
                    Days
                </th>
                <th className="p-3 text-left">
                  Baseline Severity
                </th>
                {/* <th className="p-3 text-left">
                  Avg Severity
                </th> */}
              </tr>
            </thead>

            <tbody>
              {filteredChildren.map((c) => (
                <tr
                  key={c.id}
                  className="border-t"
                >
                  <td className="p-3">
                    {c.childId}
                  </td>

                  <td className="p-3 font-medium">
                    {c.childName}
                  </td>

                  <td className="p-3">
                    {c.childAge}
                  </td>

                  <td className="p-3">
                    {c.parentName}
                  </td>

                  <td className="p-3">
                    {c.email}
                  </td>

                  <td className="p-3">
                    {c.phone}
                  </td>

                  {/* <td className="p-3">
                    {c.completedSessions}/10
                  </td> */}
                  <td className="p-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                            className="h-2 rounded-full bg-indigo-600 transition-all"
                            style={{
                            width: `${(c.completedSessions / 10) * 100}%`,
                            }}
                        />
                        </div>

                        <span className="text-xs font-semibold text-slate-700">
                        {c.completedSessions}/10
                        </span>
                    </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          c.baselineSeverity === 'Very Mild'
                            ? 'bg-green-100 text-green-700'
                            : c.baselineSeverity === 'Mild'
                            ? 'bg-lime-100 text-lime-700'
                            : c.baselineSeverity === 'Moderate'
                            ? 'bg-yellow-100 text-yellow-700'
                            : c.baselineSeverity === 'Severe'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {c.baselineSeverity}
                      </span>
                    </td>

                  {/* <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        c.averageSeverity < 3
                          ? 'bg-green-100 text-green-700'
                          : c.averageSeverity < 6
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {c.averageSeverity.toFixed(1)}
                    </span>
                  </td> */}
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </Card>

        {/*Combined Graph Filter */}
      <Card className="mt-5 p-4">

        <h2 className="font-semibold mb-3">
          Select Children for Combined Graph
        </h2>

        <div className="flex flex-wrap gap-3">

          {filteredChildren.map((child) => (

            <label
              key={child.id}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer"
            >

              <input
                type="checkbox"
                checked={selectedChildren.includes(child.id)}

                onChange={(e) => {

                  if (e.target.checked) {

                    setSelectedChildren((prev) => [
                      ...prev,
                      child.id
                    ])

                  } else {

                    setSelectedChildren((prev) =>
                      prev.filter(
                        (id) => id !== child.id
                      )
                    )
                  }
                }}
              />

              <span className="text-sm">
                {child.childName}
              </span>

            </label>
          ))}

        </div>

      </Card>

          {/* Combined Graph */}
      <Card className="mt-6 p-5">

        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Combined Severity Trend
        </h2>

        <ResponsiveContainer
          width="100%"
          height={450}
        >

          <LineChart
            data={combinedGraphData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.2}
            />

            <XAxis
              dataKey="day"
              label={{
                value: 'Days',
                position: 'insideBottom',
                dy: 10
              }}
            />

            <YAxis
              domain={[0, 9]}
              ticks={[0,1,2,3,4,5,6,7,8,9]}
              label={{
                value: 'Stuttering Severity Rating',
                angle: -90,
                position: 'insideLeft',
                dx: -10
              }}
            />

            <Tooltip />

            <Legend />

            {selectedChildObjects.map(
              (child, index) => (

                <Line
                  key={child.id}

                  type="monotone"

                  dataKey={child.childName}

                  stroke={`hsl(${index * 45}, 70%, 50%)`}

                  strokeWidth={3}

                  dot={{ r: 4 }}

                  activeDot={{ r: 6 }}
                />
              )
            )}

          </LineChart>

        </ResponsiveContainer>

      </Card>
    </div>
  )
}