import { useEffect, useId, useRef } from 'react'
import './InfoPanel.css'

export type InfoScreen = 'start' | 'ensemble'

type InfoPanelProps = {
  open: boolean
  screen: InfoScreen
  onClose: () => void
}

function StartHowTo() {
  return (
    <ul>
      <li>
        <strong>new</strong> — create an empty ensemble.
      </li>
      <li>
        <strong>presets</strong> — create a ready-made ensemble.
      </li>
      <li>
        <strong>import JSON</strong> — load a shared ensemble.
      </li>
      <li>
        Tap an ensemble under <em>your ensembles</em> to open it.
      </li>
      <li>
        <strong>⋯</strong> — rename or delete an ensemble.
      </li>
    </ul>
  )
}

function EnsembleHowTo() {
  return (
    <>
      <p>Each row is a reel — one tape loop.</p>
      <h4>playing</h4>
      <ul>
        <li>
          <strong>play all</strong> / <strong>stop all</strong> — start/stop
          every reel (or press space).
        </li>
        <li>
          <strong>▶ / ◼</strong> — start/stop one reel.
        </li>
        <li>
          <strong>speaker</strong> — preview a reel once.
        </li>
      </ul>
      <h4>building a reel</h4>
      <ul>
        <li>
          <strong>+</strong> — add a blank reel.
        </li>
        <li>
          <strong>presets</strong> — add a ready-made reel.
        </li>
        <li>
          <strong>✎ pencil</strong> — open the reel editor:
          <ul>
            <li>
              <strong>grid</strong> — tap a cell to place a note; drag its edge
              to lengthen.
            </li>
            <li>
              <strong>timing</strong> — <em>tape</em> sets loop length;{' '}
              <em>fill</em> sets melody coverage.
            </li>
            <li>
              <strong>key</strong> — set root, scale, octave.
            </li>
            <li>
              <strong>voice</strong> — pick an instrument; <em>edit</em> for
              filter, envelope, fx.
            </li>
          </ul>
        </li>
        <li>Tap a reel&rsquo;s label to rename it.</li>
        <li>
          <strong>⋯</strong> — duplicate or delete a reel.
        </li>
      </ul>
      <h4>ensemble</h4>
      <ul>
        <li>
          <strong>pace</strong> — change the speed of all reels.
        </li>
        <li>
          <strong>root</strong> / <strong>scale</strong> — retune all reels.
        </li>
        <li>
          <strong>t</strong> — toggle stack and timeline views.
        </li>
      </ul>
    </>
  )
}

export function InfoPanel({ open, screen, onClose }: InfoPanelProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <aside
      className="info-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="info-panel__header">
        <h2 id={titleId} className="info-panel__title">
          ambient 101
        </h2>
        <button
          ref={closeRef}
          type="button"
          className="info-panel__close"
          aria-label="Close info"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="info-panel__body">
          <section className="info-panel__section info-panel__section--about">
            <h3 className="info-panel__section-title">about</h3>
            <div className="info-panel__prose">
              <p>
                This is an interactive web app, available to the public at{' '}
                <a
                  href="https://ambient101.willem.info"
                  target="_blank"
                  rel="noreferrer"
                >
                  ambient101.willem.info
                </a>
                .
              </p>
              <p>
                It was created for a session at ITP Camp 2026, where attendees
                used the app to generate a collaborative work of ambient music.
              </p>
              <p>
                The app is inspired by Brian Eno&rsquo;s 1979 album{' '}
                <em>Ambient 1: Music for Airports</em>, considered one of the
                defining works of the ambient genre.
              </p>
              <p>
                Eno composed the album using multiple tape loops: recordings on
                magnetic tape joined end to end so they play in an infinite loop.
                He used loops of different lengths, causing them to fall in and
                out of sync with each other.
              </p>
              <p>
                This app replicates that concept and lets you compose your own
                loops with a variety of instruments.
              </p>
              <figure className="info-panel__author">
                <img
                  className="info-panel__photo"
                  src="/me.jpg"
                  alt="Willem Yarbrough"
                  onError={(event) => {
                    event.currentTarget.parentElement?.classList.add(
                      'info-panel__author--no-photo',
                    )
                  }}
                />
                <figcaption className="info-panel__author-caption">
                  Created by Willem Yarbrough.
                  <br />
                  If you see me, say hello!
                </figcaption>
              </figure>
            </div>
          </section>

          <section className="info-panel__section info-panel__section--howto">
            <h3 className="info-panel__section-title">how to</h3>
            <div className="info-panel__prose">
              {screen === 'start' ? <StartHowTo /> : <EnsembleHowTo />}
            </div>
        </section>
      </div>
    </aside>
  )
}
