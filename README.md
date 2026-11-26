# Portfolio — Garance Wetzel

Portfolio de projets personnels, en Vite + TypeScript (strict) et WebGL, sans framework.

**L'accueil** (`index.html`, son code dans `src/home/`) : en fond, les lieux de Garance en relief, dans un
seul bleu (`relief-shader.js`, `reliefs.js`, données IGN et Copernicus). À l'arrivée, la mer de nuages ; le défilement
fait sortir le Canigou, pendant que les projets, déjà là en escalier, montent se ranger en haut ; « Garance Wetzel » reste en petit, en haut à gauche.
Au survol d'un badge, sa capture suit le curseur, le fond part vers le lieu du projet, et sa phrase s'écrit dessous ; un clic ouvre le projet. Au toucher et au clavier, sa phrase et ses liens
s'écrivent sous les badges : pas de page détail. La lumière suit l'heure de Paris
(`time-of-day.ts`) ; un dézoom finit en boule à neige (`snow-globe.ts`).

**Le labo** (`/lab/`, `lab.ts`) : une mosaïque de petites cartes sur la
mer de nuages de l'heure. Chaque expérience a sa propre page HTML, sous `/lab/`, en anglais (voir `vite.config.ts`) : Toupies, Murmuration, Créatures,
Ruban, Mascottes (les créatures ASCII en 3D ; une mascotte libérée vole ensuite sur tout le site), Abyme ; Escalade, Feu d'artifice, Morse et Yaya existent toujours, sans lien.

## Lancer le projet

`npm install` plante sur cette machine : utiliser **bun**.

```bash
bun install
bun run dev      # http://localhost:5188 (le port 5173 est pris par une autre app)
bun run build    # vérification des types, puis build de production dans dist/
bun run typecheck
bun run lint
```

## Structure

```
index.html                     l'accueil : choisit l'humeur de l'heure (et l'affiche d'arrivée), puis charge src/home/main.ts
src/                           (alias `@/` = `src/`)
  home/                        l'accueil, en modules : main (l'ordre de mise en place), shared, data (projets),
                               header, backdrop (le fond) + gl-background (le moteur WebGL) + reliefs + relief-shader
                               (les lieux) + place-label + snow-globe + time-of-day, cards (les badges), note (la
                               phrase et les liens d'un projet), motion, lab (le labo), trail (le chemin, pour Abyme), wheel (la
                               molette, dans le sens de chacun) ; et leur CSS
  features/                    les expériences du labo, chacune sa page HTML (voir vite.config.ts) :
    carnet/                    le carnet : la ligne en haut de chaque expérience (retour au labo, tourner la
                               page), sheet (la feuille), gear (les réglages), raster + photo (ASCII)
    murmuration/  toupies/  creatures/  ruban/  kit/  mascots/  abyme/  escalade/  feu/  fireworks/  morse/  yaya/
lab/                           les pages des expériences, en anglais : ribbon, spinning-tops, creatures, mascots, murmuration,
                               abyme ; et, cachées, climbing, fireworks, morse, yaya. kit/ : la page du projet Kit
  shared/trail.ts              le chemin de la visite (pour Abyme)
  content/content.ts           les textes du carnet et des projets (pour Abyme)
  styles/base.css              base des pages du labo
public/
  accueil/                     les terrains de l'accueil (reliefs/, en PNG) et ses affiches d'arrivée (posters/)
  shots/                       captures (16/10, WebP, 1200 px de large)
  favicon.svg, .ico            le Canigou bleu
  og.jpg                       aperçu des liens partagés (1200 × 630)
scripts/og/                    la source de og.jpg, et comment la refaire
```

## Modifier le contenu

- **Les projets de l'accueil** : dans `src/home/data.ts` (`PROJECTS`), leur lieu dans `src/home/relief-shader.ts` (`PROJECT_PLACES`) ; les expériences du labo dans `src/home/lab.ts` (`TILES`, leur ordre dans la mosaïque ; leur capture et leur nom : `src/content/content.ts`).
- **Le carnet** : `carnet.pages`, une page chacune (nom, adresse, capture, description) ; l'ordre où on les tourne est dans `features/carnet/carnet.ts` (`PAGES`).
- **Parcours** : `experience`, du poste actuel au plus ancien.

## Ajouter une capture

Capture au format 16/10, puis conversion en WebP (1200 px de large) :

```bash
cwebp -q 82 -resize 1200 0 capture.png -o public/shots/nom.webp
```

## À savoir

- Le labo est à `/lab/` (la page d'accueil elle-même) ; ses anciennes adresses (`/labo/`, `/?labo`) et celles des expériences (`/ruban/`, `/toupies/`…) mènent aux nouvelles (voir `netlify.toml`).
- Les captures de Trans-trame, Mosaïque (fiche Chrome Web Store) et Synapso montrent des données de démo.

## Mise en ligne

Sur Netlify : « Add new site » → « Import from GitHub » → `portfolio-2026`. Les réglages (build, Node 22, cache) sont dans `netlify.toml`.
