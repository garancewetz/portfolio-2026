// Les colonnes de la grille en fond, comme l'inspecteur de grille du navigateur (une par projet).
// labels : « col 1 1fr » en bas de chaque colonne ; children : d'autres repères (la rangée, par ex.)
import type { ReactNode } from 'react'

interface GuidesProps {
  cols: number
  className: string
  /** « col 1 1fr » en bas de chaque colonne */
  labels?: boolean
  children?: ReactNode
}

export default function Guides({ cols, className, labels = false, children }: GuidesProps) {
  return (
    <div className={className} aria-hidden>
      {Array.from({ length: cols }, (_, c) => (
        <span key={c} className="rg-guide-col">
          {labels && (
            <span className="rg-guide-label">
              col {c + 1} <em>1fr</em>
            </span>
          )}
        </span>
      ))}
      {children}
    </div>
  )
}
