import { useEffect, useId, useRef, useState } from 'react'
import { useDismissable } from '../hooks/useDismissable'
import { ensureAudioStarted } from '../audio/audioSession'
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
  parseEnsembleJson,
  renameEnsemble,
  type EnsembleEntry,
} from '../lib/ensembleStorage'
import { DEFAULT_PACE_SCALE } from '../lib/globalPace'
import { ConfirmModal } from './ConfirmModal'
import { EnsembleMenu } from './EnsembleMenu'
import { ImportReelModal, type ImportReelResult } from './ImportReelModal'
import './StartupScreen.css'

type StartupScreenProps = {
  onOpen: (ensembleId: string) => void
}

export function StartupScreen({ onOpen }: StartupScreenProps) {
  const [entries, setEntries] = useState(() => listEnsembles().entries)
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(() => listEnsembles().lastOpenedId)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EnsembleEntry | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const menuId = useId()
  const templatesRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  function refreshList() {
    const { entries: nextEntries, lastOpenedId: nextLastOpened } = listEnsembles()
    setEntries(nextEntries)
    setLastOpenedId(nextLastOpened)
  }

  // Opening an ensemble doubles as the user gesture that unlocks audio
  // playback, so the audio context must be resumed here before navigating.
  async function openEnsemble(entryId: string) {
    if (busyId) {
      return
    }
    setBusyId(entryId)
    setOpenError(null)
    try {
      await ensureAudioStarted()
      onOpen(entryId)
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : 'Could not start audio')
      setBusyId(null)
    }
  }

  useDismissable(templatesOpen, () => setTemplatesOpen(false), templatesRef)

  function handleCreateBlank() {
    const currentEntries = listEnsembles().entries
    const entry = createEnsemble({
      name: nextDefaultEnsembleName(currentEntries),
      loops: [],
      paceScale: DEFAULT_PACE_SCALE,
    })
    refreshList()
    void openEnsemble(entry.id)
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
    void openEnsemble(entry.id)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return
    }

    deleteEnsemble(deleteTarget.id)
    setDeleteTarget(null)
    refreshList()
  }

  function handleImportEnsemble(raw: string): ImportReelResult {
    const parsed = parseEnsembleJson(raw)
    if (!parsed) {
      return { ok: false, message: 'Could not parse ensemble JSON.' }
    }

    const currentEntries = listEnsembles().entries
    const name = parsed.name
      ? nextAvailableEnsembleName(parsed.name, currentEntries)
      : nextDefaultEnsembleName(currentEntries)
    const entry = createEnsemble({
      name,
      loops: parsed.loops,
      paceScale: parsed.paceScale,
    })
    refreshList()
    void openEnsemble(entry.id)
    return { ok: true, count: parsed.loops.length }
  }

  function startRename(entry: EnsembleEntry) {
    setRenamingId(entry.id)
    setRenameDraft(entry.name)
  }

  function commitRename(entryId: string) {
    const next = renameDraft.trim()
    if (next) {
      renameEnsemble(entryId, next)
      refreshList()
    }
    setRenamingId(null)
    setRenameDraft('')
  }

  function cancelRename() {
    setRenamingId(null)
    setRenameDraft('')
  }

  useEffect(() => {
    if (!renamingId) {
      return
    }
    renameInputRef.current?.focus()
    renameInputRef.current?.select()
  }, [renamingId])

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
              const recentlyOpened = lastOpenedId === entry.id
              const busy = busyId === entry.id
              return (
                <li
                  key={entry.id}
                  className={`startup-ensembles__item${
                    recentlyOpened ? ' is-recent' : ''
                  }${busy ? ' is-busy' : ''}`}
                >
                  {renamingId === entry.id ? (
                    <div className="startup-ensembles__select startup-ensembles__select--renaming">
                      <input
                        ref={renameInputRef}
                        className="startup-ensembles__rename-input"
                        value={renameDraft}
                        aria-label="Ensemble name"
                        onChange={(event) => setRenameDraft(event.target.value)}
                        onBlur={() => commitRename(entry.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            commitRename(entry.id)
                          } else if (event.key === 'Escape') {
                            event.preventDefault()
                            cancelRename()
                          }
                        }}
                      />
                      <span className="startup-ensembles__meta">
                        {`${entry.reelCount} ${
                          entry.reelCount === 1 ? 'reel' : 'reels'
                        }`}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="startup-ensembles__select"
                      aria-label={`Open ${entry.name}`}
                      disabled={busyId != null}
                      onClick={() => void openEnsemble(entry.id)}
                    >
                      <span className="startup-ensembles__name">{entry.name}</span>
                      <span className="startup-ensembles__meta">
                        {busy
                          ? 'opening…'
                          : `${entry.reelCount} ${
                              entry.reelCount === 1 ? 'reel' : 'reels'
                            }`}
                      </span>
                      <span className="startup-ensembles__open" aria-hidden>
                        ›
                      </span>
                    </button>
                  )}
                  <EnsembleMenu
                    ensembleId={entry.id}
                    label={entry.name}
                    disabled={busyId != null || renamingId === entry.id}
                    onRename={() => startRename(entry)}
                    onDelete={() => setDeleteTarget(entry)}
                  />
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
            disabled={busyId != null}
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
              disabled={busyId != null}
              onClick={() => setTemplatesOpen((open) => !open)}
            >
              presets
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
                {ENSEMBLE_TEMPLATES.length > 0 ? (
                  <div className="startup-templates__divider" role="separator" />
                ) : null}
                <button
                  type="button"
                  className="startup-templates__item"
                  role="menuitem"
                  onClick={() => {
                    setTemplatesOpen(false)
                    setImportOpen(true)
                  }}
                >
                  import JSON
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {openError ? (
        <p className="startup-screen__error" role="alert">
          {openError}
        </p>
      ) : null}

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

      <ImportReelModal
        open={importOpen}
        title="import ensemble"
        description="Paste JSON from export JSON — name, pace, and reels."
        textareaLabel="ensemble JSON"
        onImport={handleImportEnsemble}
        onClose={() => setImportOpen(false)}
      />
    </div>
  )
}
