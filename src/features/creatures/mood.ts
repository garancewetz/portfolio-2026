// L'heure de la page : celle du visiteur. Le soir et au petit matin, les créatures vont plus lentement ; la nuit,
// elles dorment, chacune là où elle est. Chacune a son heure de coucher et de lever (à une demi-heure près) : elles
// s'endorment et se réveillent une à une.
// (« ?heure=23 » dans l'adresse : la page à cette heure-là, pour voir la nuit en plein jour)

const forced = new URLSearchParams(location.search).get('heure')

const hour = () => {
  if (forced !== null && !Number.isNaN(Number(forced))) return Number(forced)
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function clock() {
  const bed = 22 + rand(-0.5, 0.5)
  const rise = 6.5 + rand(-0.5, 0.5)
  return () => {
    const h = hour()
    const asleep = h >= bed || h < rise
    // (son allure : lente le soir et au petit matin)
    const pace = h >= 19 || h < 8.5 ? 0.6 : 1
    return { asleep, pace }
  }
}
