import { useEffect, useState } from 'react'
import type { LoopPattern } from '../audio/patternTypes'
import { copyTextToClipboard } from '../lib/clipboard'
import { serializeLoopPattern } from '../lib/loopStorage'
import { KebabMenu, type KebabMenuItem } from './KebabMenu'
import './LoopMenu.css'

type LoopMenuProps = {
  label: string
  pattern: LoopPattern
  disabled?: boolean
  onDuplicate: () => void
  onDelete: () => void
}

export function LoopMenu({
  label,
  pattern,
  disabled = false,
  onDuplicate,
  onDelete,
}: LoopMenuProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function handleCopyJson(close: () => void) {
    const ok = await copyTextToClipboard(serializeLoopPattern(pattern))
    if (!ok) {
      close()
      return
    }

    setCopied(true)
    window.setTimeout(() => {
      setCopied(false)
      close()
    }, 1200)
  }

  const items: KebabMenuItem[] = [
    {
      key: 'duplicate',
      label: 'duplicate',
      onClick: (close) => {
        onDuplicate()
        close()
      },
    },
    {
      key: 'copy',
      label: copied ? 'copied' : 'copy JSON',
      onClick: (close) => void handleCopyJson(close),
    },
    {
      key: 'delete',
      label: 'delete',
      onClick: (close) => {
        onDelete()
        close()
      },
      danger: true,
    },
  ]

  return (
    <KebabMenu
      label={label}
      className="loop-menu"
      disabled={disabled}
      items={items}
    />
  )
}
