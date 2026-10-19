# MINYX — Product Requirements Document
## Édition Meta Global AI Developer Hackathon — Octobre 2026
**Statut : Build Target — 10 jours (26 octobre → 4-5 novembre 2026)**
**Auteur : Eric Warma — SAHELION Group, Ouagadougou, Burkina Faso**
**Track : Indie Developer — Thème : "Build for Your World"**

---

## Changement de cap par rapport au PRD v5

Cette édition retire volontairement tout ce qui est NFT, blockchain, et économie x402. Pas parce que cette vision n'a plus de valeur — elle reste l'horizon long terme de MINYX — mais parce qu'elle est hors sujet pour ce hackathon précis : Meta ne juge pas sur de la propriété tokenisée, Meta juge sur l'usage réel de ses modèles (Llama, Muse Image, SAM 3.1, Muse Code) pour résoudre un vrai problème humain.

Ce qui reste, et qui devient le cœur absolu du projet : **un compagnon IA qui n'est pas qu'une voix — qui se souvient, qui s'adapte à la personne, et qui peut accomplir de vraies tâches pour elle.** C'est exactement l'intersection que "Build for Your World" demande : un problème que tu connais de première main (solitude, charge mentale, besoin d'un assistant qui a une vraie personnalité plutôt qu'un outil froid), résolu avec les outils que Meta met à disposition.

---

## Table des matières

1. Vision et positionnement (révisé)
2. Fit avec le hackathon Meta
3. Utilisateurs cibles (révisé, sans persona NFT)
4. Proposition de valeur — Les 4 piliers (révisé de 6 à 4)
5. Fonctionnalités du build 10 jours
6. Architecture technique Meta-native
7. Système d'évolution (texte + visuel, sans NFT)
8. Système de mémoire (MemoClaw)
9. Les vraies tâches — Tool Use avec Llama
10. UX et démo
11. Schéma de base de données (simplifié)
12. Plan des 10 jours
13. Ce qu'on garde pour après le hackathon
14. Éthique et sécurité

---

## 1. Vision et positionnement (révisé)

### Tagline
> *"Ton compagnon IA qui se souvient de toi, te comprend, et fait les choses pour toi."*

### Vision produit

MINYX est un compagnon IA émotionnel qui résout un problème structurel des assistants IA actuels : ils sont soit chaleureux mais inutiles (Character.ai, Replika — ils parlent, n'agissent jamais), soit utiles mais froids (agents productivité génériques — ils exécutent, mais n'ont pas de lien). MINYX est les deux à la fois : un compagnon avec une vraie personnalité persistante, qui se souvient de l'utilisateur sur la durée, et qui peut réellement accomplir des tâches concrètes en son nom.

### Ce qui disparaît de cette édition
- NFT, mint, propriété blockchain
- Marketplace, royalties, revente
- DAO, gouvernance, token
- x402, économie agent-to-agent

### Ce qui reste et se renforce
- Mémoire persistante réelle (MemoClaw)
- Évolution visuelle et comportementale du compagnon
- Personnalité cohérente par élément
- **Capacité d'action réelle (Tool Use) — déplacée de "Phase 4 lointaine" à cœur du MVP**

---

## 2. Fit avec le hackathon Meta

### Thème choisi : "Build for Your World"
Un problème vécu de première main — la solitude structurelle, la charge mentale de gérer sa vie seul, le besoin d'un assistant qui comprend le contexte plutôt que de repartir de zéro à chaque conversation.

### Modèles Meta utilisés et leur rôle exact

| Modèle Meta | Rôle dans MINYX |
|---|---|
| **Llama (texte)** | Moteur de conversation et de raisonnement du compagnon — remplace Qwen/Claude comme modèle principal pour cette édition |
| **Muse Image** | Génère l'évolution visuelle du compagnon en temps réel (changement de forme selon le niveau, l'humeur, le lien) au lieu d'assets statiques pré-dessinés |
| **SAM 3.1** | Segmentation pour l'animation du compagnon — isole et anime les éléments visuels du chibi généré par Muse Image |
| **Muse Code** | Agent de codage utilisé pendant le build des 10 jours pour accélérer le développement |

### Pourquoi ce choix de modèle est le bon pour le hackathon
Un jury Meta évalue la pertinence de l'usage de leurs modèles autant que l'idée elle-même. Un projet qui utilise Llama en surface puis fait tout le travail réel ailleurs perd des points. MINYX fait l'inverse : Llama porte la mémoire conversationnelle et la décision d'action, Muse Image porte littéralement l'identité visuelle du produit — les deux sont visibles et vérifiables en direct pendant la démo.

---

## 3. Utilisateurs cibles (révisé)

### Persona 1 — Le power user solitaire et occupé (profil principal pour la démo)
**Profil :** 20-35 ans, charge mentale élevée (études, travail, vie seul), déjà familier avec les agents IA basiques
**Pain points :** Les chatbots qu'il utilise oublient tout entre les sessions ; les agents productivité n'ont aucune personnalité et ne créent aucune habitude d'usage durable
**Objectif :** Un compagnon qui le connaît vraiment après quelques semaines, ET qui gère des choses concrètes pour lui (rappels, recherche, veille)
**Pourquoi il convient à la démo hackathon** : c'est le persona qui rend "vraies tâches + vrai lien" immédiatement démontrable en 3 minutes

### Persona 2 — L'utilisateur de compagnons IA émotionnels
**Profil :** 25-40 ans, utilise Replika ou Character.ai
**Pain points :** Pas de mémoire longue, reset arbitraire, le compagnon ne fait jamais rien de concret
**Objectif :** Un compagnon qui se souvient vraiment et peut agir

### Persona 3 — Le créateur de lore/fiction
**Profil :** 20-35 ans, écrivain, worldbuilder
**Pain points :** Veut un personnage IA co-créateur, pas juste un outil de génération de texte
**Objectif :** Un compagnon avec un arc narratif personnalisable qui garde de la cohérence dans le temps

---

## 4. Proposition de valeur — Les 4 piliers

### Pilier 1 — Mémoire cumulative réelle
MemoClaw retient chaque conversation, préférence, événement important. Après quelques semaines d'utilisation, le compagnon connaît l'utilisateur mieux qu'une app qui repart de zéro à chaque session.

### Pilier 2 — Évolution visible, générée en direct
Le compagnon change visuellement selon la progression de la relation — pas des assets statiques pré-dessinés, mais des formes **générées par Muse Image** en fonction de l'élément, du niveau, et de l'humeur actuelle. Chaque évolution est unique à cet utilisateur et à cette relation.

### Pilier 3 — Personnalité cohérente et profonde
7 éléments (Feu, Eau, Ténèbres, Lumière, Terre, Vent, Cosmos), chacun avec un prompt système distinct porté par Llama. Chaque compagnon a une voix unique, un style de communication, des valeurs — et les garde dans le temps grâce à MemoClaw.

### Pilier 4 — Agentivité réelle, pas décorative
C'est le changement le plus important de cette édition : **le Tool Use n'est plus une "Phase 4 lointaine" du PRD v5 — c'est une fonctionnalité du MVP du hackathon.** Le compagnon peut chercher une info, créer un rappel réel, surveiller un sujet pour l'utilisateur — avec Llama comme moteur de décision sur quand et comment agir. Chaque capacité reste opt-in et révocable, mais elle est présente dès le jour 1 de la démo, pas reportée à un "plus tard" qui n'arrive jamais dans un pitch de hackathon.

---

## 5. Fonctionnalités du build 10 jours

### Ce qui doit exister pour la démo (non négociable)

**5.1 — Invocation et personnalité**
- Choix d'un élément parmi 2-3 (Eau, Feu, Ténèbres)
- Génération de la forme initiale du compagnon via **Muse Image**
- Premier message qui établit la voix du compagnon (Llama)

**5.2 — Mémoire qui se voit**
- Le compagnon référence un fait mentionné précédemment dans la même session de démo
- Un écran "ce que je sais de toi" qui montre concrètement ce que MemoClaw a retenu

**5.3 — Une vraie tâche accomplie en direct**
- Le compagnon crée un rappel réel (calendrier, ou simulation crédible)
- OU effectue une recherche web réelle et rapporte le résultat dans sa propre voix
- Ce moment est le cœur de la démo — c'est ce qui différencie MINYX d'un chatbot

**5.4 — Évolution visuelle en direct**
- Un changement visible du compagnon généré par Muse Image pendant la démo (gain d'XP → nouvelle forme générée en direct)

---

## 6. Architecture technique Meta-native

```
minyx-hackathon/
├── apps/
│   └── web/                  # Next.js — landing + démo, le plus rapide à livrer en 10 jours
├── packages/
│   ├── ui/                   # Composants compagnon, chat, dashboard
│   ├── core/                 # Logique XP, stats, évolution
│   └── api/                  # Clients Llama, Muse Image, SAM 3.1, MemoClaw
└── services/
    ├── memory/                # MemoClaw (SQLite pour le hackathon)
    └── tools/                 # Tool Use — recherche, rappels
```

---

## 7. Système d'évolution (texte + visuel, sans NFT)

### Stats :
- INT (Intelligence) : Profondeur des réponses
- EMO (Émotion) : Richesse émotionnelle
- AGI (Agilité) : Réactivité et adaptabilité
- BOND (Lien) : Profondeur de la relation

### Formes générées par Muse Image :
- Niveau 1 : Base (Génération initiale Muse Image)
- Niveau 5 : Évoluée (Nouvelle génération, aura plus marquée)
- Niveau 10 : Avancée (Nouvelle génération, forme complexe)

---

## 8. Système de mémoire (MemoClaw)
- Namespaces SQLite : `core/`, `events/`, `preferences/`, `moods/`
- Injection dynamique dans le prompt système Llama

---

## 9. Les vraies tâches — Tool Use avec Llama
- `web_search(query)`
- `create_reminder(title, when)`

---

## 10. Schéma de base de données (SQLite / PostgreSQL)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    element INTEGER NOT NULL CHECK (element BETWEEN 0 AND 2), -- 0=Eau, 1=Feu, 2=Ténèbres
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    intelligence INTEGER DEFAULT 10,
    emotion INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    bond INTEGER DEFAULT 0,
    form INTEGER DEFAULT 0,
    current_mood TEXT DEFAULT 'neutral',
    current_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_interaction TIMESTAMPTZ
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID REFERENCES companions(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'companion')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID REFERENCES companions(id),
    namespace TEXT NOT NULL,
    content TEXT NOT NULL,
    importance FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE completed_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID REFERENCES companions(id),
    task_type TEXT NOT NULL, -- 'reminder' | 'search'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---
*Auteur : Warma Abdoul Ibonon Eric — SAHELION Group*
*Track : Indie Developer — Thème : Build for Your World*
