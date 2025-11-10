# Application de Gestion de Projet - Desktop (Electron)

> Application desktop moderne de gestion de projet inspirée de Linear, avec backend SQLite et interface React/TypeScript. Déployable en .exe pour une utilisation locale sans dépendance réseau.

---

## 📋 Vue d'Ensemble

Cette application a été conçue pour répondre au besoin de suivi de projets complexes dans un environnement contraint (CPAM), où l'hébergement externe est difficile à valider. Solution standalone parfaite pour une utilisation locale avec export facilité pour partage.

### Cas d'Usage Principal

**Contexte**: Flora (et d'autres utilisateurs) a besoin de suivre des projets impliquant:
- Multiple ressources et activités
- Ateliers avec les salariés
- Organisation par service/direction
- Livrables avec jalons
- Retroplanning détaillé
- Export pour la direction

**Problématiques résolues**:
- ✅ Pas de dépendance à un hébergement externe
- ✅ Installation simple sur poste Windows
- ✅ Export PDF/Excel pour partage sans connexion
- ✅ Interface ergonomique et intuitive (vs Excel)
- ✅ Base de données locale performante
- ✅ Import de projets existants depuis Excel

---

## 🎯 Fonctionnalités Principales

### Gestion de Projets
- Création/édition/suppression de projets
- 5 statuts (non démarré, en cours, en pause, terminé, archivé)
- 4 niveaux de priorité (basse, moyenne, haute, urgente)
- Suivi de progression automatique
- Code couleur personnalisable

### Gestion de Tâches
- Organisation hiérarchique (tâches/sous-tâches)
- 5 statuts (à faire, en cours, révision, terminé, bloqué)
- Assignation de ressources
- Estimation vs temps réel
- Tags personnalisables
- Commentaires et pièces jointes
- Dépendances entre tâches

### Visualisations
- **Dashboard**: Vue d'ensemble avec statistiques et activité récente
- **Vue Liste**: Organisation hiérarchique des tâches
- **Vue Kanban**: Organisation par statut avec drag & drop
- **Diagramme de Gantt**: Timeline avec jalons et dépendances
- **Vue Ressources**: Charge de travail et allocation

### Jalons (Milestones)
- Définition de dates cibles
- 3 statuts (en attente, atteint, manqué)
- Affichage dans le Gantt
- Alertes pour jalons approchant

### Import/Export
- **Import**: Excel (.xlsx) avec mapping de colonnes flexible
- **Export PDF**: Rapport complet avec toutes les sections
- **Export Excel**: Données complètes pour analyse
- **Export PNG/JPG**: Gantt et visualisations

### Ressources
- Gestion d'équipe (nom, rôle, département, email)
- Taux de disponibilité
- Allocation par tâche avec pourcentage
- Vue de charge de travail

---

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Recharts (graphiques)
- Lucide React (icons)
- date-fns (gestion dates)

**Backend**
- Electron (wrapper desktop)
- SQLite3 (base de données locale)
- Drizzle ORM (type-safe)
- Node.js (runtime intégré)

**Build**
- Electron Forge
- Webpack
- TypeScript compiler

### Structure de la Base de Données

8 tables principales:
1. **projects**: Informations projet
2. **tasks**: Tâches avec hiérarchie
3. **milestones**: Jalons
4. **resources**: Équipe/ressources
5. **task_assignments**: Allocation ressources → tâches
6. **comments**: Commentaires sur tâches/projets
7. **attachments**: Fichiers joints
8. **activity_log**: Historique des actions

### Communication IPC

Architecture sécurisée avec:
- **Main Process**: Gère la base de données et les opérations système
- **Renderer Process**: Interface React isolée
- **Preload Script**: Exposition sécurisée de l'API via contextBridge
- **IPC Channels**: Communication async via electron ipcMain/ipcRenderer

---

## 🎨 Design

### Inspiration Linear (Mode Clair)

- Interface épurée et moderne
- Espacements généreux (8-point grid)
- Typographie Inter
- Transitions fluides (150ms)
- Pas de fioritures inutiles

### Palette de Couleurs

```css
Primary:    #3B82F6 (Bleu)
Success:    #10B981 (Vert)
Warning:    #F59E0B (Orange)
Error:      #EF4444 (Rouge)
Background: #FFFFFF (Blanc)
Foreground: #171717 (Noir quasi)
Border:     #E5E7EB (Gris clair)
```

### Composants UI

- Buttons: 3 variants × 3 tailles
- Inputs: Focus ring bleu, validation inline
- Cards: Shadow subtile, hover lift
- Badges: Statut et priorité colorés
- Sidebar: 240px, fond #FAFAFA
- Tooltips: Détails au survol
- Modals: Overlay + center, animation fade

---

## 📦 Livrable

### Format de Distribution

**Fichier**: `GestionProjet-Setup.exe` (Windows)
- Taille: ~150-200 MB (incluant Electron runtime)
- Installation: Standard Windows (next, next, finish)
- Emplacement: `C:\Program Files\GestionProjet`
- Données: `%APPDATA%\GestionProjet\database.db`

### Configuration Requise

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 2 GB minimum, 4 GB recommandé
- **Disque**: 300 MB espace libre
- **Processeur**: Dual-core 2 GHz minimum

### Auto-update (Optionnel Phase 2)

Possibilité d'ajouter electron-updater pour:
- Notifications de nouvelle version
- Téléchargement en arrière-plan
- Installation automatique au redémarrage

---

## 📁 Documentation Fournie

Ce projet comprend 4 documents détaillés:

### 1. SPECIFICATIONS_TECHNIQUES.md
Spécifications complètes incluant:
- Architecture détaillée
- Schémas de base de données
- Structure IPC
- Design system complet
- Roadmap de développement (7-8 semaines)

### 2. GUIDE_DEMARRAGE.md
Guide de démarrage rapide avec:
- Commandes d'installation
- Configuration complète (Tailwind, TypeScript, etc.)
- Exemples de code pour chaque couche
- Stores Zustand
- Composants UI de base
- Scripts package.json

### 3. MAQUETTES_UI.md
Maquettes détaillées (ASCII art) pour:
- Layout principal
- Dashboard
- Liste de projets
- Détail projet
- Diagramme de Gantt
- Vue Kanban
- Formulaires
- Dialogs d'import/export

### 4. README.md (ce fichier)
Synthèse générale du projet

---

## 🚀 Démarrage Rapide

### Installation

```bash
# 1. Créer le projet
npm init electron-app@latest gestion-projet -- --template=webpack-typescript
cd gestion-projet

# 2. Installer les dépendances
npm install better-sqlite3 drizzle-orm zustand react react-dom lucide-react date-fns recharts jspdf html2canvas xlsx nanoid

npm install -D @types/react @types/react-dom @types/better-sqlite3 tailwindcss postcss autoprefixer drizzle-kit

# 3. Initialiser Tailwind
npx tailwindcss init -p

# 4. Copier les fichiers de configuration (voir GUIDE_DEMARRAGE.md)

# 5. Lancer en développement
npm start
```

### Build Production

```bash
# Créer le .exe Windows
npm run make

# Le fichier .exe sera dans: out/make/squirrel.windows/x64/
```

---

## 📊 Roadmap de Développement

### Phase 1 - MVP (2-3 semaines)
- Setup complet Electron + React + SQLite
- CRUD Projets et Tâches
- Layout et navigation
- Liste simple

### Phase 2 - Visualisations (2 semaines)
- Diagramme de Gantt
- Vue Kanban
- Dashboard
- Jalons
- Filtres et recherche

### Phase 3 - Fonctionnalités Avancées (2 semaines)
- Gestion ressources
- Hiérarchie tâches
- Commentaires et fichiers
- Import/Export Excel et PDF
- Activity log

### Phase 4 - Polish (1 semaine)
- Animations
- Optimisations performances
- Tests
- Documentation utilisateur
- Build final

**Total estimé**: 7-8 semaines pour version complète et production-ready

---

## 🎯 Prochaines Étapes Immédiates

### À faire maintenant:

1. **Récupérer le fichier Excel corrompu**
   - Le retransférer proprement
   - Analyser la structure des colonnes
   - Adapter les schémas de DB si nécessaire

2. **Valider les spécifications**
   - Confirmer que les fonctionnalités correspondent au besoin
   - Ajuster si des éléments manquent
   - Prioriser les features

3. **Créer les maquettes visuelles** (optionnel)
   - Transformer les ASCII en vraies maquettes Figma/Sketch
   - Valider l'ergonomie avec Flora

4. **Initialiser le projet**
   - Suivre le GUIDE_DEMARRAGE.md
   - Setup l'environnement de dev
   - Premier commit Git

5. **Commencer Phase 1**
   - Semaine 1: Setup + Base de données
   - Semaine 2: CRUD Projets
   - Semaine 3: CRUD Tâches + Tests

---

## 🔧 Personnalisation

### Configuration Facile

Tous les éléments personnalisables sont centralisés:

**Couleurs**: `tailwind.config.js`
```javascript
colors: {
  primary: "#3B82F6",  // Changer la couleur principale
  success: "#10B981",
  // ...
}
```

**Constantes**: `src/renderer/lib/constants.ts`
```typescript
export const APP_NAME = "Gestion Projet";
export const DEFAULT_PROJECT_COLOR = "#3B82F6";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
```

**Base de données**: `src/database/schema.ts`
- Ajouter des colonnes
- Modifier les enums
- Créer de nouvelles tables

---

## ⚠️ Important - Contraintes CPAM

Cette application a été spécifiquement conçue pour contourner les contraintes de la CPAM:

✅ **Solution Retenue**: Application locale standalone
- Pas besoin de Ramage
- Pas besoin de validation IT
- Installation sur poste utilisateur uniquement
- Export pour partage (pas de base centralisée)

❌ **Évité**: 
- Hébergement web externe
- Base de données réseau
- Dépendances services tiers
- Authentification SSO complexe

💡 **Évolution Future Possible**:
Si validation IT obtenue, l'architecture permet facilement:
- Migration vers Electron + serveur Node.js
- Base PostgreSQL centralisée
- Authentification LDAP/AD
- Synchronisation multi-utilisateurs

---

## 📝 Notes pour le Développement

### Bonnes Pratiques

1. **TypeScript Strict**: Activer le mode strict
2. **Commits Atomiques**: Un commit = une fonctionnalité
3. **Tests**: Ajouter tests unitaires pour la logique métier
4. **Documentation**: Commenter le code complexe
5. **Logs**: Utiliser console.log intelligemment (dev uniquement)

### Sécurité

- ✅ Context isolation activé
- ✅ Node integration désactivé
- ✅ Preload script pour exposition API
- ✅ Validation des inputs
- ✅ Sanitization des données
- ✅ CSP headers

### Performance

- Pagination pour grandes listes
- Virtual scrolling (react-window)
- Debouncing pour recherche
- Indexes SQL sur colonnes fréquentes
- Lazy loading des images
- Memoization React (React.memo)

---

## 🤝 Support et Questions

Pour toute question sur l'architecture ou l'implémentation, se référer aux documents détaillés:
- SPECIFICATIONS_TECHNIQUES.md pour l'architecture
- GUIDE_DEMARRAGE.md pour le code
- MAQUETTES_UI.md pour le design

---

## 📄 Licence

Propriétaire - CPAM Île-de-France

---

**Version**: 1.0.0 (Spécifications)  
**Date**: Novembre 2025  
**Auteur**: Alexandre Légaré  
**Contact**: [email]

---

## 🎉 Let's Build This!

Tous les éléments sont là pour démarrer le développement. Le projet est bien structuré, les specs sont claires, l'architecture est solide. 

Prochaine étape: récupérer le fichier Excel et on démarre! 🚀
