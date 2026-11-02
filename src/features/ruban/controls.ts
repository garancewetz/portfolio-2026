// Le bouton, en bas au milieu, une fois qu'on chante : enregistrer le dessin en image (grisé tant qu'il n'y a rien).

export function controls(main: HTMLElement, o: { save: () => void }) {
  const bar = document.createElement('div')
  bar.className = 'ru-controls'
  bar.innerHTML = `<button type="button" class="ru-link" data-do="save">enregistrer l’image</button>`
  main.append(bar)
  // (les appuis sur ce bouton ne dessinent pas)
  bar.addEventListener('pointerdown', (e) => e.stopPropagation())
  const save = bar.querySelector<HTMLButtonElement>('[data-do=save]')!
  save.addEventListener('click', o.save)

  return {
    set(empty: boolean) {
      save.disabled = empty
    },
  }
}
