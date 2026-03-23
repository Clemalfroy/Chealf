# Chealf - Document Produit

## Vision

Chealf est une application web pour planifier des repas sains, gourmands, simples et varies. L'app utilise l'IA comme assistant interactif pour creer des recettes et planifier des semaines de repas. L'utilisateur interagit via un input texte et voit les resultats se materialiser visuellement en temps reel (fiches recettes, calendrier, liste de courses).

---

## Utilisateurs cibles

- **MVP** : usage personnel (mono-utilisateur)
- **Architecture** : prevue pour le multi-utilisateurs des le depart (modele de donnees avec `user_id`, auth en place)

---

## Fonctionnalites principales

### 1. Creation de recettes (assistee par IA)

**Experience utilisateur :**
- Interface split : un input texte en bas + une fiche recette visuelle en haut qui se met a jour en temps reel
- Le LLM agit comme un agent avec des tools : il appelle des fonctions (`fillRecipeTitle`, `addIngredient`, `setSteps`, `generateImage`, etc.) pour remplir/modifier la fiche recette
- L'utilisateur peut aussi editer directement les champs de la fiche (clic sur un ingredient pour modifier la quantite, etc.)
- Les modifications manuelles et les instructions via le chat coexistent

**Donnees d'une recette :**
- Titre
- Photo du resultat final (generee par IA avec guidelines de style configurables)
- Liste d'ingredients avec :
  - Nom
  - Quantite **par personne** (ex: 1 oeuf, 100g de poulet)
  - Unite
  - Photo de l'ingredient (generee par IA)
  - Rayon de supermarche (reference vers l'ontologie des rayons)
- Nombre de personnes recommande
- Temps de preparation
- Saisonnalite : plage de mois (ex: "juin-septembre"), determinee automatiquement par les ingredients
  - Architecture de donnees prevue pour supporter plusieurs regions (France par defaut)
- Etapes de preparation :
  - Vue visuelle avec parallelisation (quelles etapes peuvent etre faites en meme temps)
  - Ordre recommande
  - Reference aux ingredients utilises a chaque etape (hover ou autre UX pertinent pour voir les quantites)
- Tags de regime alimentaire : auto-detectes a partir des ingredients (vegetarien, vegan, sans gluten, etc.) + filtrables
- Score nutritionnel :
  - Score visuel en surface (type indicateur rapide)
  - Detail complet des macros au clic (calories, proteines, glucides, lipides, etc.)
  - Estimation par le LLM

**Guidelines de generation :**
- **Profil de base** : toujours actif, definit les preferences globales (allergies, ingredients bannis, objectifs nutritionnels, style de cuisine)
- **Guidelines contextuelles** : activables/desactivables selon le besoin (ex: "semaine rapide", "batch cooking", "repas du dimanche")
- **Guidelines d'images** : fichier de prompts configurable pour controler le style visuel des images generees

### 2. Planning hebdomadaire

**Experience utilisateur :**
- Le LLM agit comme un agent agentic : il appelle des tools (`setSlot`, `removeSlot`, `swapSlots`, etc.) pour remplir le calendrier visuellement
- L'utilisateur interagit via un input texte pour donner des instructions ("remplace le mardi soir par quelque chose de plus leger", "je veux du poisson au moins 2 fois")
- Le calendrier se met a jour en temps reel

**Slots :**
- Flexibles et configurables par jour (ex: 1 slot le jeudi, 2 le vendredi)
- Templates predefinies pour les cas courants :
  - "Soirs en semaine + 2 repas le week-end"
  - "Tous les diners"
  - "3 repas complets"
  - etc.
- UX ultra simple pour ajouter/supprimer des slots (un clic)

**Logique de remplissage :**
- Le LLM pioche **uniquement dans les recettes existantes** de l'utilisateur
- Si aucune recette ne convient pour un slot, l'utilisateur peut creer une nouvelle recette a la volee
- Equilibre du planning pilote par l'utilisateur : instructions custom via le chat OU presets (ex: "equilibre", "riche en proteines", "leger en semaine")
- Popularite des recettes inferee par la frequence d'utilisation dans les plannings (pas de systeme de favoris explicite)

### 3. Liste de courses

- Generee automatiquement a partir du planning
- Ingredients agreges (si 2 recettes utilisent des oignons, les quantites sont sommees)
- Quantites ajustees au nombre de parts choisi pour chaque recette
- Regroupement par rayon de supermarche (via l'ontologie des rayons)
- Checkboxes interactives pour cocher en faisant les courses (usage mobile en magasin)
- Tooltip sur chaque ingredient indiquant le rayon/emplacement

**Ontologie des rayons :**
- Table dediee en DB avec une liste normalisee de rayons (ex: Fruits & Legumes, Boucherie, Poissonnerie, Epicerie salee, Epicerie sucree, Produits frais, Surgeles, Boissons, Boulangerie, Cremerie, etc.)
- Liste initiale pre-seedee au setup
- Evolutive : quand le LLM assigne un ingredient a un rayon, il doit choisir parmi les rayons existants. S'il ne trouve pas de rayon adapte, il peut proposer un nouveau rayon qui necessite une validation de l'utilisateur avant d'etre ajoute a l'ontologie
- Pas de doublons : chaque ingredient reference un rayon existant par ID, garantissant la coherence dans la liste de courses

---

## Ontologies (entites normalisees)

Toutes les entites partagees sont normalisees en DB pour eviter les doublons. Le LLM doit toujours chercher dans l'existant avant de creer. Si une entite n'existe pas, il la propose et l'utilisateur valide.

### Ingredients
- Table dediee : `ingredients` (id, nom, photo, rayon_id, saisonnalite_debut, saisonnalite_fin, region)
- Un ingredient est une entite unique reutilisee entre toutes les recettes
- Les recettes referencent les ingredients via une table de liaison `recipe_ingredients` (recipe_id, ingredient_id, quantite_par_personne, unite)
- Quand le LLM ajoute un ingredient a une recette, il cherche d'abord dans les ingredients existants. S'il n'existe pas, il propose la creation (avec rayon, saisonnalite, etc.)

### Tags de regime alimentaire
- Table dediee : `dietary_tags` (id, nom, description)
- Pre-seedes : vegetarien, vegan, sans gluten, sans lactose, pescetarien, halal, casher, etc.
- Auto-detectes a partir des ingredients de la recette
- Evolutifs avec validation utilisateur si le LLM propose un nouveau tag

### Rayons
- Table dediee : `aisles` (id, nom)
- Pre-seedes avec les rayons standards
- Evolutifs avec validation utilisateur

### 4. Page d'accueil

- Si un planning existe pour la semaine en cours : affichage du planning
- Sinon : affichage des recettes de saison (basees sur le mois courant)
- Filtres essentiels :
  - Saison (mois courant)
  - Temps de preparation
  - Regime alimentaire (tags)

---

## Stack technique

- **Frontend** : Next.js 16 + React 19 + TypeScript
- **UI** : Tailwind CSS 4 + shadcn/Base UI + Lucide icons
- **Backend** : Next.js API routes / Server Actions
- **Base de donnees** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth (email + mot de passe)
- **Framework IA** : Vercel AI SDK v6 (provider-agnostic, tool calling, streaming)
- **LLM** : provider configurable (Claude, GPT, etc. via Vercel AI SDK)
- **Generation d'images** : provider a definir, abstrait dans l'architecture
- **Style d'images** : guidelines configurables dans un fichier de prompts

---

## Principes de design

1. **L'IA comme agent, pas comme chat** : le LLM manipule directement l'interface via des tools, pas du texte brut
2. **Live preview** : toutes les modifications sont visibles en temps reel
3. **Dual mode** : l'utilisateur peut interagir via le chat OU editer directement les elements visuels
4. **Quantites par personne** : tout est stocke par unite pour permettre le scaling lineaire
5. **UX minimaliste** : chaque interaction doit etre la plus simple possible (un clic pour supprimer un slot, etc.)

---

## Hors scope MVP

- Partage de recettes / export
- Multi-utilisateurs (architecture prevue mais pas activee)
- Mapping des rayons par magasin specifique
- Gestion des stocks (ingredients deja en possession)
- Regions de saisonnalite autres que la France
- App mobile native / PWA
