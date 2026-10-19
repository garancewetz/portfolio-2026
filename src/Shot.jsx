// Capture d'un projet (ou un encart « capture à venir » s'il n'y en a pas encore)
export default function Shot({ project }) {
  if (!project.image) {
    return (
      <div className="shot shot-empty" role="img" aria-label={`Capture de ${project.title} à venir`}>
        <span>{project.title}</span>
        <small>capture à venir</small>
      </div>
    )
  }
  return (
    <div className="shot">
      {/* dimensions indicatives (format 16/10) : la place est réservée avant le chargement */}
      <img src={project.image} alt={project.alt} width="1200" height="750" loading="lazy" decoding="async" />
    </div>
  )
}
