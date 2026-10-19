# Portfolio — Garance Wetzel

Portfolio de projets personnels, en React + Vite.

Les projets montent un par un et se rangent en haut de l'écran (`position: sticky`), sur un fond de guides de grille CSS. Au survol, une carte grossit et montre ce qu'est le projet ; l'effet three.js ondule l'image quand la souris bouge. À la fin : la rangée complète, puis, en bas de l'écran, le parcours et le contact.

Easter egg : le repère « gap » de la grille est un bouton ; il fait apparaître, sous les cartes, un bandeau des projets abandonnés.

## Lancer le projet

`npm install` plante sur cette machine : utiliser **bun**.

```bash
bun install
bun run dev      # http://localhost:5188 (le port 5173 est pris par une autre app)
bun run build    # build de production dans dist/
bun run lint
```

## Structure

```
src/
  main.jsx         point d'entrée
  Portfolio.jsx    la page : cartes, guides de grille, fin de page, easter egg
  Portfolio.css    ses styles (mobile en bas du fichier)
  Shot.jsx         capture d'un projet
  CardFX.jsx       effet three.js au survol des captures (chargé à la demande, souris seulement)
  data.js          tout le contenu
  index.css        base : couleurs, typo, captures
public/
  shots/           captures des projets (16/10, WebP, 1200 px de large)
  favicon.svg
```

## Modifier le contenu (`src/data.js`)

- **Un projet** : `title`, `short` (la phrase simple affichée au survol), `color` (la pastille), `image` et `alt`.
- **Projet en ligne** : `demo` (lien du site) ; sinon la carte mène à `code` (GitHub) et affiche « pas en ligne ».
- **Projet bientôt en ligne** : `wip: true` (affiche « en cours · bientôt en ligne »).
- **Projets abandonnés** (easter egg) : `abandoned`, une phrase très courte qui dit le fond du projet.
- **Parcours** : `experience`, du poste actuel au plus ancien.

## Ajouter une capture

Capture au format 16/10, puis conversion en WebP (1200 px de large) :

```bash
cwebp -q 82 -resize 1200 0 capture.png -o public/shots/nom.webp
```

## À savoir

- Garder `overflow: clip` (et non `hidden`) sur `.rg` : `hidden` casse le sticky.
- Pendant le scroll, le script n'écrit que ce qui change (une variable réécrite sur toute la page à chaque image fait saccader).
- Les captures de Trans-trame, Mosaïque (fiche Chrome Web Store) et Synapso montrent des données de démo.

## Mise en ligne

Sur Netlify : « Add new site » → « Import from GitHub » → `portfolio-2026`. Les réglages (build, Node 22, cache) sont dans `netlify.toml`.
