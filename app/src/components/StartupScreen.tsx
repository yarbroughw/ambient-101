import { useEffect, useId, useRef, useState } from 'react'
import {
  ENSEMBLE_TEMPLATES,
  instantiateEnsembleTemplate,
  type EnsembleTemplateId,
} from '../audio/ensembleTemplates'
import {
  createEnsemble,
  deleteEnsemble,
  listEnsembles,
  nextAvailableEnsembleName,
  nextDefaultEnsembleName,
  type EnsembleEntry,
} from '../lib/ensembleStorage'
import { DEFAULT_PACE_SCALE } from '../lib/globalPace'
import { ConfirmModal } from './ConfirmModal'
import { StartAudioButton } from './StartAudioButton'
import './StartupScreen.css'

type StartupScreenProps = {
  onOpen: (ensembleId: string) => void
}

function readStartupListState(): {
  entries: EnsembleEntry[]
  lastOpenedId: string | null
  selectedId: string | null
} {
  const { entries, lastOpenedId } = listEnsembles()
  const selectedId =
    lastOpenedId && entries.some((entry) => entry.id === lastOpenedId)
      ? lastOpenedId
      : (entries[0]?.id ?? null)

  return { entries, lastOpenedId, selectedId }
}

export function StartupScreen({ onOpen }: StartupScreenProps) {
  const initialListState = readStartupListState()
  const [entries, setEntries] = useState(initialListState.entries)
  const [lastOpenedId, setLastOpenedId] = useState(initialListState.lastOpenedId)
  const [selectedId, setSelectedId] = useState(initialListState.selectedId)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EnsembleEntry | null>(null)
  const menuId = useId()
  const templatesRef = useRef<HTMLDivElement>(null)

  function refreshList() {
    const nextState = readStartupListState()
    setEntries(nextState.entries)
    setLastOpenedId(nextState.lastOpenedId)
    setSelectedId((current) => {
      if (current && nextState.entries.some((entry) => entry.id === current)) {
        return current
      }
      return nextState.selectedId
    })
  }

  useEffect(() => {
    if (!templatesOpen) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      if (!templatesRef.current?.contains(event.target as Node)) {
        setTemplatesOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setTemplatesOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [templatesOpen])

  function handleCreateBlank() {
    const currentEntries = listEnsembles().entries
    const entry = createEnsemble({
      name: nextDefaultEnsembleName(currentEntries),
      loops: [],
      paceScale: DEFAULT_PACE_SCALE,
    })
    refreshList()
    setSelectedId(entry.id)
  }

  function handleCreateFromTemplate(templateId: EnsembleTemplateId) {
    const currentEntries = listEnsembles().entries
    const { loops, paceScale, suggestedName } =
      instantiateEnsembleTemplate(templateId)
    const entry = createEnsemble({
      name: nextAvailableEnsembleName(suggestedName, currentEntries),
      loops,
      paceScale,
    })
    setTemplatesOpen(false)
    refreshList()
    setSelectedId(entry.id)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return
    }

    deleteEnsemble(deleteTarget.id)
    setDeleteTarget(null)
    refreshList()
  }

  return (
    <div className="startup-screen">
      <h1 className="startup-screen__title">ambient 101: music for usb ports</h1>

      <section className="startup-screen__section" aria-label="Saved ensembles">
        <h2 className="startup-screen__heading">your ensembles</h2>
        {entries.length === 0 ? (
          <p className="startup-screen__empty">no saved ensembles yet</p>
        ) : (
          <ul className="startup-ensembles">
            {entries.map((entry) => {
              const selected = selectedId === entry.id
              const recentlyOpened = lastOpenedId === entry.id
              return (
                <li
                  key={entry.id}
                  className={`startup-ensembles__item${
                    selected ? ' is-selected' : ''
                  }${recentlyOpened ? ' is-recent' : ''}`}
                >
                  <button
                    type="button"
                    className="startup-ensembles__select"
                    aria-pressed={selected}
                    onClick={() => setSelectedId(entry.id)}
                  >
                    <span className="startup-ensembles__name">{entry.name}</span>
                    <span className="startup-ensembles__meta">
                      {entry.reelCount}{' '}
                      {entry.reelCount === 1 ? 'reel' : 'reels'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="startup-ensembles__delete"
                    aria-label={`Delete ${entry.name}`}
                    onClick={() => setDeleteTarget(entry)}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="startup-screen__section" aria-label="New ensemble">
        <h2 className="startup-screen__heading">new ensemble</h2>
        <div className="startup-screen__new">
          <button
            type="button"
            className="startup-screen__new-btn"
            onClick={handleCreateBlank}
          >
            blank
          </button>

          <div className="startup-templates" ref={templatesRef}>
            <button
              type="button"
              className={`startup-templates__trigger${
                templatesOpen ? ' is-open' : ''
              }`}
              aria-haspopup="menu"
              aria-expanded={templatesOpen}
              aria-controls={menuId}
              onClick={() => setTemplatesOpen((open) => !open)}
            >
              templates
              <span className="startup-templates__caret" aria-hidden>
                ▾
              </span>
            </button>

            {templatesOpen ? (
              <div id={menuId} className="startup-templates__menu" role="menu">
                {ENSEMBLE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="startup-templates__item"
                    role="menuitem"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <StartAudioButton
        disabled={!selectedId}
        onReady={() => {
          if (selectedId) {
            onOpen(selectedId)
          }
        }}
      />

      <ConfirmModal
        open={deleteTarget != null}
        title="delete ensemble?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? This cannot be undone.`
            : ''
        }
        confirmLabel="delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
