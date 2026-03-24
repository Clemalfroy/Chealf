# Chealf - Document Produit

## Vision

Chealf est une application web pour planifier des repas sains, gourmands, simples et varies. L'app utilise l'IA comme assistant interactif pour creer des recettes et planifier des semaines de repas. L'utilisateur interagit via un input texte et voit les resultats se materialiser visuellement en temps reel (fiches recettes, calendrier, liste de courses).

---

## Utilisateurs cibles

- **MVP** : usage personnel (mono-utilisateur)
- **Architecture** : prevue pour le multi-utilisateurs des le depart (modele de donnees avec `user_id`, auth en place)

---

## Parcours utilisateur

L'application suit un parcours en deux phases naturelles :

- **Phase 1 — Construction de la bibliotheque** : La creation de recettes est le point d'entree principal. L'utilisateur construit sa bibliotheque de recettes via l'assistant IA. Le planning n'est pas encore l'objectif prioritaire.
- **Phase 2 — Planification** : Une fois la bibliotheque suffisamment etoffee, le planning hebdomadaire devient le flux principal. De nouvelles recettes peuvent etre creees a la volee si aucune recette existante ne convient a un slot.

---

## Fonctionnalites principales

### 1. Creation de recettes (assistee par IA)

**Experience utilisateur :**
- Interface split : un input texte en bas + une fiche recette visuelle en haut qui se met a jour en temps reel
- Le LLM agit comme un agent avec des tools : il appelle des fonctions (`fillRecipeTitle`, `addIngredient`, `setSteps`, `generateImage`, etc.) pour remplir la fiche recette de facon progressive et visible
- L'utilisateur observe la recette se construire en direct (streaming), puis edite librement tous les champs une fois la generation terminee
- L'utilisateur peut re-ouvrir le chat IA sur une recette existante pour l'iterer : "rends cette recette plus legere", "remplace la creme par du lait de coco", "ajoute une etape de marinade"

**Donnees d'une recette :**
- Titre
- Photo du resultat final (generee par IA avec guidelines de style configurables)
- Liste d'ingredients avec :
  - Nom
  - Quantite **par personne** (ex: 1 oeuf, 100g de poulet)
  - Unite
  - Comportement de scaling : stocke comme un exposant float (`scaling_factor`) — 1.0 = lineaire, ~0.6 = sub-lineaire (epices, assaisonnements), 0.0 = fixe (ex: une feuille de laurier). Formule : `qty_per_person * baseServings * (displayServings / baseServings) ^ scaling_factor`. Implementee dans `src/lib/scaling.ts` (`scaleQuantity`) — utilisee dans la fiche recette (ajusteur de portions) et reutilisee en M4 (liste de courses).
  - Rayon de supermarche (reference vers l'ontologie des rayons)
- Nombre de personnes recommande
- Temps de preparation
- Saisonnalite : plage de mois (ex: juin-septembre), determinee automatiquement par les ingredients et stockee sur la recette (recomputee a chaque modification des ingredients)
  - Note : multi-region hors scope MVP — necessite une table `ingredient_seasonality` dediee, pas une simple colonne
- Photo : stockee dans Supabase Storage (chemin enregistre dans `image_url`)
- Etapes de preparation :
  - Etapes avec `step_order` (sequence) et `parallel_group` optionnel (meme groupe = simultane, affichage "pendant ce temps...")
  - Les references aux ingredients dans les etapes sont resolues cote frontend par matching textuel (pas de stockage en DB)
- Tags de regime alimentaire : auto-detectes a partir des ingredients (vegetarien, vegan, sans gluten, etc.) + filtrables
- Score nutritionnel :
  - Score visuel en surface (type indicateur rapide)
  - Detail complet des macros au clic (calories, proteines, glucides, lipides, etc.)
  - Estimation par le LLM — valeurs approximatives affichees avec un indicateur "estimation IA" (ex : "~450 kcal")

**Guidelines de generation :**
- **Profil de base** : toujours actif, definit les preferences globales (allergies, ingredients bannis, objectifs nutritionnels, style de cuisine)
- **Guidelines contextuelles** : activables/desactivables selon le besoin (ex: "semaine rapide", "batch cooking", "repas du dimanche")
- **Guidelines d'images** : fichier de prompts configurable pour controler le style visuel des images generees
- **Memoire IA** : le LLM maintient une base de faits structures sur l'utilisateur (preferences implicites, aversions, habitudes de cuisine) alimentee automatiquement par les conversations. Ces faits sont consultes a chaque nouvelle interaction. L'utilisateur peut les voir et les modifier dans les parametres.

### 2. Recherche inversee par ingredients

- L'utilisateur saisit les ingredients qu'il a sous la main ("j'ai du poulet, du riz et des poivrons")
- L'app filtre et suggere les recettes realisables depuis la bibliotheque
- Aide a reduire la fatigue decisionnelle : partir de ce qu'on a plutot que de chercher parmi toutes les recettes

### 3. Planning hebdomadaire

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

### 4. Liste de courses

- Generee automatiquement a partir du planning
- Ingredients agreges (si 2 recettes utilisent des oignons, les quantites sont sommees, en tenant compte du comportement de scaling de chaque ingredient via `scaleQuantity` de `src/lib/scaling.ts`)
- Quantites ajustees au nombre de parts choisi pour chaque recette (meme formule que l'ajusteur de la fiche recette)
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
- Table dediee : `ingredients` (id, name, aisle_id, season_start, season_end)
- Pas de colonne `region` — le multi-region necessite une table `ingredient_seasonality(ingredient_id, region, season_start, season_end)` dediee (hors scope MVP)
- Un ingredient est une entite unique reutilisee entre toutes les recettes
- Les recettes referencent les ingredients via une table de liaison `recipe_ingredients` (recipe_id, ingredient_id, quantity_per_person, unit, scaling_factor)
- Quand le LLM ajoute un ingredient a une recette, il cherche d'abord dans les ingredients existants. S'il n'existe pas, il propose la creation (avec rayon, saisonnalite, etc.)

### Tags de regime alimentaire
- Table dediee : `dietary_tags` (id, slug)
- `slug` = cle i18n (ex: `"vegetarian"`, `"gluten_free"`) — labels localises dans `src/i18n/en.json` / `src/i18n/fr.json`
- Pre-seedes : vegetarian, vegan, gluten_free, lactose_free, pescatarian, halal, kosher
- Auto-detectes a partir des ingredients de la recette
- Evolutifs avec validation utilisateur si le LLM propose un nouveau tag

### Rayons
- Table dediee : `aisles` (id, slug)
- `slug` = cle i18n (ex: `"butcher"`, `"fruits_vegetables"`) — labels localises dans `src/i18n/`
- Pre-seedes avec les rayons standards (15 rayons)
- Evolutifs avec validation utilisateur

### Score nutritionnel
- `nutrition_score smallint` sur `recipes` : indicateur 0-100 pour affichage rapide
- `nutrition_data jsonb` sur `recipes` : macros detailles `{ calories, protein, carbs, fat, fiber, ... }`, estimation LLM
- Requetable via `(nutrition_data->>'calories')::int` avec index GIN si besoin

### 5. Page d'accueil

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
- **ORM** : Drizzle ORM (schema TypeScript, migrations auto-generees)
- **Auth** : Supabase Auth (email + mot de passe)
- **Framework IA** : Vercel AI SDK v6 (provider-agnostic, tool calling, streaming)
- **LLM par defaut** : Claude (Anthropic) via Vercel AI SDK v6
- **Generation d'images** : DALL-E 3 (OpenAI) — image du plat final uniquement
- **Style d'images** : guidelines configurables dans un fichier de prompts

---

## Principes de design

1. **L'IA comme agent, pas comme chat** : le LLM manipule directement l'interface via des tools, pas du texte brut
2. **Live preview** : la creation d'une recette est visible en temps reel (streaming progressif des champs)
3. **Streaming creation + post-edit** : l'IA cree en temps reel, l'utilisateur edite apres. L'utilisateur peut aussi re-engager l'IA sur une recette existante pour iterer.
4. **Quantites par personne avec scaling intelligent** : les quantites sont stockees par personne avec un `scaling_factor` float (exposant de puissance) par ingredient — 1.0 = lineaire, ~0.6 = sub-lineaire, 0.0 = fixe
5. **UX minimaliste** : chaque interaction doit etre la plus simple possible (un clic pour supprimer un slot, etc.)

---

## Sequence d'implementation

Les fonctionnalites sont construites dans cet ordre, chacune de bout en bout (DB + API + IA + UI) :

1. **Creation de recettes** — le coeur du produit et le point d'entree en Phase 1
2. **Planning hebdomadaire** — devient pertinent une fois la bibliotheque constituee
3. **Liste de courses** — generee automatiquement depuis le planning
4. **Page d'accueil** — agregation et filtres sur les fonctionnalites precedentes

---

## Hors scope MVP

- Partage de recettes / export
- Multi-utilisateurs (architecture prevue mais pas activee)
- Mapping des rayons par magasin specifique
- Gestion des stocks (ingredients deja en possession)
- Regions de saisonnalite autres que la France
- App mobile native / PWA
- Photos d'ingredients (phase de polish, apres MVP)
- Import de recettes depuis une URL (differe)
- Estimation du cout par recette (necessite une reflexion sur la variabilite des prix selon les regions et saisons)
