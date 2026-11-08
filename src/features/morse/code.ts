// Le morse international (celui de l'UIT) : les lettres, les chiffres, la ponctuation courante. Un point « . », un
// trait « - ».
const MORSE: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
}

// les lettres qui s'écrivent à deux (œ, æ ; ß, lui, devient SS tout seul en majuscule), et les signes de la
// typographie française qui ont un cousin en morse (l'apostrophe courbe, les guillemets, les tirets…)
const SPELLED: Record<string, string> = {
  Œ: 'OE',
  Æ: 'AE',
  '’': "'",
  '‘': "'",
  '«': '"',
  '»': '"',
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
}

// un signe de la phrase : ce qu'on a tapé (shown), les lettres du morse qui le disent (é : E ; œ : O, E), et leurs
// codes (null : pas de morse pour lui)
export type Sign = { shown: string; letters: string; codes: string[] | null }

// la phrase, en mots, chaque mot en signes. Les accents sont ramenés à la lettre (é, è, ê : E ; ç : C)
export function spell(text: string): Sign[][] {
  return text
    .normalize('NFC')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word].map((shown) => {
        const up = shown.toUpperCase()
        const letters = SPELLED[up] ?? up.normalize('NFD').replace(/\p{M}/gu, '')
        const codes = [...letters].map((l) => MORSE[l])
        return { shown, letters, codes: letters && codes.every(Boolean) ? codes : null }
      }),
    )
}

// la phrase en morse, en texte : les lettres séparées d'une espace, les mots d'une barre (sans ce qui n'a pas de morse)
export function written(words: Sign[][]) {
  return words
    .map((word) => word.flatMap((s) => s.codes ?? []).join(' '))
    .filter(Boolean)
    .join(' / ')
}

// ——— le temps du morse, en unités : un point dure 1, un trait 3 ; entre deux marques d'une lettre, 1 ; entre deux
// lettres, 3 ; entre deux mots, 7 ———

// une marque (un point, un trait) : quand elle commence, combien elle dure, le signe de la phrase (son rang, tous
// mots confondus) et son rang dans le signe
export type Mark = { at: number; length: number; sign: number; mark: number }

export function timeline(words: Sign[][]) {
  const marks: Mark[] = []
  let t = 0
  let sign = 0
  for (const word of words) {
    // (après la dernière lettre du mot d'avant, 3 unités déjà comptées : encore 4, pour 7)
    if (marks.length) t += 4
    for (const { codes } of word) {
      let mark = 0
      for (const [c, code] of (codes ?? []).entries()) {
        // (œ : O puis E, deux lettres)
        if (c) t += 2
        for (const s of code) {
          const length = s === '.' ? 1 : 3
          marks.push({ at: t, length, sign, mark: mark++ })
          t += length + 1
        }
      }
      if (codes) t += 2
      sign++
    }
  }
  return { marks, units: t }
}
