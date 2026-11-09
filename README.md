# Grease the Groove

Petite appli web (PWA) de suivi de progression en callisthénie, pensée pour iPhone.

- 6 exercices (tractions, pompes, pistol squat, gainage, dips, L-sit), chacun avec ses niveaux et son critère de passage.
- Feu vert : quand les N dernières séances au niveau actuel atteignent le critère (X séries de Y rép. ou secondes), l'appli propose de passer au niveau suivant.
- Profil : taille, poids et tours (bras, poitrine, taille, hanches, cuisse, mollet) avec historique.
- Plan de la semaine généré à partir des minutes disponibles chaque jour.
- Données stockées uniquement sur l'appareil (localStorage), avec export/import JSON.

Les niveaux fournis par défaut sont génériques : ils sont à remplacer par ceux de « Mon programme de callisthénie » (Brieuc Le Dantec) depuis l'écran « Modifier les niveaux ».

## Utilisation

Aucune compilation : ce sont des fichiers statiques.

- Sur PC : ouvrir `index.html` dans un navigateur (le mode hors ligne nécessite HTTPS).
- Sur iPhone : héberger le dossier en HTTPS (GitHub Pages), l'ouvrir dans Safari, puis Partager → « Sur l'écran d'accueil ».

## Déploiement GitHub Pages

Settings → Pages → Source « Deploy from a branch » → branche `main`, dossier `/ (root)`.

Lors d'une mise à jour, changer `CACHE` dans `sw.js` pour forcer le rafraîchissement du cache.
