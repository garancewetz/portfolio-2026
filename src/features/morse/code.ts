// International Morse code (the ITU one): letters, digits, common punctuation. A dot « . », a dash « - ».
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

// letters written as two (œ, æ; ß becomes SS on its own in upper case), and the signs of French typography
// that have a cousin in Morse (the curly apostrophe, quotation marks, dashes…)
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

// a sign of the sentence: what was typed (shown), the Morse letters that say it (é: E; œ: O, E), and their
// codes (null: no Morse for it)
export type Sign = { shown: string; letters: string; codes: string[] | null }

// the sentence, in words, each word in signs. Accents are brought back to the letter (é, è, ê: E; ç: C)
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

// the sentence in Morse, as text: letters separated by a space, words by a slash (without what has no Morse)
export function written(words: Sign[][]) {
  return words
    .map((word) => word.flatMap((s) => s.codes ?? []).join(' '))
    .filter(Boolean)
    .join(' / ')
}

// ——— Morse timing, in units: a dot lasts 1, a dash 3; between two marks of a letter, 1; between two
// letters, 3; between two words, 7 ———

// a mark (a dot, a dash): when it starts, how long it lasts, the sign of the sentence (its rank, across all
// words) and its rank within the sign
export type Mark = { at: number; length: number; sign: number; mark: number }

export function timeline(words: Sign[][]) {
  const marks: Mark[] = []
  let t = 0
  let sign = 0
  for (const word of words) {
    // (after the last letter of the previous word, 3 units already counted: 4 more, for 7)
    if (marks.length) t += 4
    for (const { codes } of word) {
      let mark = 0
      for (const [c, code] of (codes ?? []).entries()) {
        // (œ: O then E, two letters)
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
