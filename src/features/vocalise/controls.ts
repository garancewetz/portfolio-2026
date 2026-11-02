// Les trois boutons, en bas au milieu, une fois qu'on chante : figer le ruban (il s'arrête de filer et de s'éteindre,
// et la voix ne dessine plus ; la barre d'espace fait pareil), le réécouter (il se fige d'abord), et l'enregistrer en
// image. Leurs mots changent avec ce qui se passe (« reprendre », « arrêter »).

export type State = { frozen: boolean; replaying: boolean; empty: boolean }

export function controls(main: HTMLElement, o: { freeze: () => void; replay: () => void; save: () => void }) {
  const bar = document.createElement('div')
  bar.className = 'vo-controls'
  bar.innerHTML = `
    <button type="button" class="vo-link" data-do="freeze"></button>
    <button type="button" class="vo-link" data-do="replay"></button>
    <button type="button" class="vo-link" data-do="save">enregistrer l’image</button>`
  main.append(bar)
  // (les appuis sur ces boutons ne dessinent pas)
  bar.addEventListener('pointerdown', (e) => e.stopPropagation())
  const button = (name: string) => bar.querySelector<HTMLButtonElement>(`[data-do=${name}]`)!
  button('freeze').addEventListener('click', o.freeze)
  button('replay').addEventListener('click', o.replay)
  button('save').addEventListener('click', o.save)

  return {
    set({ frozen, replaying, empty }: State) {
      button('freeze').textContent = frozen ? 'reprendre' : 'figer'
      button('replay').textContent = replaying ? 'arrêter' : 'réécouter'
      button('replay').disabled = empty && !replaying
      button('save').disabled = empty
    },
  }
}
