// The light of the hour it is in Paris: the home backdrop is not the same at 3 pm and at midnight. Four moods, all
// in blue: pale dawn, day (the usual blue), indigo dusk, starry night. ?hour=22 to try an hour.
// Loaded in <head>: the arrival poster (see index.html) follows the mood.
const PARIS_HOUR = (() => {
  const q = new URLSearchParams(location.search).get('hour')
  if (q !== null && q !== '' && !isNaN(+q)) return +q % 24
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date())
  const v = (t) => +parts.find((x) => x.type === t).value
  return v('hour') + v('minute') / 60
})()
const MOODS = {
  dawn: { tint: '#2b46ea', sky: '#c3c8ff', sun: .14, stars: 0 },
  day: { tint: '#1414e6', sky: '#9a9aff', sun: .75, stars: 0 },
  dusk: { tint: '#2a1690', sky: '#6a4fd6', sun: .1, stars: .25 },
  night: { tint: '#151a92', sky: '#3c48cc', sun: .3, stars: .7 },
}
const MOOD = PARIS_HOUR < 6 ? 'night' : PARIS_HOUR < 8 ? 'dawn' : PARIS_HOUR < 18 ? 'day' : PARIS_HOUR < 21.5 ? 'dusk' : 'night'
// a backdrop's settings, in the light of the hour
const atThisHour = (settings) => Object.fromEntries(Object.entries(settings).map(([k, r]) => [k, { ...r, ...MOODS[MOOD] }]))
