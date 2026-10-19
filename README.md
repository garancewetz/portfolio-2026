# Portfolio — Garance Wetzel

Portfolio de projets personnels, en React + Vite.

Les projets montent un par un et se rangent en haut de l'écran (`position: sticky`), sur un fond de guides de grille CSS. Au survol, une carte grossit et montre ce qu'est le projet. À la fin : la rangée complète, « Ici, les projets qui ont survécu. », le parcours et le contact.

Easter egg : le repère « gap » de la grille est un bouton ; il fait monter un bandeau des projets abandonnés.

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
  shots/           captures des projets (16/10)
  favicon.svg
```

## Modifier le contenu (`src/data.js`)

- **Projet en ligne** : `demo` (lien du site) ; sinon la carte mène à `code` (GitHub) et affiche « pas en ligne ».
- **Projet bientôt en ligne** : `wip: true` (affiche « en cours · bientôt en ligne »).
- **Projets abandonnés** (easter egg) : `abandoned`, une phrase très courte qui dit le fond du projet.

## À savoir

- Garder `overflow: clip` (et non `hidden`) sur `.rg` : `hidden` casse le sticky.
- Pendant le scroll, le script n'écrit que ce qui change (une variable réécrite sur toute la page à chaque image fait saccader).
- Les captures de Trans-trame, Mosaïque (fiche Chrome Web Store) et Synapso montrent des données de démo.
