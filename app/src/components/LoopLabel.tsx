import { useLayoutEffect, useRef } from 'react'

const MAX_FONT_PX = 10
const MIN_FONT_PX = 6

type LoopLabelProps = {
  label: string
}

export function LoopLabel({ label }: LoopLabelProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) {
      return
    }

    let size = MAX_FONT_PX
    text.style.fontSize = `${size}px`

    while (size > MIN_FONT_PX && text.scrollWidth > container.clientWidth) {
      size -= 0.5
      text.style.fontSize = `${size}px`
    }
  }, [label])

  return (
    <p ref={containerRef} className="tape-loop-row__label" title={label}>
      <span ref={textRef} className="tape-loop-row__label-text">
        {label}
      </span>
    </p>
  )
}
