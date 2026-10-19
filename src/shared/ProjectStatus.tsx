// Où en est un projet qui n'est pas en ligne : « en cours · bientôt en ligne » (en violet) ou « pas en ligne ».
// (className : la classe du conteneur, propre à la carte ou à la fiche)
import type { Project } from '@/content/types'

export default function ProjectStatus({ project, className }: { project: Project; className: string }) {
  if (project.demo) return null
  return (
    <span className={`${className} ${project.wip ? 'is-wip' : ''}`}>
      {project.wip ? 'en cours · bientôt en ligne' : 'pas en ligne'}
    </span>
  )
}
