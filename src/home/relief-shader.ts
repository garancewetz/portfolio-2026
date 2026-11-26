import type { Settings } from './gl-background'
import { placeWeights, RELIEFS_GLSL, type Place } from './reliefs'

// Garance's places (see reliefs.ts) in 3D, seen level with the horizon: perspective, water and its reflections
// where it exists (elsewhere, a sea of clouds), haze, a single colour. The place weights (places1, places2, moon,
// bay) turn one relief into another, where it stands.
// The whole landscape sits in a snow globe, unseen while we are inside. `pullback` (0…1, see snow-globe.ts) moves the
// camera back: we go through the glass, see the globe from outside, on its base, at night, and snow starts falling
// in it. One continuous scene: no crossfade.
// Settings: tint, sky (the two blues), places1, places2, moon, bay, light (the sun's angle), sun (its height), stars,
// gaze (the smaller, the lower the horizon: the landscape must stay below the row of cards), pullback, drift (leaving
// for an experiment: the camera drifts slowly), near (entering a place: the camera moves in, turning a little), rise
// (0: all flat; 1: the whole relief; on the home page it rises while the cards line up), center (the heart of the
// place, brought to the middle of the globe when pulling back).
const RELIEF_CAMERA = { origin: [0, .5, -3.2], focal: 1.3 } // in world units (the landscape × 2)
const FOCAL = RELIEF_CAMERA.focal.toFixed(2)
export const RELIEF_FS = `
precision highp float;
uniform vec2 res;
uniform vec3 tint, sky;
uniform float light, gaze, pullback, time, drift, near, rise, stars, sun;
uniform vec2 center;
// the world is the landscape scaled S times; the globe: large enough for the starting camera to be inside, and for
// the landscape (|x|, |z| < S) to fill it
const float S = 2.;
const vec3 GLOBE = vec3(0., .6, 0.); const float RADIUS = 3.4;
${RELIEFS_GLSL}
float haze(float t){ return 1. - exp(-t*.28/S); }
// the haze stays low, like real haze: the peaks rise out of it, sharp
float hazeAt(float t, float y){ return 1. - exp(-t*.28/S*exp(-max(y, 0.)*1.1)); }
// the sun: its angle (light) and its height (sun; low at dawn and dusk)
vec3 toSun(){ return normalize(vec3(cos(light)*.64, sun, sin(light)*.64)); }
float water(){ return WATER()*S; }
// the sea of clouds: pale billows, in the same blue, drifting slowly
vec3 cloud(vec2 xz){
  xz += vec2(.05, .02)*time;
  float n = .55*noise(xz*1.1/S) + .3*noise(xz*2.7/S + 5.) + .15*noise(xz*7./S + 9.);
  return mix(mix(sky, tint, .3), mix(sky, vec3(1.), .75), smoothstep(.25, .75, n));
}
// pulling back, whatever sticks out of the globe fades (inside, the relief goes on to the horizon)
float inGlobe(vec2 xz){ float r = mix(60., RADIUS*.93, smoothstep(0., .3, pullback)); return smoothstep(r, r - .4, length(xz - GLOBE.xz)); }
// in 3D we look south, so east is on the left: w = -(x, z). At the grid's edge, the relief sinks under the water.
float relief(vec2 xz){
  vec2 w = -(xz + center*smoothstep(.15, .6, pullback))/S;           // pulling back, the landscape slides: its heart to the globe's centre
  // flat (rise 0), the relief lies at the level around it (OUTSIDE, reliefs.ts): no square raft at the horizon
  // (pulling back, the Moon's plain goes: in the globe its crater is a disc, like the other places)
  float below = mix(OUTSIDE(), WATER() - .06, smoothstep(0., .3, pullback));
  return S*mix(below, mix(below, height(w), rise), inGrid(w)*inGlobe(xz));
}
vec3 march(vec3 o, vec3 d, vec3 bg, out float t, out bool hit){
  t = .02; float h; hit = false;
  for (int i = 0; i < 140; i++){
    vec3 p = o + d*t; h = p.y - relief(p.xz);
    if (h < .0015*t){ hit = true; break; }
    t += max(.004*S, .45*h); if (t > 8.*S || p.y > 2.*S) break;
  }
  // on the Moon (no water, no clouds to hide it), out of steps while skimming its plain far away: it is the ground,
  // not a hole onto the sky
  if (!hit && t < 8.*S && h < .03*t*moon) hit = true;
  if (!hit) return bg;
  // the slope: over two grid points up close (no stripes), finer far away (sharp ridges)
  vec3 p = o + d*t; vec2 e = vec2(S*mix(.012, .005, smoothstep(2.*S, 5.*S, t)), 0.);
  vec3 n = normalize(vec3(relief(p.xz - e.xy) - relief(p.xz + e.xy), 2.*e.x, relief(p.xz - e.yx) - relief(p.xz + e.yx)));
  float lit = clamp(dot(n, toSun()), 0., 1.);
  vec3 c = mix(tint*.3, tint*1.05 + vec3(.14), lit);                 // all in one colour
  // the light catching the summit, high above the clouds
  c += vec3(.16, .15, .24)*smoothstep(water() + .45, water() + .95, p.y)*lit;
  // the haze, lighter up high; whole at the farthest the gaze goes (no edge against the sky; sooner on the Moon,
  // whose plain goes on to the horizon, before the steps of the march run out)
  c = mix(c, bg, max(hazeAt(t, p.y), smoothstep(mix(5., 2.5, moon)*S, mix(8., 4.5, moon)*S, t)));
  // the foot of the slopes fades into the sea of clouds (not into real water), wholly at its level (no edge, no
  // islet standing out), hazed as the sea of clouds around it
  // is at that distance: far away, it melts into the sky as the sea does, never a pale strip standing out
  return mix(c, mix(cloud(p.xz), bg, haze(t)), (1. - REAL_WATER())*smoothstep(water() + .16, water(), p.y));
}
// the stars (at night): fixed in the sky, more of them higher up
float star(vec3 d){
  vec2 q = vec2(atan(d.x, d.z), d.y)*260., i = floor(q);
  vec2 f = fract(q) - .5 - (vec2(hash(i + 3.1), hash(i + 7.7)) - .5)*.6;
  return step(.972, hash(i))*smoothstep(.15, 0., length(f))*(.6 + .8*hash(i + 1.3))*smoothstep(-.02, .2, d.y);
}
// what is seen from o (the camera, or where the gaze enters the globe): the relief, and the water or the clouds
vec3 landscape(vec3 o, vec3 rd, vec3 bg, out float tp){
  float t; bool hit;
  vec3 c = march(o, rd, bg, t, hit);
  tp = hit ? t : 1e9;
  float tl = (water() - o.y) / rd.y;
  if (rd.y < 0. && tl > 0. && (!hit || tl < t)){
    vec3 p = o + rd*tl;
    tp = tl;
    vec3 surface = cloud(p.xz);                                      // the sea of clouds…
    if (REAL_WATER() > .01){                                         // …or water, with its reflections
      float fr = 40./S;
      vec2 ri = vec2(noise(p.xz*fr) - .5, noise(p.xz*fr + 3.) - .5) * .05;
      vec3 rd2 = reflect(rd, normalize(vec3(ri.x, 1., ri.y)));
      float t2; bool hit2;
      vec3 seen = march(p + vec3(0., .002, 0.), rd2, mix(sky, tint, .35), t2, hit2);
      float fresnel = .25 + .75*pow(1. - max(rd2.y, 0.), 4.);
      surface = mix(surface, mix(tint*.25, seen, fresnel), REAL_WATER());
    }
    c = mix(surface, bg, max(haze(tl), smoothstep(5.*S, 8.*S, tl)));   // as the relief: whole far away
    // pulling back, the water stops at the glass: it fades into the haze before (inside, it goes on to the horizon,
    // around the far hills too)
    float rw = sqrt(RADIUS*RADIUS - (water() - GLOBE.y)*(water() - GLOBE.y));
    c = mix(c, bg, smoothstep(rw - .8, rw, length(p.xz - GLOBE.xz))*smoothstep(0., .15, pullback));
  }
  if (tp > 1e8) c += stars*star(rd);                                 // the night sky
  return c;
}
// the snow, in real 3D: slices facing the camera, inside the globe; on each, flakes falling and swaying. Smaller far
// away, hidden by the relief (tmax), never outside the glass.
float snow(vec3 ro, vec3 rd, float tmax){
  vec3 fw = normalize(GLOBE - ro); if (length(GLOBE - ro) < .01) fw = vec3(0., 0., 1.);
  vec3 rt = normalize(cross(vec3(0., 1., 0.), fw));
  float s = 0., den = dot(rd, fw);
  if (den < .05) return 0.;
  for (int k = 0; k < 14; k++){
    float fk = float(k), off = -RADIUS + (fk + .5)*2.*RADIUS/14.;
    float t = dot(GLOBE + fw*off - ro, fw)/den;
    if (t < .4 || t > tmax) continue;
    vec3 p = ro + rd*t, l = p - GLOBE;
    if (dot(l, l) > RADIUS*RADIUS*.94) continue;
    float speed = .22 + .12*hash(vec2(fk, 3.));
    vec2 q = vec2(dot(l, rt), l.y)/.42 + vec2(fk*7.31, time*speed + fk*3.7);
    vec2 ce = floor(q); float a = hash(ce + fk*1.7), b = hash(ce + 5.3 + fk);
    vec2 f = fract(q) - .5 - (vec2(a, b) - .5)*.55 - vec2(sin(time*.9 + a*6.28)*.12, 0.);
    float r = (.06 + .1*b)*step(.4, hash(ce + 9.1 + fk));           // per cell: small and large flakes
    s += smoothstep(r, r*.25, length(f))*(.55 + .45*b)*smoothstep(.8, 3., t);   // too close: barely seen
  }
  return s;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - .5*res) / min(res.x, res.y);           // in portrait (phone), framed on the width
  vec3 ro = vec3(${RELIEF_CAMERA.origin.join(', ')}), rd = normalize(vec3(uv.x, uv.y - gaze, ${FOCAL}));
  // near: entering the place (leaving for an experiment of the lab): the camera moves towards the heart of the
  // landscape, turning a little around it (0: the page; 1: moved in)
  if (near > 0.){
    float k = near*near*(3. - 2.*near), a = k*.32, ca = cos(a), sa = sin(a);
    vec2 v = ro.xz*(1. - .35*k);
    ro.xz = vec2(ca*v.x - sa*v.y, sa*v.x + ca*v.y);
    rd.xz = vec2(ca*rd.x - sa*rd.z, sa*rd.x + ca*rd.z);
  }
  // moved in: the camera drifts very slowly (a wandering gaze, a step aside)
  if (drift > 0.){
    float a = sin(time*.06)*.07*drift, ca = cos(a), sa = sin(a);
    rd.xz = vec2(ca*rd.x - sa*rd.z, sa*rd.x + ca*rd.z);
    ro.x += sin(time*.045)*.35*drift;
  }
  float e = pullback*pullback*(3. - 2.*pullback);
  if (pullback > .001){                                              // pulling back, looking up at the globe
    ro = mix(ro, vec3(0., 2.9, -15.), e);
    // once outside, a very slow turn around the globe: it stays alive
    float a = smoothstep(.85, 1., e)*sin(time*.12)*.4, ca = cos(a), sa = sin(a);
    vec3 rel = ro - GLOBE; ro = GLOBE + vec3(ca*rel.x - sa*rel.z, rel.y, sa*rel.x + ca*rel.z);
    vec3 fw = normalize(mix(vec3(0., -gaze, ${FOCAL}), GLOBE + vec3(0., .5, 0.) - ro, e));   // aimed a little above the centre: globe and base in the middle of the screen
    vec3 rt = normalize(cross(vec3(0., 1., 0.), fw)), up = cross(fw, rt);
    rd = normalize(uv.x*rt + uv.y*up + ${FOCAL}*fw);
  }
  vec3 bg = mix(sky, tint, clamp(uv.y*1.6 + .1, 0., 1.));
  vec3 night = mix(tint*.06, tint*.22, clamp(uv.y + .6, 0., 1.));
  float falling = smoothstep(.85, 1., pullback);                     // no snow while pulling back: only once in the globe
  vec3 oc = ro - GLOBE; float b = dot(oc, rd), cc = dot(oc, oc) - RADIUS*RADIUS, hs = b*b - cc;
  float baseTop = GLOBE.y - .75*RADIUS, rs = .66*RADIUS;              // the top of the base, its radius
  vec3 c;
  float tp;
  if (cc < 0.){                                                      // inside the globe
    c = landscape(ro, rd, bg, tp);
    if (falling > 0.) c = mix(c, vec3(1.), clamp(snow(ro, rd, tp)*falling, 0., 1.)*.85);
  }
  else {
    // the table, at night: the base's shadow, the globe's glow
    float low = baseTop - .9, tt = (low - ro.y)/rd.y;
    c = night;
    if (rd.y < 0.){
      vec3 q = ro + rd*tt; float d = length(q.xz - GLOBE.xz);
      vec3 table = mix(tint*.1, tint*.04, smoothstep(0., 14., tt - 10.));
      table += sky*.1*exp(-max(d - rs, 0.)*.6);                       // the glow
      table *= .45 + .55*smoothstep(rs*.95, rs*1.9, d);                // the shadow
      c = mix(table, night, smoothstep(8., 20., d));
    }
    // a halo around the globe
    float dmin = sqrt(max(dot(oc, oc) - b*b, 0.));
    c += sky*.07*exp(-max(dmin - RADIUS, 0.)*1.3)*step(0., -b);
    // the base: a cylinder under the globe
    vec2 oz = ro.xz - GLOBE.xz;
    float a2 = dot(rd.xz, rd.xz), b2 = dot(oz, rd.xz), h2 = b2*b2 - a2*(dot(oz, oz) - rs*rs);
    float ts = 1e9;
    if (h2 > 0.){
      float tc = (-b2 - sqrt(h2))/a2; vec3 q = ro + rd*tc;
      if (q.y < baseTop && q.y > baseTop - .9){
        ts = tc;
        float side = .35 + .65*clamp(dot(normalize(vec3(q.x - GLOBE.x, 0., q.z - GLOBE.z)), normalize(vec3(-.6, 0., -1.))), 0., 1.);
        c = mix(tint*.05, tint*.35 + vec3(.05), side);
        c *= .75 + .25*smoothstep(0., .04, abs(q.y - (baseTop - .22)));  // a groove
        c += vec3(.25)*smoothstep(.06, 0., baseTop - q.y)*side;           // the top edge, catching the light
      }
    }
    // the globe, above the base: we look inside through the glass
    float tb = -b - sqrt(max(hs, 0.));
    if (hs > 0. && tb > 0. && tb < ts && ro.y + rd.y*tb > baseTop){
      vec3 o = ro + rd*tb, n = normalize(o - GLOBE);
      // below the landscape: the globe's water, and the snow settled at the bottom
      vec3 globeBottom = mix(tint*.3 + sky*.1, mix(sky, vec3(1.), .55), smoothstep(baseTop + .9, baseTop + .1, o.y));
      c = o.y < water() ? globeBottom : landscape(o, rd, bg, tp);
      if (o.y < water()) tp = 0.;
      c = mix(c, vec3(1.), clamp(snow(ro, rd, tb + tp), 0., 1.)*.85*falling);
      float fr = 1. - abs(dot(n, -rd));
      c = mix(c, night, pow(fr, 1.5)*.25);                             // the glass, darker at the edges
      c += sky*pow(fr, 6.)*.5;                                         // and a rim of light
      vec3 rf = reflect(rd, n);
      c += pow(max(dot(rf, normalize(vec3(-.5, .7, -.6))), 0.), 400.)*.7;   // the lamp's reflection
      c += pow(max(dot(rf, normalize(vec3(.7, .35, -.6))), 0.), 30.)*.08;   // a window, softer
    }
  }
  c += (hash(gl_FragCoord.xy) - .5)*.05;                             // the grain
  gl_FragColor = vec4(c, 1.);
}`

// each project leads to its place ('rest': before any card is hovered)
export const PROJECT_PLACES: Record<string, Place> = { rest: 'canigou', kit: 'canigou', synapso: 'eus', handiplan: 'bay', signe: 'moon', mosaique: 'ireland', trame: 'barcelona', 'paris-forest': 'romainville' }
// the heart of each place, in world coordinates (x, z): what comes to the centre of the snow globe
const PLACE_CENTERS: Partial<Record<Place, number[]>> = { canigou: [0, 2.8] }
// the gaze of each place: the horizon goes down for high peaks, which must stay below the row of cards
const PLACE_GAZE: Partial<Record<Place, number>> = { romainville: .02, eus: -.06, canigou: -.15, ireland: 0, barcelona: .02, bay: -.04 }
// the sun's angle, where the default one does not carve the relief enough: grazing on the Romainville scarp, facing
// the cliffs of Inis Mór
const PLACE_LIGHT: Partial<Record<Place, number>> = { romainville: -3.6, ireland: -1.0 }
// the colours and the sun are those of daytime; time-of-day.ts (home) and lab.ts (each experiment's hour) set them
const DAY = { tint: '#1414e6', sky: '#9a9aff', sun: .75, stars: 0 }
export const RELIEF_SETTINGS: Record<string, Settings> = Object.fromEntries(Object.entries(PROJECT_PLACES).map(([id, place]) => [id, {
  ...DAY, ...placeWeights(place),
  light: PLACE_LIGHT[place] ?? -2.47, gaze: PLACE_GAZE[place] ?? 0, rise: 1, center: PLACE_CENTERS[place] || [0, 0],
}]))
