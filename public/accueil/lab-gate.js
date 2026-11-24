// The lab's door: the « labo → » badge does not open the lab at once, it asks for a password, with a simple riddle
// (« montagne »: the one rising out of the clouds on arrival, the Canigou; a hint after two misses: it is also the favicon).
// Once found, this browser remembers it. A wink, not a lock: the address ?labo opens the lab directly.
// The visible text is in French, like the site. Uses enterLab (lab.js), YETI (data.js), el (data.js).
const LAB_KEY = 'labo-ouvert'
const labSolved = () => { try { return localStorage.getItem(LAB_KEY) === '1' } catch { return false } }
// the answer, loosely: case, accents, spaces and « le » do not matter
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\b(le|pic|du|mont)\b/g, '').replace(/[^a-z]/g, '')
const rightAnswer = (s) => /^canig/.test(plain(s))

const gate = el(`
  <div class="lab-gate" role="dialog" aria-modal="true" aria-labelledby="lab-gate-title" hidden>
    <form class="lab-gate-box">
      <pre class="lab-gate-yeti mono" aria-hidden="true">${YETI[4]}</pre>
      <p id="lab-gate-title" class="lab-gate-title">Le labo est fermé à clé.</p>
      <p class="lab-gate-riddle">Indice : montagne.</p>
      <div class="lab-gate-row">
        <input class="badge" name="answer" autocomplete="off" spellcheck="false" aria-label="Mot de passe" />
        <button class="badge" type="submit">entrer →</button>
      </div>
      <p class="lab-gate-note mono" aria-live="polite"></p>
    </form>
  </div>`)
document.body.append(gate)
const form = gate.querySelector('form'), answer = form.querySelector('input'), note = gate.querySelector('.lab-gate-note')
let misses = 0

function openLab() {
  if (labSolved()) { enterLab(); return }
  misses = 0; note.textContent = ''; answer.value = ''
  gate.hidden = false
  requestAnimationFrame(() => { gate.classList.add('open'); answer.focus() })
}
function closeGate() {
  gate.classList.remove('open')
  setTimeout(() => { gate.hidden = true }, 300)
}
form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (rightAnswer(answer.value)) {
    try { localStorage.setItem(LAB_KEY, '1') } catch {}
    note.textContent = 'c’est ça.'
    setTimeout(() => { closeGate(); enterLab() }, 500)
    return
  }
  misses++
  note.textContent = misses < 2 ? 'non… regarde mieux le paysage.' : 'un indice : elle est aussi dans l’onglet de ton navigateur.'
  form.classList.remove('wrong'); void form.offsetWidth; form.classList.add('wrong')
  answer.select()
})
// leaving: Escape, or a click outside the box
gate.addEventListener('click', (e) => { if (e.target === gate) closeGate() })
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !gate.hidden) { e.stopImmediatePropagation(); closeGate() } }, true)
