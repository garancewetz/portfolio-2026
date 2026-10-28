# Portfolio — Garance Wetzel

Portfolio de projets personnels, en React + Vite + TypeScript (strict).

À l'arrivée, les 5 projets sont déjà là, en escalier (chacun un peu plus bas que le précédent) ; ils montent un par un et se rangent en haut de l'écran (`position: sticky`) sur une ligne, une colonne par projet, sur un fond de guides de grille CSS. Ensuite vient la signature : le nom, en très grand, se range dessous (« Garance » en linéale, puis « Wetzel » en italique). Le nom n'est pas écrit en haut de la page (seulement le métier) : la signature, à la fin, est la révélation ; sur mobile, elle vient après la liste des projets. Au survol, la carte ne change pas de taille : l'effet three.js ondule l'image quand la souris bouge. Un clic sur la carte ouvre la fiche du projet (plein écran, sur la même grille), avec les liens vers le site et le code ; on y passe d'un projet à l'autre (← →), et chaque fiche a son adresse (`#synapso`…) : le retour du navigateur la ferme. À la fin, la page continue juste ce qu'il faut : la grille remonte si besoin, et le pied de page (parcours et contact) arrive dessous.

Deux effets cachés dans la signature, au survol : les « a » de Garance deviennent creux, le W de Wetzel ondule.

Easter egg : le repère « gap » de la grille est un bouton. Un clic mélange le nom en anagrammes ; le pied de page a un mode feu d'artifice.

Dans le pied de page, « labo → » mène au **labo**, mes expériences : un carnet ouvert (`/labo`) dont on tourne les pages (Murmuration, Fourrure, Toupies, Feu d'artifice, Abyme), chacune sa propre page HTML (voir `vite.config.ts`).


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

Organisé par fonctionnalité (feature first) : chaque fonctionnalité a son dossier, avec son composant et son CSS.
`app/` assemble la page (avec ses morceaux de mise en page) et décide du déroulé ; les features ne dépendent pas
de `app/` (elles reçoivent ce dont elles ont besoin en props). Ce qui sert à plusieurs parties est dans `shared/`.
Les imports passent par l'alias `@/` (= `src/`).

```
src/
  main.tsx                     point d'entrée
  app/
    App.tsx                    la page : assemble les parties
    App.css                    mise en page (variables, intitulé, champ, fin de page, mobile)
    timeline.ts                le déroulé : hauteurs de départ des cartes et du nom
    useStickyLayout.ts         au défilement : cartes rangées, étape, intitulé, « scroll ↓ »
    layout/PageGuides          la grille en fond (colonnes, row 1)
    layout/ScrollHint          « scroll ↓ »
    layout/Footer              parcours et liens
  features/
    projects/ProjectCard       une carte projet (sticky, ouvre la fiche)
    sheet/ProjectSheet         la fiche d'un projet (précédent/suivant, Échap)
    sheet/useSheetRoute.ts     fiche ↔ adresse (#synapso), retour du navigateur
    sheet/morph.ts             transition carte ↔ fiche (View Transitions)
    signature/Signature        le nom en grand, et ses deux effets cachés
    fireworks/                 le mode feu d'artifice : Fireworks (le spectacle), show + shells (étincelles),
                               fluid + gl + shaders (halo liquide), salvos, stars
    carnet/                    le carnet d'expériences : carnet (la ligne en haut, tourner la page), sheet (la
                               feuille), sommaire + book (la page /labo, le carnet ouvert), gear (les réglages), raster + photo (ASCII)
    murmuration/               la page /murmuration : main (boucle, gestes), draw, flock, grid, perches,
                               startle, pose, village, settings
    fourrure/                  la page /fourrure : un chat dans le noir, la souris pour lumière
    toupies/                   la page /toupies (three.js) : stage, top + spin, bump, input, trace, settings…
    feu/                       la page /feu : le feu d'artifice de l'accueil, seul et sans fin, et ses réglages
    escalade/                  la page /escalade : un bonhomme en caractères qui joue avec la fenêtre : body (bords,
                               secousse), input (clavier, souris), intro, shake, tab (il dort), windows (deux fenêtres)
    abyme/                     la page /abyme : la visite remontée de fenêtre en fenêtre (path, door, drawn…)
    yaya/                      la page /yaya (cachée, sans lien)
  shared/
    Shot                       capture d'un projet (ou « capture à venir »)
    Ripple + CardFX            effet three.js au survol (chargé à la demande, souris seulement)
    Guides                     colonnes de grille (page et fiche)
    ExternalLink               lien « nouvel onglet » (↗, et le texte pour les lecteurs d'écran)
    ProjectStatus              « en cours · bientôt en ligne » / « pas en ligne »
    projectNumber.ts           0 → « 01 »
  content/content.ts           tout le contenu (textes, projets, parcours, liens)
  content/types.ts             ses types (Project, Carnet, Page, Person)
  styles/base.css              base : couleurs, typo, accessibilité, touches du clavier
  env.d.ts                     types globaux (variables CSS dans style={{ '--o': … }})
public/
  shots/                       captures des projets (16/10, WebP, 1200 px de large)
  favicon.svg
  og.jpg                       aperçu des liens partagés (1200 × 630 ; un G, comme le favicon)
scripts/og/                    la source de og.jpg, et comment la refaire
```

## Modifier le contenu (`src/content/content.ts`)

- **Un projet** : `id` (l'adresse de sa fiche, ex. `#synapso`), `title`, `short` (la phrase simple, dans la fiche et sur mobile), `image` et `alt`.
- **Projet en ligne** : `demo` (lien du site, dans la fiche) ; sinon la carte affiche « pas en ligne » et la fiche ne propose que `code` (GitHub).
- **Projet bientôt en ligne** : `wip: true` (affiche « en cours · bientôt en ligne »).
- **Le carnet** : `carnet.pages`, une page chacune (nom, adresse, capture, description) ; l'ordre où on les tourne est dans `features/carnet/carnet.ts` (`PAGES`).
- **Parcours** : `experience`, du poste actuel au plus ancien.

## Ajouter une capture

Capture au format 16/10, puis conversion en WebP (1200 px de large) :

```bash
cwebp -q 82 -resize 1200 0 capture.png -o public/shots/nom.webp
```

## À savoir

- Garder `overflow: clip` (et non `hidden`) sur `.rg` : `hidden` casse le sticky.
- Les cartes ont une marge basse invisible (la place du nom) et la 1re ligne du nom aussi (une ligne) : à la fin, cartes et nom se décollent en même temps et la grille remonte d'un bloc. Chaque mot du nom a sa propre colonne, sur toute la hauteur du champ (sinon le sticky ne tient pas).
- Pendant le scroll, le script n'écrit que ce qui change (une variable réécrite sur toute la page à chaque image fait saccader).
- Les captures de Trans-trame, Mosaïque (fiche Chrome Web Store) et Synapso montrent des données de démo.

## Mise en ligne

Sur Netlify : « Add new site » → « Import from GitHub » → `portfolio-2026`. Les réglages (build, Node 22, cache) sont dans `netlify.toml`.
