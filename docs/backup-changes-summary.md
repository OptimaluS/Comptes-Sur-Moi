# Résumé des modifications apportées aux sauvegardes

## Gestion dans le processus principal Electron
- Les sauvegardes utilisent désormais un dossier par défaut dans `Documents/ComptesSurMoi_Backups` et créent le dossier au besoin.
- Le choix d'un dossier personnalisé ouvre un sélecteur de répertoires et mémorise le chemin sélectionné.
- La création de sauvegarde (`save-backup`) prend un type (`auto` ou `manuel`) pour nommer les fichiers `backup-<type>-JJ-MM-AAAA-HH-mm-ss.json`, ce qui évite toute collision.
- Les fichiers sont toujours écrits dans le dossier personnalisé sélectionné ou, à défaut, dans le dossier par défaut.
- Des gestionnaires supplémentaires lister, restaurer, exporter et importer les sauvegardes sont conservés.

## Intégration côté renderer (React)
- Le bouton de sauvegarde manuelle (`Sauvegarder maintenant`) déclenche uniquement `window.api.saveBackup(..., 'manuel')` après la sauvegarde des données locales.
- La sauvegarde automatique conserve son intervalle de cinq minutes, appelle `window.api.saveBackup(..., 'auto')` et ajoute une notification dans l'application.
- L'interface des paramètres permet de choisir l'emplacement des sauvegardes, d'actualiser la liste des backups et de distinguer visuellement les sauvegardes automatiques des manuelles.

Ces ajustements garantissent qu'un clic sur la sauvegarde manuelle génère un unique fichier `backup-manuel-...json` et que les sauvegardes automatiques continuent d'être créées indépendamment sans écraser les fichiers existants.
