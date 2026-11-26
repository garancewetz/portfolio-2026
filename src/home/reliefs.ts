// The reliefs of the backdrop, one per card: places that matter to Garance, with their real heights, stored as
// 16 bits in public/accueil/reliefs/*.png (red = high byte, green = low byte; 12 useful bits, to half a metre). Each grid is much
// larger than the part seen up close: the relief goes on to the horizon, where the haze takes it.
// · Romainville (IGN, 1,024 points, 16 km): from 24 m (the Seine) to 131 m; the plateau and its scarp, the radio
//   tower, the plain of Pantin and Bobigny in front, Belleville and Montmartre to the west;
// · Eus (IGN, 24 km), turned around: seen from the Têt valley, towards the hilltop village and the hills behind;
// · the Canigou (IGN, 24 km): seen from the north, above its sea of clouds, the range far away;
// · Inis Mór, Aran Islands (Copernicus DEM, 9.4 km): the Atlantic in front, the cliffs of Dún Aonghasa;
// · the Moon, the crater Copernicus (NASA, LRO's laser altimeter LOLA, 64 points a degree, 480 km): 93 km across,
//   its terraced walls and its central peaks, in the middle of the seas (Signe astronomique);
// · San Francisco Bay (AWS Terrain Tiles, 31 km), facing east: the bay in front, Berkeley and its hills behind;
// · Barcelona (AWS Terrain Tiles, 31 km), seen from the sea: Montjuïc in front, the Collserola behind.
// (IGN: RGE ALTI, Géoplateforme, downloaded on 23–24/11/2026. The Moon: LDEM_64, PDS / imbrium.mit.edu, 26/11/2026.)
// All share the same coordinates w: ±1 covers what is seen up close (5 to 11 km). The shader gets the weight of each
// place (places1: Romainville, Eus, Canigou; places2: Ireland, Barcelona; then moon, bay): one place turns into
// another where it stands, crossfading.
export const PLACES = ['romainville', 'eus', 'canigou', 'ireland', 'barcelona', 'moon', 'bay'] as const
export type Place = (typeof PLACES)[number]
// the caption of each place, bottom right (shown in French, like the site): the place, what is seen, the latitude
export const PLACE_NAMES: Record<Place, [string, string]> = {
  romainville: ['Romainville', 'le plateau, vu de Pantin · 48°53′ N'],
  eus: ['Eus', 'le village, vu de la Têt · 42°39′ N'],
  canigou: ['le Canigou', 'au-dessus des nuages · 42°31′ N'],
  ireland: ['Inis Mór', 'les falaises de Dún Aonghasa · 53°07′ N'],
  barcelona: ['Barcelone', 'Montjuïc, vu de la mer · 41°22′ N'],
  moon: ['la Lune', 'le cratère Copernic · 9°37′ N'],
  bay: ['Berkeley', 'la baie, les collines derrière · 37°52′ N'],
}
// the settings of a place: its weights, and `here` (its index)
export function placeWeights(name: Place) {
  const p = PLACES.map((l) => (l === name ? 1 : 0))
  return { places1: p.slice(0, 3), places2: p.slice(3, 5), moon: p[5], bay: p[6], here: PLACES.indexOf(name) }
}
const RELIEF_TEXTURES: Record<string, string> = Object.fromEntries(PLACES.map((p) => [`${p}T`, `/accueil/reliefs/${p}.png`]))
// the same, one place first (the place seen on arrival loads first)
export const texturesStartingWith = (place: Place) => ({ [place + 'T']: RELIEF_TEXTURES[place + 'T'], ...RELIEF_TEXTURES })
// each grid: its size (points), the frame seen up close (centre and half-width, in the grid's 0…1 coordinates), its
// heights (min, max, m), the height set at level 0, the exaggeration (w units for the whole height range), and the
// level of the water or the clouds (m)
type Grid = { size: number; frame: number[]; meters: number[]; zero: number; scale: number; water: number }
const RELIEFS: Record<Place, Grid> = {
  romainville: { size: 1024, frame: [.4814, .4833, .1623], meters: [23.9, 131], zero: 45, scale: .3, water: 62 },   // a morning fog on the plain: the plateau rises out of it
  eus: { size: 1024, frame: [.5, .5, .1666], meters: [117.9, 2129.8], zero: 234.4, scale: .898, water: 330 },
  canigou: { size: 1024, frame: [.5, .267, .1666], meters: [234.4, 2780.6], zero: 1344, scale: .97, water: 1500 }, // from 12 km north, at 2,000 m
  // Inis Mór: from the Atlantic, south-east, along the cliffs to the headland of Dún Aonghasa; ×3, the sea floor dug
  // to −15 m, the cliff edge softened (a vertical wall renders as steps)
  ireland: { size: 1024, frame: [.5, .5, .15], meters: [-15, 119.8], zero: 0, scale: .29, water: 1 },
  // the Moon (Signe astronomique): Copernicus in the middle, from its floor (−3.6 km) to the highlands around; about
  // smoothed (the laser's noise), about ×3; no water, no clouds (their level is below the lowest point)
  moon: { size: 1024, frame: [.5, .5, .2], meters: [-3566, 2050.5], zero: -1200, scale: .3, water: -4000 },
  // San Francisco Bay (Handiplan: Berkeley, birthplace of the disability rights movement; Garance's sister lives
  // there): from the bay, 2 km offshore, the town and its hills behind; ×2.5, the bay floor dug to −15 m
  bay: { size: 1024, frame: [.5, .5, .11], meters: [-15, 583.6], zero: 0, scale: .441, water: 1 },
  barcelona: { size: 1024, frame: [.5, .5, .22], meters: [0, 524.9], zero: 0, scale: .33, water: 5 },
}
const glNum = (x: number) => x.toFixed(4)
const glVec3 = (a: number[]) => `vec3(${a.map(glNum).join(', ')})`
const heightRange = (g: Grid) => g.meters[1] - g.meters[0]
// a height (m) in w units, for this place
const toW = (g: Grid, m: number) => glNum((m - g.zero) / heightRange(g) * g.scale)
// the GLSL function giving the height of a place
const heightGLSL = (name: Place, fn: string) => {
  const g = RELIEFS[name]
  return `float ${fn}(vec2 w){ return (readHeight(${name}T, toUV(w, ${glVec3(g.frame)}), ${g.size}.) - ${glNum((g.zero - g.meters[0]) / heightRange(g))})*${glNum(g.scale)}; }`
}
const edgeGLSL = (name: Place) => `edgeUV(toUV(w, ${glVec3(RELIEFS[name].frame)}))`
const waterW = (name: Place) => toW(RELIEFS[name], RELIEFS[name].water)
export const RELIEFS_GLSL = `
uniform sampler2D ${PLACES.map((p) => p + 'T').join(', ')};
uniform vec3 places1;   // Romainville, Eus, Canigou
uniform vec2 places2;   // Ireland, Barcelona
uniform float moon;     // the Moon
uniform float bay;      // San Francisco Bay
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float decode(vec4 v){ return (v.r*65280. + v.g*255.)/65535.; }
float readHeight(sampler2D t, vec2 uv, float n){                     // a height (0…1), smoothed between the points
  vec2 f = clamp(uv, 0., 1.)*n - .5, i = floor(f), r = f - i;
  float a = decode(texture2D(t, (i + vec2(.5, .5))/n)), b = decode(texture2D(t, (i + vec2(1.5, .5))/n));
  float c = decode(texture2D(t, (i + vec2(.5, 1.5))/n)), d = decode(texture2D(t, (i + vec2(1.5, 1.5))/n));
  return mix(mix(a, b, r.x), mix(c, d, r.x), r.y);
}
vec2 toUV(vec2 w, vec3 frame){ return vec2(frame.x + w.x*frame.z, frame.y - w.y*frame.z); }
float edgeUV(vec2 g){ g = min(g, 1. - g); return smoothstep(0., .1, min(g.x, g.y)); }
${heightGLSL('romainville', 'heightR')}
${heightGLSL('eus', 'heightE')}
${heightGLSL('canigou', 'heightC')}
${heightGLSL('ireland', 'heightI')}
${heightGLSL('barcelona', 'heightB')}
${heightGLSL('moon', 'heightM')}
${heightGLSL('bay', 'heightS')}
// the height in w units; only the places that count are computed
float height(vec2 w){
  float h = 0.;
  if (places1.x > .001) h += places1.x*heightR(w);
  if (places1.y > .001) h += places1.y*heightE(w);
  if (places1.z > .001) h += places1.z*heightC(w);
  if (places2.x > .001) h += places2.x*heightI(w);
  if (places2.y > .001) h += places2.y*heightB(w);
  if (moon > .001) h += moon*heightM(w);
  if (bay > .001) h += bay*heightS(w);
  return h;
}
// 1 inside the grid, 0 beyond (no heights there), fading at the edges, far on the horizon
float inGrid(vec2 w){
  return places1.x*${edgeGLSL('romainville')} + places1.y*${edgeGLSL('eus')} + places1.z*${edgeGLSL('canigou')}
    + places2.x*${edgeGLSL('ireland')} + places2.y*${edgeGLSL('barcelona')} + moon*${edgeGLSL('moon')} + bay*${edgeGLSL('bay')};
}
// the level of the plane carrying the relief. Where water exists, it is water: the Atlantic at Inis Mór, the sea at
// Barcelona, the bay at Berkeley (none on the Moon). Elsewhere, a sea of clouds lying in the hollows: at Romainville,
// below the Seine (the whole plain shows); the morning fog in the Têt valley, just below the village of Eus
// (≈ 330 m); halfway up the Canigou (≈ 1,500 m).
float WATER(){
  return dot(places1, vec3(${waterW('romainville')}, ${waterW('eus')}, ${waterW('canigou')}))
    + dot(places2, vec2(${waterW('ireland')}, ${waterW('barcelona')}))
    + moon*${waterW('moon')} + bay*${waterW('bay')};
}
// 1 where the water is real, 0 where it is a sea of clouds
float REAL_WATER(){ return places2.x + places2.y + bay; }
`
