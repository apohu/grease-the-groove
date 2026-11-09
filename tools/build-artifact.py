"""Assemble la version artefact claude.ai (un seul fichier HTML) à partir de styles.css et app.js.

Usage : python3 tools/build-artifact.py  ->  dist/artifact.html
Différences avec la version hébergée : polices IBM Plex chargées depuis Google Fonts,
pas de service worker ni de manifeste, données dans la base de l'artefact (gérée par app.js).
"""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
css = (root / 'styles.css').read_text(encoding='utf-8')
js = (root / 'app.js').read_text(encoding='utf-8')

# Polices : on retire les @font-face locales et on pointe vers les familles Google Fonts.
css = re.sub(r'@font-face \{[^}]*\}\n', '', css)
css = css.replace('--sans: "Plex Sans",', '--sans: "IBM Plex Sans",').replace('--mono: "Plex Mono",', '--mono: "IBM Plex Mono",')
assert '</style' not in css and '</script' not in js

html = f'''<title>Grease the Groove</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
{css}</style>
<header class="topbar"><h1 id="view-title">Exercices</h1></header>
<main id="view" aria-live="polite"></main>
<nav class="tabbar" aria-label="Navigation">
  <button data-tab="exercices" data-icon="dumbbell" class="active"><span>Exercices</span></button>
  <button data-tab="plan" data-icon="calendar"><span>Plan</span></button>
  <button data-tab="profil" data-icon="ruler"><span>Profil</span></button>
  <button data-tab="reglages" data-icon="sliders"><span>Réglages</span></button>
</nav>
<dialog id="modal"><div id="modal-body"></div></dialog>
<script>
{js}</script>
'''
out = root / 'dist' / 'artifact.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(out, len(html), 'octets')
