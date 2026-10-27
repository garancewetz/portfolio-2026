import './gear.css'

// La roue crantée, dans la ligne du carnet (après le numéro de page) : elle ouvre un petit panneau de réglages
// propre à la page. Chaque ligne du panneau : un nom, un réglage (une réglette, des pastilles de couleur, ou des
// boutons à choisir), et sa valeur. Une page la colore avec --panel-bg et --panel-accent (voir gear.css).

// (wide : le réglage prend aussi la place de la valeur — des boutons qui disent déjà ce qu'ils sont)
export type Row = { label: string; control: HTMLElement; value?: HTMLElement; wide?: boolean }

// la roue et son panneau, ajoutés dans slot (la ligne du carnet, voir carnet.ts) ; keep : le panneau reste ouvert
// quand on clique ailleurs (pour essayer les réglages en jouant ; il se ferme avec la roue, ou Échap)
export function gear(slot: HTMLElement, name: string, rows: Row[], { keep = false } = {}) {
  const button = document.createElement('button')
  button.className = 'carnet-gear'
  button.type = 'button'
  // (︎ : la roue en caractère, pas en émoji)
  button.textContent = '⚙︎'
  button.setAttribute('aria-label', name)
  button.setAttribute('aria-expanded', 'false')

  const panel = document.createElement('div')
  panel.className = 'carnet-panel'
  panel.hidden = true
  for (const { label, control, value, wide } of rows) {
    // (une ligne de boutons n'est pas une étiquette : un clic sur son nom choisirait le premier bouton)
    const row = document.createElement(wide ? 'div' : 'label')
    const title = document.createElement('span')
    title.textContent = label
    if (wide) control.classList.add('carnet-wide')
    row.append(title, control, ...(wide ? [] : [value ?? document.createElement('span')]))
    panel.append(row)
  }

  const toggle = (open: boolean) => {
    panel.hidden = !open
    button.setAttribute('aria-expanded', String(open))
  }
  button.addEventListener('click', () => toggle(!!panel.hidden))
  // un clic en dehors du panneau le referme (et ne sert qu'à ça : la page ne le reçoit pas, les oiseaux ne
  // s'envolent pas) ; Échap aussi
  let closing = false
  addEventListener(
    'pointerdown',
    (e) => {
      closing = false
      if (keep || panel.hidden || slot.contains(e.target as Node)) return
      toggle(false)
      closing = true
      e.stopPropagation()
    },
    true,
  )
  for (const type of ['pointerup', 'click'])
    addEventListener(
      type,
      (e) => {
        if (!closing) return
        if (type === 'click') closing = false
        e.stopPropagation()
      },
      true,
    )
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) toggle(false)
  })
  slot.append(button, panel)
}

// une réglette : de min à max, et sa valeur affichée (show) ; onInput à chaque changement
export function slider(
  label: string,
  o: { min: number; max: number; step: number; value: number; show: (n: number) => string },
  onInput: (n: number) => void,
): Row {
  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(o.min)
  input.max = String(o.max)
  input.step = String(o.step)
  input.value = String(o.value)
  const value = document.createElement('output')
  value.textContent = o.show(o.value)
  input.addEventListener('input', () => {
    const n = Number(input.value)
    value.textContent = o.show(n)
    onInput(n)
  })
  return { label, control: input, value }
}

// des pastilles de couleur : chacune son nom (pour les lecteurs d'écran, et affiché à côté) et sa couleur
export function swatches(
  label: string,
  colours: { name: string; css: string }[],
  current: number,
  onPick: (k: number) => void,
): Row {
  const box = document.createElement('span')
  box.className = 'carnet-swatches'
  const value = document.createElement('output')
  value.textContent = colours[current].name
  const buttons = colours.map(({ name, css }, k) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.style.background = css
    b.setAttribute('aria-label', name)
    b.setAttribute('aria-pressed', String(k === current))
    b.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === b))
      value.textContent = name
      onPick(k)
    })
    return b
  })
  box.append(...buttons)
  return { label, control: box, value }
}


// des boutons, un par choix, côte à côte : celui qui est choisi est marqué
export function choices<T extends string>(label: string, names: readonly T[], current: T, onPick: (v: T) => void): Row {
  const box = document.createElement('span')
  box.className = 'carnet-choices'
  box.setAttribute('role', 'group')
  box.setAttribute('aria-label', label)
  const buttons = names.map((name) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = name
    b.setAttribute('aria-pressed', String(name === current))
    b.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === b))
      onPick(name)
    })
    return b
  })
  box.append(...buttons)
  return { label, control: box, wide: true }
}
