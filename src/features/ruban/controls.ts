// The button, at the bottom in the middle, once you sing: save the drawing as an image (greyed out while there
// is nothing).

export function controls(main: HTMLElement, o: { save: () => void }) {
  const bar = document.createElement('div')
  bar.className = 'ru-controls'
  bar.innerHTML = `<button type="button" class="ru-link" data-do="save">enregistrer l’image</button>`
  main.append(bar)
  // (presses on this button do not draw)
  bar.addEventListener('pointerdown', (e) => e.stopPropagation())
  const save = bar.querySelector<HTMLButtonElement>('[data-do=save]')!
  save.addEventListener('click', o.save)

  return {
    set(empty: boolean) {
      save.disabled = empty
    },
  }
}
