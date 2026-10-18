# MINYX 🐉

> *"Ton compagnon IA qui grandit avec toi… et que tu possèdes vraiment."*

**MINYX** is the first emotional AI companion platform combining:

- 🧠 **Cumulative memory** — MemoClaw remembers every interaction and builds a real relationship over months
- ⚔️ **RPG evolution** — Visual, auditory, and behavioral changes as your companion levels up
- 🔗 **True ownership** — Each companion is an ERC-721 NFT on Base L2 — transferable and resaleable
- 🤖 **Agentic layer** — Your companion doesn't just talk, it acts in your world (with your permission)
- 🧬 **Auto-improvement** — OpenClaw-RL adapts your companion based on your interaction patterns

---

## Architecture

```
MINYX Monorepo (Turborepo + pnpm)
├── apps/
│   ├── web/          # Next.js 15 + React 19 — Main web app
│   ├── mobile/       # Expo React Native — iOS/Android
│   └── desktop/      # Tauri — Windows/macOS/Linux desktop
├── packages/
│   ├── ui/           # Shared UI components (React + RN)
│   ├── core/         # Business logic: XP, stats, evolution engine
│   ├── api/          # OpenClaw & MemoClaw client SDK
│   └── blockchain/   # Wagmi v2 + Viem + RainbowKit helpers
└── services/
    ├── gateway/      # OpenClaw Gateway (FastAPI + Docker)
    ├── memory/       # MemoClaw memory service (Qdrant + PG)
    ├── rl/           # OpenClaw-RL reinforcement learning service
    └── agentic/      # Agentic Layer — tool execution engine
```

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 15, React 19, Framer Motion, Tailwind, shadcn/ui |
| Mobile | Expo SDK 52, React Native, Reanimated 3 |
| Desktop | Tauri 2, Rust |
| State management | Zustand + TanStack Query |
| Blockchain | Base L2, ERC-721, Wagmi v2, Viem, RainbowKit |
| AI Core | Qwen2.5-7B (local) + Claude (fallback) |
| Memory | Qdrant (vector) + PostgreSQL + Redis |
| Services | FastAPI, Docker, Railway → Fly.io |
| Monorepo | Turborepo + pnpm workspaces |

## 7 Elements

Each companion belongs to one of 7 elements, each with a unique personality system:

🔥 **Feu** · 💧 **Eau** · 🌑 **Ténèbres** · ✨ **Lumière** · 🌍 **Terre** · 🌬️ **Vent** · 🌌 **Cosmos**

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Build everything
pnpm build
```

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
