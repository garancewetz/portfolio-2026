# L'image d'aperçu des liens partagés

`og.html` est la source de `public/og.jpg` (1200 × 630). Slack, iMessage et WhatsApp n'en montrent souvent qu'un
carré, au centre : le g doit y tenir en entier (le carré va de x 285 à x 915).

Pour la refaire, depuis `portfolio/` (Chrome sans fenêtre, puis conversion en JPEG) :

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --hide-scrollbars --window-size=1200,630 --virtual-time-budget=4000 --screenshot=og.png "file://$PWD/scripts/og/og.html"
sips -s format jpeg -s formatOptions 88 og.png --out public/og.jpg && rm og.png
```

Les réseaux gardent l'ancienne image en cache : pour LinkedIn, la repasser dans le Post Inspector
(https://www.linkedin.com/post-inspector/).
