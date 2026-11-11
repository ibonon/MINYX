# MINYX — Architecture Decision Records (ADR)

**Auteur : Eric Warma — SAHELION Group**  
**Projet : MINYX — Compagnon IA avec mémoire persistante et exécution de tâches**

---

## ADR-001 : Maintien de Prisma (SQLite / PostgreSQL) au lieu de MongoDB

### Statut
**Accepté & Acté**

### Contexte
La spécification initiale (PRD Emergent.sh) mentionnait MongoDB comme stack par défaut. Cependant, le codebase existant dispose déjà d'un schéma relationnel complet, typé et testé sous **Prisma ORM** avec SQLite pour le développement local et PostgreSQL + pgvector pour la production.

### Décision
Nous maintenons **Prisma ORM avec SQLite en local et PostgreSQL en production**. Aucun passage vers MongoDB/Mongoose n'est opéré pour les raisons suivantes :
1. **Équivalence fonctionnelle stricte (100%)** : Le schéma Prisma couvre l'intégralité des 5 entités demandées par le PRD :
   - `User` (email, passwordHash, createdAt)
   - `Companion` (userId, name, element, level, xp, stats)
   - `Conversation` & `Message` (companionId, userId, role, content, toolCallJson)
   - `MemoryItem` (companionId, userId, content, importance, namespace)
   - `Reminder` (userId, companionId, title, dueAt, status)
2. **Intégrité relationnelle & multi-tenant** : Les contraintes de clés étrangères avec suppression en cascade (`onDelete: Cascade`) garantissent qu'aucune mémoire ou rappel orphelin ne subsiste lors de la suppression d'un utilisateur ou compagnon.
3. **Zéro friction de déploiement** : Le moteur est testé, le build Next.js 15 compile avec succès, et le health check est validé (`status: ok, database: ok`).

---

## ADR-002 : Architecture et Scaffold de Google OAuth (Stub prêt à brancher)

### Statut
**Scaffoldé — Stub actif & non-bloquant. Activation réelle = post-MVP (en attente des identifiants Google Cloud Console).**

### Contexte
Le PRD demande l'option de connexion Google OAuth en complément de l'inscription par email/mot de passe. La génération des identifiants (Client ID & Client Secret) dépend de la console Google Cloud de l'organisation et n'est pas encore disponible. **Décision actée : la structure est livrée maintenant, l'activation ne bloque aucune autre fonctionnalité.**

### Décision
Nous scaffoldons l'infrastructure complète de Google OAuth :
1. **Route d'initiation** : `GET /api/auth/google` — génère l'URL d'autorisation OAuth2 Google avec les scopes `userinfo.profile` + `userinfo.email`. Si `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` ne sont pas définies, la route **redirige proprement** (`307`) vers `/?authError=google_not_configured` sans planter.
2. **Route de retour (Callback)** : `GET /api/auth/google/callback` — échange le `code` OAuth contre un jeton, récupère le profil via `https://www.googleapis.com/oauth2/v2/userinfo`, **upsert** le compte `User` (avec `passwordHash` bcrypt de remplissage si le compte n'existe pas), génère la session JWT MINYX révocable et redirige vers `/`. Tous les cas d'erreur sont renvoyés via `?authError=...` (`google_cancelled`, `google_exchange_failed`, etc.), jamais par un crash.
3. **Interface utilisateur** : Le bouton « CONTINUER AVEC GOOGLE » dans `AuthModal.tsx` pointe vers `/api/auth/google`. Le message d'erreur `google_not_configured` est géré côté client et invite à utiliser la connexion Email — aucun blocage du flux d'inscription classique.

### Non-blocage — preuve d'exécution réelle
Stub vérifié par appels HTTP sur le serveur de développement (`next dev`, port 3000), avant configuration des identifiants Google :

```
GET /api/auth/google           -> status=307  location=/?authError=google_not_configured
GET /api/auth/google/callback  -> status=307  location=/?authError=google_cancelled
```

Aucune exception serveur ; le flux email/mot de passe reste pleinement opérationnel (critères PRD §1 validés indépendamment).

### Prérequis d'activation (post-MVP, à effectuer dans Google Cloud Console)
Pour activer le flux réel, il suffira — sans aucune modification du code — de :
1. Créer un **OAuth 2.0 Client ID** (type « Application Web ») dans Google Cloud Console.
2. Enregistrer l'**URI de redirection autorisée** : `https://<domaine-de-prod>/api/auth/google/callback` (et `http://localhost:3000/api/auth/google/callback` pour le développement local).
3. Définir les deux variables d'environnement suivantes (voir `.env.example`) :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Redémarrer l'application. `isGoogleOAuthConfigured()` détecte les clés et bascule automatiquement du stub vers le flux OAuth réel.

> Tant que ces variables sont absentes, le comportement de repli non-bloquant décrit ci-dessus s'applique par construction.
