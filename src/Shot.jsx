// Capture d'un projet (ou un encart « capture à venir » s'il n'y en a pas encore).
// (des span : la capture est aussi dans le bouton de la carte)
// eager : chargée tout de suite (dans la fiche du projet) plutôt qu'à l'approche du scroll
export default function Shot({ project, eager = false }) {
  if (!project.image) {
    return (
      <span className="shot shot-empty" role="img" aria-label={`Capture de ${project.title} à venir`}>
        <span>{project.title}</span>
        <small>capture à venir</small>
      </span>
    )
  }
  return (
    <span className="shot">
      {/* dimensions indicatives (format 16/10) : la place est réservée avant le chargement */}
      <img src={project.image} alt={project.alt} width="1200" height="750" loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </span>
  )
}
