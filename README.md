# ElegPM - Application de Gestion de Projet

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Plateforme-Windows%20%7C%20Linux-lightgrey.svg)]()
[![GitHub release](https://img.shields.io/github/v/release/ElegAlex/ElegPM)](https://github.com/ElegAlex/ElegPM/releases/latest)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)]()
[![Electron](https://img.shields.io/badge/Electron-30.0-47848f.svg)]()

> Application desktop moderne de gestion de projet inspirée de Linear, avec stockage JSON local et interface React/TypeScript. Déployable en exécutable autonome pour une utilisation locale sans dépendances réseau.

## 📦 Téléchargement

**Prêt à l'emploi ! Téléchargez la dernière version pour votre plateforme :**

<div align="center">

### [⬇️ Télécharger pour Linux (101 MB)](https://github.com/ElegAlex/ElegPM/releases/download/v1.0.1/ElegPM-linux-x64-1.0.0.zip)

### [⬇️ Télécharger pour Windows (105 MB)](https://github.com/ElegAlex/ElegPM/releases/download/v1.0.1/ElegPM-win32-x64-1.0.0.zip)

**ou voir toutes les versions →** [GitHub Releases](https://github.com/ElegAlex/ElegPM/releases)

</div>

### Démarrage Rapide

1. **Téléchargez** le fichier .zip pour votre système
2. **Extrayez** l'archive
3. **Lancez** l'exécutable :
   - Linux : `./elegpm`
   - Windows : `elegpm.exe`

Aucune installation requise ! Extrayez et exécutez.

---

## 📋 Vue d'ensemble

ElegPM est une application desktop conçue pour suivre des projets complexes dans des environnements où l'hébergement externe est difficile à valider. Une solution standalone parfaite pour une utilisation locale avec des capacités d'export faciles pour le partage.

### Cas d'usage principaux

Suivi de projets impliquant :
- Plusieurs ressources et activités
- Ateliers et collaboration d'équipe
- Organisation par service/département
- Livrables avec jalons
- Planification et ordonnancement détaillés
- Capacités d'export pour le partage et le reporting

**Problèmes résolus** :
- ✅ Aucune dépendance à un hébergement externe
- ✅ Installation simple sur Windows/Linux
- ✅ Export PDF/Excel pour partage hors ligne
- ✅ Interface ergonomique et intuitive
- ✅ Stockage local performant basé sur fichiers
- ✅ Import de projets existants depuis Excel

---

## 🎯 Fonctionnalités principales

### Gestion de projets
- Créer/éditer/supprimer des projets
- 5 statuts (non commencé, en cours, en pause, terminé, archivé)
- 4 niveaux de priorité (basse, moyenne, haute, urgente)
- Suivi automatique de la progression
- Code couleur personnalisable

### Gestion des tâches
- Organisation hiérarchique (tâches/sous-tâches)
- 5 statuts (à faire, en cours, en revue, terminé, bloqué)
- Affectation de ressources
- Temps estimé vs temps réel
- Tags personnalisables
- Commentaires et pièces jointes
- Dépendances entre tâches

### Visualisations
- **Tableau de bord** : Vue d'ensemble avec statistiques et activité récente
- **Vue liste** : Organisation hiérarchique des tâches
- **Vue Kanban** : Organisation par statut avec glisser-déposer
- **Diagramme de Gantt** : Timeline avec jalons et dépendances
- **Vue ressources** : Charge de travail et allocation

### Jalons
- Définition de dates cibles
- 3 statuts (en attente, atteint, manqué)
- Affichage dans le diagramme de Gantt
- Alertes pour jalons à venir

### Import/Export
- **Import** : Excel (.xlsx) et CSV avec mapping flexible des colonnes
- **Export PDF** : Rapport complet avec toutes les sections
- **Export Excel** : Données complètes pour analyse
- **Export PNG/JPG** : Diagrammes de Gantt et visualisations

### Ressources
- Gestion d'équipe (nom, rôle, département, email)
- Taux de disponibilité
- Allocation de tâches avec pourcentage
- Vue de charge de travail

---

## 🏗️ Architecture technique

### Stack technologique

**Frontend**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (gestion d'état)
- Recharts (graphiques)
- Lucide React (icônes)
- date-fns (gestion des dates)

**Backend**
- Electron (wrapper desktop)
- Stockage fichiers JSON (persistance locale des données)
- Node.js (runtime intégré)

**Build**
- Electron Forge
- Webpack
- Compilateur TypeScript

### Structure de stockage des données

Stockage basé sur fichiers JSON avec 8 entités principales :
1. **projects** : Informations des projets
2. **tasks** : Tâches avec hiérarchie
3. **milestones** : Jalons de projet
4. **resources** : Équipe/ressources
5. **task_assignments** : Allocation ressource → tâche
6. **comments** : Commentaires sur tâches/projets
7. **attachments** : Métadonnées des fichiers joints
8. **activity_log** : Historique des actions

### Communication IPC

Architecture sécurisée avec :
- **Main Process** : Gère le stockage fichier et opérations système
- **Renderer Process** : Interface React isolée
- **Preload Script** : Exposition API sécurisée via contextBridge
- **IPC Channels** : Communication asynchrone via electron ipcMain/ipcRenderer

---

## 🎨 Design

### Inspiré de Linear (Mode clair)

- Interface épurée et moderne
- Espacement généreux (grille 8 points)
- Typographie Inter
- Transitions fluides (150ms)
- Pas de fioritures inutiles

### Palette de couleurs

```css
Primaire :   #3B82F6 (Bleu)
Succès :     #10B981 (Vert)
Attention :  #F59E0B (Orange)
Erreur :     #EF4444 (Rouge)
Fond :       #FFFFFF (Blanc)
Avant-plan : #171717 (Quasi noir)
Bordure :    #E5E7EB (Gris clair)
```

### Composants UI

- Boutons : 3 variantes × 3 tailles
- Inputs : Anneau bleu au focus, validation inline
- Cartes : Ombre subtile, élévation au survol
- Badges : Statuts et priorités colorés
- Sidebar : 240px, fond #FAFAFA
- Tooltips : Détails au survol
- Modales : Overlay + centré, animation fade

---

## 📦 Distribution

### Format de distribution

**Fichier** : `ElegPM-{plateforme}-x64-1.0.0.zip` (Windows/Linux)
- Taille : ~100-105 MB (runtime Electron inclus)
- Installation : Extraire et exécuter
- Données : `%APPDATA%/ElegPM/` (Windows) ou `~/.config/ElegPM/` (Linux)

### Configuration système requise

- **OS** : Windows 10/11 ou Linux (64-bit)
- **RAM** : 2 GB minimum, 4 GB recommandé
- **Disque** : 300 MB d'espace libre
- **Processeur** : Dual-core 2 GHz minimum

---

## 🚀 Démarrage rapide

### Installation pour le développement

```bash
# 1. Cloner le dépôt
git clone https://github.com/ElegAlex/ElegPM.git
cd ElegPM

# 2. Installer les dépendances
npm install

# 3. Lancer en mode développement
npm start
```

### Build de production

```bash
# Créer les packages pour distribution
npm run make

# Les packages seront dans : out/make/zip/{plateforme}/x64/
```

---

## 🔧 Personnalisation

### Configuration facile

Tous les éléments personnalisables sont centralisés :

**Couleurs** : `tailwind.config.js`
```javascript
colors: {
  primary: "#3B82F6",  // Changer la couleur principale
  success: "#10B981",
  // ...
}
```

**Constantes** : `src/renderer/lib/constants.ts`
```typescript
export const APP_NAME = "ElegPM";
export const DEFAULT_PROJECT_COLOR = "#3B82F6";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
```

---

## 📝 Notes de développement

### Bonnes pratiques

1. **TypeScript Strict** : Activer le mode strict
2. **Commits atomiques** : Un commit = une fonctionnalité
3. **Tests** : Ajouter des tests unitaires pour la logique métier
4. **Documentation** : Commenter le code complexe
5. **Logs** : Utiliser console.log intelligemment (dev uniquement)

### Sécurité

- ✅ Context isolation activé
- ✅ Node integration désactivé
- ✅ Preload script pour exposition API
- ✅ Validation des entrées
- ✅ Sanitisation des données
- ✅ Headers CSP

### Performance

- Pagination pour grandes listes
- Défilement virtuel (react-window)
- Debouncing pour recherche
- Lazy loading des images
- Mémoïsation React (React.memo)

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à soumettre une Pull Request.

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

Copyright (c) 2025 Alexandre BERGE

---

## 👤 Auteur

**Alexandre BERGE**
- Site web : [Elegartech.fr](https://elegartech.fr)
- GitHub : [@ElegAlex](https://github.com/ElegAlex)
- Blog : [Communs Numériques](https://communs-numeriques.fr)

---

## 🙏 Remerciements

Construit avec des technologies web modernes et inspiré par la philosophie de design épurée de Linear.

---

**Version** : 1.0.1
**Dernière mise à jour** : Novembre 2025

---

Fait avec ❤️ par Alexandre BERGE
