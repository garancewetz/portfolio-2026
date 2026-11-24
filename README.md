# Portfolio — Garance Wetzel

Portfolio de projets personnels, en Vite + TypeScript (strict) ; l'accueil en scripts simples et WebGL.

**L'accueil** (`index.html`, ses fichiers dans `public/accueil/`) : en fond, les lieux de Garance en relief, dans un
seul bleu (`relief-shader.js`, `reliefs.js`, données IGN et Copernicus). À l'arrivée, la mer de nuages ; le défilement
fait sortir le Canigou, puis les projets arrivent en badges et « Garance Wetzel » prend la place de « hello, world. ».
Au survol d'un badge, sa capture suit le curseur et le fond part vers le lieu du projet. Un clic ouvre la page du
projet en calque (`?p=id`), sans recharger le fond. La lumière suit l'heure de Paris (`time-of-day.js`) ; un dézoom
finit en boule à neige (`snow-globe.js`).

**Le labo** (`?labo`, `lab.js`) : derrière une petite énigme (`lab-gate.js`), sur Arles, une heure par expérience, le
yéti sur le o. Chaque expérience a sa propre page HTML (voir `vite.config.ts`) : Toupies, Murmuration, Créatures,
Ruban, Kit (la mascotte de Kit en 3D), Abyme ; Escalade, Feu d'artifice, Morse et Yaya existent toujours, sans lien.

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
index.html                     l'accueil : charge les scripts de public/accueil/, dans l'ordre
public/
  accueil/                     l'accueil (scripts simples, qui partagent la portée globale) :
                               data (projets), header, gl-background (le moteur WebGL), reliefs + relief-shader
                               (les lieux), place-label, snow-globe, cards (les badges), project (la page projet),
                               lab + lab-gate (le labo), time-of-day, trail (le chemin, pour Abyme) ;
                               reliefs/ (les terrains, en PNG), posters/ (l'image d'arrivée, selon l'heure)
  shots/                       captures (16/10, WebP, 1200 px de large)
  favicon.svg, .ico            le Canigou bleu
  og.jpg                       aperçu des liens partagés (1200 × 630)
src/                           les pages du labo, organisées par expérience (alias `@/` = `src/`)
  features/
    carnet/                    le carnet : la ligne en haut de chaque expérience (retour au labo, tourner la
                               page), sheet (la feuille), gear (les réglages), raster + photo (ASCII)
    murmuration/  toupies/  creatures/  ruban/  kit/  abyme/  escalade/  feu/  fireworks/  morse/  yaya/
  shared/trail.ts              le chemin de la visite (pour Abyme)
  content/content.ts           les textes du carnet et des projets (pour Abyme)
  styles/base.css              base des pages du labo
scripts/og/                    la source de og.jpg, et comment la refaire
```

## Modifier le contenu

- **Les projets de l'accueil** : dans `public/accueil/data.js` (`PROJECTS`), leur lieu dans `relief-shader.js` (`PROJECT_PLACES`).
- **Le carnet** : `carnet.pages`, une page chacune (nom, adresse, capture, description) ; l'ordre où on les tourne est dans `features/carnet/carnet.ts` (`PAGES`).
- **Parcours** : `experience`, du poste actuel au plus ancien.

## Ajouter une capture

Capture au format 16/10, puis conversion en WebP (1200 px de large) :

```bash
cwebp -q 82 -resize 1200 0 capture.png -o public/shots/nom.webp
```

## À savoir

- Après chaque changement dans `public/accueil/`, refaire le build pour le voir avec `vite preview`.
- L'ancienne adresse du labo, `/labo/`, mène à `/?labo` (voir `netlify.toml`).
- Les captures de Trans-trame, Mosaïque (fiche Chrome Web Store) et Synapso montrent des données de démo.

## Mise en ligne

Sur Netlify : « Add new site » → « Import from GitHub » → `portfolio-2026`. Les réglages (build, Node 22, cache) sont dans `netlify.toml`.
