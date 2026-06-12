import { useEffect, useState } from 'react'
import { copyTextToClipboard } from '../lib/clipboard'
import { serializeEnsemble } from '../lib/ensembleStorage'
import { KebabMenu, type KebabMenuItem } from './KebabMenu'
import './EnsembleMenu.css'

type EnsembleMenuProps = {
  ensembleId: string
  label: string
  disabled?: boolean
  onRename: () => void
  onDelete: () => void
}

export function EnsembleMenu({
  ensembleId,
  label,
  disabled = false,
  onRename,
  onDelete,
}: EnsembleMenuProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function handleExportJson(close: () => void) {
    const json = serializeEnsemble(ensembleId)
    if (!json) {
      close()
      return
    }

    const ok = await copyTextToClipboard(json)
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
      key: 'rename',
      label: 'rename',
      onClick: (close) => {
        onRename()
        close()
      },
    },
    {
      key: 'export',
      label: copied ? 'copied' : 'export JSON',
      onClick: (close) => void handleExportJson(close),
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
      className="ensemble-menu"
      disabled={disabled}
      items={items}
    />
  )
}
