// The light of the hour it is in Paris: the home backdrop is not the same at 3 pm and at midnight. Four moods, all in
// blue: pale dawn, day (the usual blue), indigo dusk, starry night. ?hour=22 to try an hour.
// The mood itself is picked in <head> (index.html), before anything shows, for the arrival poster: it is read here
// from <html data-mood>.

export type Mood = 'dawn' | 'day' | 'dusk' | 'night'
export const MOODS: Record<Mood, { tint: string; sky: string; sun: number; stars: number }> = {
  dawn: { tint: '#2b46ea', sky: '#c3c8ff', sun: 0.14, stars: 0 },
  day: { tint: '#1414e6', sky: '#9a9aff', sun: 0.75, stars: 0 },
  dusk: { tint: '#2a1690', sky: '#6a4fd6', sun: 0.1, stars: 0.25 },
  night: { tint: '#151a92', sky: '#3c48cc', sun: 0.3, stars: 0.7 },
}
const picked = document.documentElement.dataset.mood
export const MOOD: Mood = picked && picked in MOODS ? (picked as Mood) : 'day'

// a set of backdrop settings, in the light of the hour
export const atThisHour = <T extends object>(settings: Record<string, T>) =>
  Object.fromEntries(Object.entries(settings).map(([k, s]) => [k, { ...s, ...MOODS[MOOD] }])) as Record<string, T>
