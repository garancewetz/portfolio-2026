# Portfolio — Garance Wetzel

Portfolio de projets personnels, en React + Vite.

Les projets montent un par un et se rangent en haut de l'écran (`position: sticky`) sur une ligne, une colonne par projet, sur un fond de guides de grille CSS. Ensuite vient la signature : le nom, en très grand, se range dessous (« Garance » en linéale, puis « Wetzel » en italique). Le nom n'est pas écrit en haut de la page (seulement le métier) : la signature, à la fin, est la révélation ; sur mobile, elle vient après la liste des projets. Au survol, la carte ne change pas de taille : l'effet three.js ondule l'image quand la souris bouge. Un clic sur la carte ouvre la fiche du projet (plein écran, sur la même grille), avec les liens vers le site et le code. À la fin, la page continue juste ce qu'il faut : la grille remonte si besoin, et le pied de page (parcours et contact) arrive dessous.

Easter egg : le repère « gap » de la grille est un bouton. Un clic fait défiler les projets abandonnés, écrits comme du code en commentaire, dans l'interstice entre les cartes et le nom (rien ne bouge dans la page).


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
  ProjectSheet.jsx fiche d'un projet (ouverte au clic sur une carte)
  Shot.jsx         capture d'un projet
  CardFX.jsx       effet three.js au survol des captures (chargé à la demande, souris seulement)
  data.js          tout le contenu
  index.css        base : couleurs, typo, captures
public/
  shots/           captures des projets (16/10, WebP, 1200 px de large)
  favicon.svg
```

## Modifier le contenu (`src/data.js`)

- **Un projet** : `title`, `short` (la phrase simple, dans la fiche et sur mobile), `color` (la pastille), `image` et `alt`.
- **Projet en ligne** : `demo` (lien du site, dans la fiche) ; sinon la carte affiche « pas en ligne » et la fiche ne propose que `code` (GitHub).
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
- Les cartes ont une marge basse invisible (la place du nom) et la 1re ligne du nom aussi (une ligne) : à la fin, cartes et nom se décollent en même temps et la grille remonte d'un bloc. Chaque mot du nom, et le bandeau de l'easter egg, a sa propre colonne, sur toute la hauteur du champ (sinon le sticky ne tient pas).
- Pendant le scroll, le script n'écrit que ce qui change (une variable réécrite sur toute la page à chaque image fait saccader).
- Les captures de Trans-trame, Mosaïque (fiche Chrome Web Store) et Synapso montrent des données de démo.

## Mise en ligne

Sur Netlify : « Add new site » → « Import from GitHub » → `portfolio-2026`. Les réglages (build, Node 22, cache) sont dans `netlify.toml`.
