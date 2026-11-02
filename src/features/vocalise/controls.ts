// Les deux boutons, en bas au milieu, une fois qu'on chante : figer le ruban (il s'arrête de filer et de s'éteindre,
// et la voix ne dessine plus ; la barre d'espace fait pareil, et « reprendre » le relance), et l'enregistrer en image.

export function controls(main: HTMLElement, o: { freeze: () => void; save: () => void }) {
  const bar = document.createElement('div')
  bar.className = 'vo-controls'
  bar.innerHTML = `
    <button type="button" class="vo-link" data-do="freeze"></button>
    <button type="button" class="vo-link" data-do="save">enregistrer l’image</button>`
  main.append(bar)
  // (les appuis sur ces boutons ne dessinent pas)
  bar.addEventListener('pointerdown', (e) => e.stopPropagation())
  const button = (name: string) => bar.querySelector<HTMLButtonElement>(`[data-do=${name}]`)!
  button('freeze').addEventListener('click', o.freeze)
  button('save').addEventListener('click', o.save)

  return {
    set(frozen: boolean, empty: boolean) {
      button('freeze').textContent = frozen ? 'reprendre' : 'figer'
      button('save').disabled = empty
    },
  }
}
