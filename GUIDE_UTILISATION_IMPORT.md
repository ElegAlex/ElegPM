# 🎯 Guide pour tester l'import des tâches et jalons

## 📍 Où trouver les boutons d'import

### Étape 1 : Ouvrir ou créer un projet

1. **Lancez l'application ElegPM** (déjà en cours d'exécution)
2. Dans la fenêtre principale, vous devriez voir :
   - Soit une liste de projets existants
   - Soit un écran pour créer votre premier projet

3. **Créez un projet de test** si vous n'en avez pas :
   - Cliquez sur "Nouveau projet" ou le bouton "+"
   - Nom : "Mon Projet" (important pour les fichiers d'exemple)
   - Remplissez les autres champs
   - Cliquez sur "Créer"

### Étape 2 : Accéder à la vue détaillée du projet

1. **Cliquez sur le projet** "Mon Projet" pour l'ouvrir
2. Vous arrivez dans la vue détaillée avec plusieurs onglets en haut :
   - **Tâches** ⭐
   - **Jalons** ⭐
   - Gantt
   - WBS
   - Ressources
   - Activité

### Étape 3 : Trouver le bouton "Importer" dans l'onglet Tâches

1. **Cliquez sur l'onglet "Tâches"**
2. En haut à droite, vous verrez maintenant **DEUX boutons** :
   ```
   ┌──────────────┐  ┌──────────────────┐
   │  📤 Importer │  │ + Nouvelle tâche │
   └──────────────┘  └──────────────────┘
   ```
   - Le bouton "Importer" a une bordure bleue et un fond blanc
   - Le bouton "Nouvelle tâche" est bleu avec du texte blanc

3. **Cliquez sur "Importer"** pour ouvrir le dialogue

### Étape 4 : Utiliser le dialogue d'import des tâches

Le dialogue qui s'ouvre contient :

1. **Un bandeau bleu avec instructions** détaillées :
   - Colonnes obligatoires (Titre/Nom)
   - Colonnes optionnelles (Description, Heures estimées, Dates, etc.)
   - Exemples de valeurs

2. **Une zone de sélection de fichier** :
   - Cliquez pour sélectionner
   - Ou glissez-déposez votre fichier
   - Formats acceptés : .csv, .xlsx, .xls

3. **Utilisez le fichier d'exemple** :
   ```bash
   exemples_import/taches_exemple.csv
   ```

### Étape 5 : Tester l'import des jalons

1. **Cliquez sur l'onglet "Jalons"** dans la vue du projet
2. En haut à droite, vous verrez aussi **DEUX boutons** :
   ```
   ┌──────────────┐  ┌────────────────┐
   │  📤 Importer │  │ + Nouveau jalon│
   └──────────────┘  └────────────────┘
   ```

3. **Cliquez sur "Importer"** 
4. Le dialogue s'ouvre avec :
   - **Instructions organisées** en sections :
     - Colonnes obligatoires (Nom, Date cible)
     - Colonnes optionnelles (Projet, Description, Statut, Couleur)
   - **Astuce** sur l'utilisation des jalons
   - Guide des couleurs avec significations

5. **Utilisez le fichier d'exemple** :
   ```bash
   exemples_import/jalons_exemple.csv
   ```

---

## 🧪 Test complet pas à pas

### Test 1 : Import de tâches

```bash
# 1. Naviguez vers le dossier des exemples
cd exemples_import/

# 2. Vérifiez que le fichier existe
cat taches_exemple.csv
```

**Dans l'application :**
1. Ouvrez le projet "Mon Projet"
2. Onglet **Tâches**
3. Cliquez **Importer**
4. Sélectionnez `exemples_import/taches_exemple.csv`
5. Cliquez **Importer**
6. Vérifiez les résultats :
   - ✅ 6 lignes lues
   - ✅ 6 tâches importées
   - ❌ 0 erreur

7. Les tâches devraient apparaître dans la liste !

### Test 2 : Import de jalons

**Dans l'application :**
1. Toujours dans "Mon Projet"
2. Onglet **Jalons**
3. Cliquez **Importer**
4. Sélectionnez `exemples_import/jalons_exemple.csv`
5. Cliquez **Importer**
6. Vérifiez les résultats :
   - ✅ 6 lignes lues
   - ✅ 6 jalons importés
   - ❌ 0 erreur

7. Les jalons devraient apparaître dans la liste avec leurs couleurs !

---

## 🎨 Ce que vous devriez voir

### Dialogue d'import des jalons (amélioré)

```
┌─────────────────────────────────────────────────┐
│  Importer des jalons                         × │
├─────────────────────────────────────────────────┤
│                                                 │
│  Format du fichier                              │
│  ┌──────────────────────────────────────────┐  │
│  │ Colonnes obligatoires :                  │  │
│  │  • Nom : Nom du jalon (requis)          │  │
│  │  • Date cible : Date cible (dd/MM/yyyy) │  │
│  │                                          │  │
│  │ Colonnes optionnelles :                  │  │
│  │  • Projet : Nom du projet                │  │
│  │  • Description : Description détaillée   │  │
│  │  • Statut : En attente, Atteint, Manqué │  │
│  │  • Couleur : Code hexa (#RRGGBB)        │  │
│  │                                          │  │
│  │ 💡 Astuce : Les jalons représentent...  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│         [Zone glisser-déposer]                  │
│                                                 │
│             [Annuler]  [Importer]              │
└─────────────────────────────────────────────────┘
```

### Résultats après import

```
┌─────────────────────────────────────────────────┐
│  Importer des jalons                         × │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐                 │
│  │  6   │  │  6   │  │  0   │                 │
│  │lignes│  │jalons│  │erreur│                 │
│  └──────┘  └──────┘  └──────┘                 │
│                                                 │
│  ✅ 6 jalons importés avec succès !            │
│                                                 │
│                  [Fermer]                       │
└─────────────────────────────────────────────────┘
```

---

## ❓ Que faire si vous ne voyez pas les boutons ?

### Vérifications :

1. **L'application est-elle bien redémarrée ?**
   - Fermez complètement la fenêtre Electron
   - Relancez avec `npm start`

2. **Êtes-vous dans la vue détaillée d'un projet ?**
   - Les boutons n'apparaissent QUE dans la vue d'un projet
   - Pas dans la liste des projets

3. **Êtes-vous dans le bon onglet ?**
   - Onglet "Tâches" → Bouton "Importer" pour les tâches
   - Onglet "Jalons" → Bouton "Importer" pour les jalons

---

## 📝 Emplacement des fichiers

```
Projet-Flora/
├── exemples_import/
│   ├── taches_exemple.csv      ← 6 tâches d'exemple
│   ├── jalons_exemple.csv      ← 6 jalons d'exemple
│   └── README_IMPORT.md        ← Guide complet
```

---

**L'application est maintenant lancée et prête à tester les imports !** ✅

