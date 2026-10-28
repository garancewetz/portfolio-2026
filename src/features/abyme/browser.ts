// Le navigateur de la personne, à peu près (ce qu'une page peut en savoir) : lequel, sur quel système, en clair ou
// en sombre. Les favoris, les autres onglets et l'historique restent privés : une page n'y a pas accès.

export type Kind = 'chrome' | 'safari' | 'firefox' | 'edge' | 'brave'

export function detect() {
  const ua = navigator.userAgent
  const kind: Kind = (navigator as Navigator & { brave?: unknown }).brave
    ? 'brave'
    : /Edg\//.test(ua)
      ? 'edge'
      : /Firefox\//.test(ua)
        ? 'firefox'
        : /Chrome\//.test(ua)
          ? 'chrome'
          : /Safari\//.test(ua)
            ? 'safari'
            : 'chrome'
  const mac = /Mac|iPhone|iPad/.test(ua)
  const dark = matchMedia('(prefers-color-scheme: dark)').matches
  return { kind, mac, dark }
}

// les couleurs de chaque navigateur (la barre des onglets, la barre d'outils, le champ d'adresse, l'onglet
// ouvert, le texte), en clair et en sombre
export type Look = { strip: string; bar: string; field: string; tab: string; text: string; faint: string }
const LOOKS: Record<Kind, [Look, Look]> = {
  chrome: [
    { strip: '#dee1e6', bar: '#ffffff', field: '#f1f3f4', tab: '#ffffff', text: '#202124', faint: '#5f6368' },
    { strip: '#202124', bar: '#35363a', field: '#202124', tab: '#35363a', text: '#e8eaed', faint: '#9aa0a6' },
  ],
  brave: [
    { strip: '#e4e4e9', bar: '#ffffff', field: '#f0f0f4', tab: '#ffffff', text: '#1d1f25', faint: '#686b7a' },
    { strip: '#1d1f25', bar: '#2b2c33', field: '#1d1f25', tab: '#2b2c33', text: '#f0f0f4', faint: '#a1a3b0' },
  ],
  edge: [
    { strip: '#f3f3f3', bar: '#f7f7f7', field: '#ffffff', tab: '#f7f7f7', text: '#1b1b1b', faint: '#616161' },
    { strip: '#202020', bar: '#2b2b2b', field: '#3b3b3b', tab: '#2b2b2b', text: '#ffffff', faint: '#a0a0a0' },
  ],
  firefox: [
    { strip: '#f0f0f4', bar: '#f9f9fb', field: '#ffffff', tab: '#ffffff', text: '#15141a', faint: '#5b5b66' },
    { strip: '#1c1b22', bar: '#2b2a33', field: '#1c1b22', tab: '#42414d', text: '#fbfbfe', faint: '#a8a8b0' },
  ],
  safari: [
    { strip: '#f6f6f6', bar: '#f6f6f6', field: '#e8e8e8', tab: '#f6f6f6', text: '#1d1d1f', faint: '#6e6e73' },
    { strip: '#2a2a2c', bar: '#2a2a2c', field: '#3a3a3c', tab: '#2a2a2c', text: '#f5f5f7', faint: '#98989d' },
  ],
}
export const look = (kind: Kind, dark: boolean) => LOOKS[kind][dark ? 1 : 0]
