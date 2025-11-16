# Guide d'import CSV/XLSX pour ElegPM

Ce dossier contient des exemples de fichiers pour importer des tâches et des jalons dans ElegPM.

## 📋 Formats supportés

- **CSV** (.csv) - Séparateur: virgule (,) ou point-virgule (;)
- **Excel** (.xlsx, .xls)

## 🎯 Import des tâches

### Colonnes requises

| Colonne | Description | Obligatoire | Exemple |
|---------|-------------|-------------|---------|
| **Projet** | Nom du projet | Non* | Mon Projet |
| **Titre** ou **Nom** | Nom de la tâche | **Oui** | Développer le backend |
| **Description** | Description détaillée | Non | Implémenter les API REST |
| **Heures estimées** | Estimation en heures | Non | 40 |
| **Date début** ou **Date de début** | Date de début | Non | 01/12/2024 |
| **Date fin** ou **Date de fin** | Date de fin | Non | 15/12/2024 |
| **Statut** | État de la tâche | Non | À faire |
| **Priorité** | Niveau de priorité | Non | Haute |
| **Assigné à** | Personne assignée | Non | Jean Dupont |
| **Tags** | Tags séparés par des virgules | Non | backend,api |

\* Si le projet n'est pas spécifié, le projet courant sera utilisé

### Valeurs acceptées pour Statut

- À faire
- En cours
- En révision
- Terminé
- Bloqué

### Valeurs acceptées pour Priorité

- Basse
- Moyenne
- Haute
- Urgente

### Format des dates

- Format accepté: `dd/MM/yyyy`
- Exemples: `15/12/2024`, `01/03/2025`

### Exemple de fichier

Voir le fichier `taches_exemple.csv` dans ce dossier.

---

## 🏁 Import des jalons

### Colonnes requises

| Colonne | Description | Obligatoire | Exemple |
|---------|-------------|-------------|---------|
| **Projet** | Nom du projet | Non* | Mon Projet |
| **Nom** | Nom du jalon | **Oui** | Livraison version Alpha |
| **Description** | Description du jalon avec critères de succès | Non | Première version fonctionnelle. Critères: API OK, UI responsive |
| **Date cible**, **Date fin** ou **Date de fin** | Date cible du jalon | **Oui** | 15/01/2025 |
| **Statut** | État du jalon | Non | En attente |
| **Couleur** | Code couleur hexadécimal pour identification visuelle | Non | #3B82F6 |

\* Si le projet n'est pas spécifié, le projet courant sera utilisé

### Valeurs acceptées pour Statut

- **En attente** (par défaut) - Le jalon n'est pas encore atteint
- **Atteint** - Le jalon a été atteint avec succès
- **Manqué** - Le jalon n'a pas été atteint dans les délais

### Format de couleur

- Format hexadécimal: `#RRGGBB`
- Couleurs suggérées:
  - `#3B82F6` - Bleu (étapes techniques)
  - `#10B981` - Vert (livraisons, mises en production)
  - `#F59E0B` - Orange (validations, reviews)
  - `#8B5CF6` - Violet (formations, documentations)
  - `#EF4444` - Rouge (jalons critiques)

### Bonnes pratiques pour les jalons

1. **Nom clair et concis** - Évitez les noms trop longs
2. **Description avec critères** - Définissez des critères de succès mesurables
3. **Dates réalistes** - Tenez compte des dépendances et contraintes
4. **Couleurs cohérentes** - Utilisez le même code couleur pour les jalons similaires
5. **Espacement régulier** - Répartissez les jalons de manière équilibrée

### Exemples de descriptions avec critères

```
"Livraison version Beta. Critères: Toutes les fonctionnalités implémentées, tests d'intégration validés, documentation API complète."

"Validation client. Critères: Démonstration réussie, feedback client collecté, ajustements identifiés."

"Mise en production. Critères: Déploiement réussi, monitoring actif, plan de rollback testé."
```

### Exemple de fichier

Voir le fichier `jalons_exemple.csv` dans ce dossier avec 6 jalons types d'un projet.

---

## 🚀 Comment importer

1. Ouvrez un projet dans ElegPM
2. Allez dans l'onglet **Tâches** ou **Jalons**
3. Cliquez sur le bouton **Importer**
4. Sélectionnez votre fichier CSV ou Excel
5. Vérifiez les résultats de l'import
6. Les tâches/jalons sont automatiquement créés !

---

## ⚠️ Gestion des erreurs

L'import vous indiquera :
- ✅ Nombre de lignes lues
- ✅ Nombre d'éléments importés avec succès
- ❌ Erreurs rencontrées avec le numéro de ligne et le détail

Les erreurs courantes :
- Champs obligatoires manquants (Titre, Date cible pour les jalons)
- Format de date invalide
- Projet introuvable
- Format de couleur invalide

---

## 💡 Conseils

1. **Testez avec un petit fichier** - Commencez avec 2-3 lignes pour valider le format
2. **Vérifiez les noms de projets** - Assurez-vous qu'ils correspondent exactement aux projets existants
3. **Format de date** - Utilisez toujours le format `jj/MM/aaaa`
4. **Encodage CSV** - Utilisez UTF-8 pour éviter les problèmes d'accents
5. **Séparateur CSV** - Virgule (,) ou point-virgule (;) sont acceptés

---

## 📊 Créer un fichier Excel

Vous pouvez créer un fichier Excel avec les mêmes colonnes que le CSV :

1. Ouvrez Excel ou LibreOffice Calc
2. Créez les en-têtes dans la première ligne
3. Remplissez vos données
4. Enregistrez au format `.xlsx`
5. Importez dans ElegPM !

---

**Besoin d'aide ?** Consultez la documentation complète dans `docs/fr/`
