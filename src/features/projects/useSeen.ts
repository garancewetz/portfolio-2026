import { useEffect, useState } from 'react'
import type { Project } from '@/content/types'

// Les projets dont on a déjà ouvert la fiche : leur nom prend un point bleu sur l'accueil (« Synapso. »), le
// même point que « hello, world. ». Gardés dans le navigateur, d'une visite à l'autre (si le stockage est
// bloqué, la page marche pareil, sans mémoire).
const KEY = 'seen'

const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

/** open : la fiche ouverte (son index), ou null */
export function useSeen(projects: Project[], open: number | null) {
  const [seen, setSeen] = useState(read)
  const id = open === null ? null : projects[open]?.id
  // (pendant le rendu, comme le flipbook de la fiche : pas de second rendu en cascade)
  if (id && !seen.includes(id)) setSeen([...seen, id])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(seen))
    } catch {
      // (stockage bloqué : le point reste le temps de la visite)
    }
  }, [seen])

  return seen
}
