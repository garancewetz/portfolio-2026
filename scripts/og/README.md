# L'image d'aperçu des liens partagés

`public/og.jpg` (1200 × 630) est une capture du site lui-même : l'accueil à midi (`/?hour=12`), défilé jusqu'au bout
(le Canigou sorti des nuages, « Garance Wetzel » et les badges en haut). Slack, iMessage et WhatsApp n'en montrent
souvent qu'un carré, au centre (de x 285 à x 915) : le Canigou y tient.

Pour la refaire : ouvrir `/?hour=12` dans une fenêtre de 1200 × 630 (l'outil « appareil » de l'inspecteur de Chrome),
défiler jusqu'en bas, attendre que le fond soit posé, puis « Capture screenshot » ; convertir en JPEG :

```bash
sips -s format jpeg -s formatOptions 86 capture.png --out public/og.jpg
```

Les mêmes captures, en 1200 × 750, servent au fond d'Abyme : `public/shots/accueil.webp` (l'accueil) et
`public/shots/labo.webp` (`/?labo`), converties avec `cwebp -q 82`.

Les réseaux gardent l'ancienne image en cache : pour LinkedIn, la repasser dans le Post Inspector
(https://www.linkedin.com/post-inspector/).
