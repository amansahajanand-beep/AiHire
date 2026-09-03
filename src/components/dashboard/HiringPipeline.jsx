import Card, { CardHeader } from '../ui/Card';
import { hiringPipeline } from '../../data/mockData';

export default function HiringPipeline() {
  const stages = hiringPipeline;
  const segmentH = 44;
  const gap = 10;
  const svgW = 280;
  const topW = 268;
  const bottomW = 96;
  const totalH = stages.length * segmentH + (stages.length - 1) * gap;
  const centerX = svgW / 2;

  const widthAt = (t) => topW + (bottomW - topW) * t;

  return (
    <Card>
      <CardHeader title="Hiring Pipeline" />

      <div className="flex items-start justify-center gap-4 pt-2">
        <svg
          viewBox={`0 0 ${svgW} ${totalH}`}
          className="w-full max-w-[260px] h-auto"
          role="img"
          aria-label="Hiring pipeline funnel"
        >
          <defs>
            {stages.map((stage, i) => (
              <linearGradient key={`g-${stage.stage}`} id={`funnel-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stage.color} stopOpacity="1" />
                <stop offset="100%" stopColor={stage.color} stopOpacity="0.88" />
              </linearGradient>
            ))}
          </defs>

          {stages.map((stage, i) => {
            const y = i * (segmentH + gap);
            const t0 = i / stages.length;
            const t1 = (i + 1) / stages.length;
            const w0 = widthAt(t0);
            const w1 = widthAt(t1);
            const xl0 = centerX - w0 / 2;
            const xr0 = centerX + w0 / 2;
            const xl1 = centerX - w1 / 2;
            const xr1 = centerX + w1 / 2;

            return (
              <g key={stage.stage}>
                <path
                  d={`M ${xl0} ${y} L ${xr0} ${y} L ${xr1} ${y + segmentH} L ${xl1} ${y + segmentH} Z`}
                  fill={`url(#funnel-${i})`}
                  rx="8"
                />
                <text
                  x={centerX}
                  y={y + segmentH / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                >
                  {stage.stage}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex flex-col shrink-0" style={{ gap: `${gap}px` }}>
          {stages.map((stage) => (
            <div
              key={stage.stage}
              className="flex items-center justify-end pr-1"
              style={{ height: segmentH }}
            >
              <span className="text-sm font-bold text-slate-800 tabular-nums">
                {stage.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
