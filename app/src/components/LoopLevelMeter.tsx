import './LoopLevelMeter.css'

type LoopLevelMeterProps = {
  level: number
  peak: number
  active: boolean
}

export function LoopLevelMeter({ level, peak, active }: LoopLevelMeterProps) {
  const fillHeight = active ? Math.min(100, level * 100) : 0
  const peakBottom = active ? Math.min(100, peak * 100) : 0

  return (
    <div
      className="loop-level"
      role="meter"
      aria-label="Loop level"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fillHeight)}
    >
      <div className="loop-level__track">
        <div
          className="loop-level__fill"
          style={{ height: `${fillHeight}%` }}
        />
        {active && peak > 0.03 ? (
          <div
            className="loop-level__peak"
            style={{ bottom: `${peakBottom}%` }}
          />
        ) : null}
      </div>
    </div>
  )
}
