import { formatTenor } from '../../domain/marketFormat.js'

const WIDTH = 720
const HEIGHT = 220
const PADDING = { top: 20, right: 22, bottom: 34, left: 56 }
const Y_TICK_COUNT = 5
const DOMAIN_STEP = 0.0005
const DOMAIN_PADDING = 0.001

function formatYield(value) {
  return `${(value * 100).toFixed(3)}%`
}

function curvePoints(rows) {
  return rows
    .map((row) => ({
      tenor: Number(row.instrument.tenor),
      yield: row.instrument.value,
      sessionOpen: row.instrument.observedOpen,
      direction: row.instrument.lastDirection,
    }))
    .filter(
      ({ tenor, yield: value, sessionOpen }) =>
        Number.isFinite(tenor) &&
        tenor > 0 &&
        Number.isFinite(value) &&
        Number.isFinite(sessionOpen),
    )
    .sort((a, b) => a.tenor - b.tenor)
}

export default function YieldCurveChart({ rows }) {
  const points = curvePoints(rows)
  if (points.length < 2) return null

  const tenors = points.map((point) => point.tenor)
  const yields = points.flatMap((point) => [point.yield, point.sessionOpen])
  const minTenor = Math.min(...tenors)
  const maxTenor = Math.max(...tenors)
  const minYield = Math.min(...yields)
  const maxYield = Math.max(...yields)
  const domainMin = Math.floor((minYield - DOMAIN_PADDING) / DOMAIN_STEP) * DOMAIN_STEP
  const domainMax = Math.ceil((maxYield + DOMAIN_PADDING) / DOMAIN_STEP) * DOMAIN_STEP
  const chartWidth = WIDTH - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom
  const xOf = (tenor) =>
    PADDING.left + ((tenor - minTenor) / Math.max(maxTenor - minTenor, 1)) * chartWidth
  const yOf = (value) =>
    PADDING.top + ((domainMax - value) / (domainMax - domainMin)) * chartHeight
  const currentLine = points
    .map((point) => `${xOf(point.tenor)},${yOf(point.yield)}`)
    .join(' ')
  const sessionLine = points
    .map((point) => `${xOf(point.tenor)},${yOf(point.sessionOpen)}`)
    .join(' ')
  const yTicks = Array.from({ length: Y_TICK_COUNT }, (_, index) =>
    domainMin + ((domainMax - domainMin) * index) / (Y_TICK_COUNT - 1),
  )
  const description = `Yield curve from ${formatTenor(minTenor)} to ${formatTenor(maxTenor)}. Yields range from ${formatYield(minYield)} to ${formatYield(maxYield)}.`

  return (
    <figure className="market-curve-chart">
      <svg
        className="market-curve-chart__plot"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={description}
      >
        <title>{description}</title>
        {yTicks.map((tick) => {
          const y = yOf(tick)
          return (
            <g key={tick}>
              <line className="market-curve-chart__grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} />
              <text className="market-curve-chart__y-label" x={PADDING.left - 9} y={y + 3} textAnchor="end">
                {formatYield(tick)}
              </text>
            </g>
          )
        })}
        <polyline className="market-curve-chart__line market-curve-chart__line--session" points={sessionLine} />
        <polyline className="market-curve-chart__line market-curve-chart__line--current" points={currentLine} />
        {points.map((point, index) => {
          const x = xOf(point.tenor)
          const y = yOf(point.yield)
          return (
            <g key={point.tenor}>
              <circle
                className={`market-curve-chart__point market-curve-chart__point--${point.direction}`}
                cx={x}
                cy={y}
                r="4"
              />
              <text
                className={`market-curve-chart__x-label${index === 1 || index === 3 ? ' market-curve-chart__x-label--secondary' : ''}`}
                x={x}
                y={HEIGHT - 10}
                textAnchor="middle"
              >
                {formatTenor(point.tenor)}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="market-curve-chart__caption">
        <span className="market-curve-chart__legend-item market-curve-chart__legend-item--current">
          Current
        </span>
        <span className="market-curve-chart__legend-item market-curve-chart__legend-item--session">
          Session open
        </span>
      </figcaption>
    </figure>
  )
}
