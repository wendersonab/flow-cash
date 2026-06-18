/**
 * Animação SVG de gráfico financeiro feita em CSS puro:
 * - Linha de crescimento desenhando ao carregar (stroke-dashoffset)
 * - Barras verticais crescendo de baixo para cima
 * - Pontos de dado com pulso sutil
 */
export function AnimatedChart() {
  const bars = [
    { x: 24, h: 50 },
    { x: 64, h: 80 },
    { x: 104, h: 65 },
    { x: 144, h: 110 },
    { x: 184, h: 95 },
    { x: 224, h: 140 },
    { x: 264, h: 125 },
    { x: 304, h: 170 },
  ]
  const points = [
    { x: 32, y: 180 },
    { x: 72, y: 150 },
    { x: 112, y: 160 },
    { x: 152, y: 110 },
    { x: 192, y: 120 },
    { x: 232, y: 70 },
    { x: 272, y: 85 },
    { x: 312, y: 40 },
  ]
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  return (
    <svg
      viewBox="0 0 340 220"
      className="h-auto w-full max-w-md"
      role="img"
      aria-label="Gráfico financeiro animado"
    >
      {/* linhas de grade sutis */}
      {[40, 90, 140, 190].map((y) => (
        <line
          key={y}
          x1="16"
          x2="324"
          y1={y}
          y2={y}
          stroke="#00C896"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
      ))}

      {/* barras crescendo */}
      {bars.map((b, i) => (
        <rect
          key={b.x}
          x={b.x}
          y={200 - b.h}
          width="20"
          height={b.h}
          rx="4"
          fill="#00C896"
          fillOpacity="0.18"
          className="fc-chart-bar"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}

      {/* área sob a linha */}
      <path
        d={`${linePath} L 312 200 L 32 200 Z`}
        fill="#00C896"
        fillOpacity="0.08"
      />

      {/* linha desenhando */}
      <path
        d={linePath}
        fill="none"
        stroke="#00C896"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fc-chart-line"
      />

      {/* pontos de dado com pulso */}
      {points.map((p, i) => (
        <circle
          key={p.x}
          cx={p.x}
          cy={p.y}
          r="4.5"
          fill="#00C896"
          className="fc-chart-dot"
          style={{ animationDelay: `${1.6 + i * 0.12}s`, transformOrigin: `${p.x}px ${p.y}px` }}
        />
      ))}
    </svg>
  )
}
