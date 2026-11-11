# MINYX 🐉

> *"Ton compagnon IA qui grandit avec toi… et que tu possèdes vraiment."*

**MINYX** is an emotional AI companion platform combining:

- 🧠 **Cumulative memory** — MemoClaw remembers interactions and builds context over time
- ⚔️ **RPG evolution** — Visual and behavioral changes as your companion levels up
- 🔗 **True ownership** — Companions mapped to an ERC-721 contract on Base L2 (adapter in `packages/blockchain`)
- 🤖 **Agentic layer** — The companion can call tools (reminders, web search) through the Meta Model API tool-calling loop

---

## Architecture

```
MINYX Monorepo (Turborepo + npm workspaces)
├── apps/
│   ├── web/          # Next.js 15 + React 19 — main app & HTTP API (route handlers)
│   └── mobile/       # Expo / React Native — mobile shell
└── packages/
    ├── ui/           # Shared UI components (React)
    ├── core/         # Business logic: XP, stats, evolution engine
    ├── api/          # Prisma data layer + Meta Model API client + tools (MemoClaw)
    └── blockchain/   # Wagmi v2 + Viem + RainbowKit helpers (ERC-721)
```

The HTTP API is served by **Next.js route handlers** under `apps/web/src/app/api/**`. There is no separate gateway/microservice tier.

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 15 (App Router), React 19, Framer Motion, Tailwind, Three.js / react-three-fiber |
| Mobile | Expo SDK 57, React Native 0.86 |
| State management | Zustand + TanStack Query |
| Blockchain | Base L2, ERC-721, Wagmi v2, Viem, RainbowKit |
| AI Core | Meta Model API (OpenAI-compatible) + deterministic scripted fallback |
| Memory | SQLite (dev) / PostgreSQL + pgvector (prod) via Prisma |
| Auth | Session JWT (jose) with server-side revocation, bcrypt password hashing |
| Delivery | Docker (multi-stage, Next.js `standalone`) + docker-compose |
| Monorepo | Turborepo + npm workspaces |

## 7 Elements

Each companion belongs to one of 7 elements, each with a unique personality system:

🔥 **Feu** · 💧 **Eau** · 🌑 **Ténèbres** · ✨ **Lumière** · 🌍 **Terre** · 🌬️ **Vent** · 🌌 **Cosmos**

## Getting Started

```bash
# Install dependencies
npm install

# Local database (SQLite) — generate Prisma client + apply migrations
npx prisma generate --schema packages/api/prisma/schema.prisma
npx prisma migrate dev --schema packages/api/prisma/schema.prisma

# Run the web app in dev mode
npm run dev

# Build everything
npm run build

# Lint
npm run lint

# Test
npm run test
```

Copy `.env.example` to `.env` and fill in the required values before running.

## Production (Docker)

```bash
docker compose up --build
```

The compose file builds the web image (`runner` target) and runs a one-shot
`migrate` job (PostgreSQL + pgvector) before the app starts.

## Project Status

| Phase | Status |
|---|---|
| Phase 0 — Prototype | ✅ Complete |
| Phase 1 — MVP enrichi | 🚧 In progress |
| Phase 2 — Social & Marketplace | 📅 Q2 2027 |
| Phase 3 — OpenClaw-RL & DAO | 📅 Q3-Q4 2027 |
| Phase 4 — Agentic Layer | 📅 Q1 2028 |

## Author

**Eric Warma** — SAHELION Group, Ouagadougou, Burkina Faso  
PRD version: 5.0 — Août 2026

---

*MINYX — Where AI companionship meets true ownership.*
