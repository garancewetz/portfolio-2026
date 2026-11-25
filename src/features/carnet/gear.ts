import './gear.css'

// The cog wheel, in the notebook line (after the page number): it opens a small settings panel specific to
// the page. Each row of the panel: a name, a control (a slider, colour dots, or buttons to choose from), and
// its value. A page colours it with --panel-bg and --panel-accent (see gear.css).

// (wide: the control also takes the value's place — buttons that already say what they are)
export type Row = { label: string; control: HTMLElement; value?: HTMLElement; wide?: boolean }

// the wheel and its panel, added into slot (the notebook line, see carnet.ts); keep: the panel stays open
// when clicking elsewhere (to try the settings while playing; it closes with the wheel, or Escape)
export function gear(slot: HTMLElement, name: string, rows: Row[], { keep = false } = {}) {
  const button = document.createElement('button')
  button.className = 'carnet-gear'
  button.type = 'button'
  // (︎: the wheel as a text character, not an emoji)
  button.textContent = '⚙︎'
  button.setAttribute('aria-label', name)
  button.setAttribute('aria-expanded', 'false')

  const panel = document.createElement('div')
  panel.className = 'carnet-panel'
  panel.hidden = true
  for (const { label, control, value, wide } of rows) {
    // (a row of buttons is not a label: a click on its name would pick the first button)
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
  // a click outside the panel closes it (and does only that: the page does not get it, the birds do not fly
  // off); Escape too
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

// a slider: from min to max, and its displayed value (show); onInput on every change
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

// colour dots: each with its name (for screen readers, and shown beside it) and its colour
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


// buttons, one per choice, side by side: the chosen one is marked
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
