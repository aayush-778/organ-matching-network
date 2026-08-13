# OrganMatch Network

OrganMatch Network is a full-stack organ allocation simulation that combines a Next.js dashboard, MongoDB persistence, and a native C++ ranking engine. The project is designed to show how a real matching pipeline can be broken into small, auditable stages: biochemical compatibility, transit logistics, queue ranking, offer management, and analytics.

The application has two runtime layers:

- The web app in `src/` handles intake, registry management, live session state, analytics, and the user interface.
- The native engine in `cpp-engine/` performs the compatibility and ranking pass that turns a donor intake into a ranked recipient queue.

## What The Project Does

- Accepts donor intake details from the command center UI.
- Converts blood type and HLA loci into compact bitmasks before matching.
- Pulls waiting recipients from MongoDB and sends them to the C++ engine.
- Filters out incompatible candidates and ranks the rest by urgency, waiting time, and travel cost.
- Creates a persisted offer session with a decision window, history, and queue state.
- Lets the operator accept or decline the current offer and advances the queue accordingly.
- Tracks registry data and session history for analytics and audit-style views.

## High-Level Architecture

```mermaid
flowchart LR
  UI[Command Center UI] --> API1[/api/match]
  API1 --> DB[(MongoDB)]
  API1 --> CPP[C++ engine]
  CPP --> API1
  API1 --> SESSION[OfferSession record]
  UI --> API2[/api/offers/:sessionId]
  UI --> API3[/api/offers/:sessionId/respond]
  UI --> API4[/api/recipients]
  UI --> API5[/api/analytics]
  API2 --> SESSION
  API3 --> SESSION
  API4 --> DB
  API5 --> SESSION
  API5 --> DB
```

## Data Flow, Step By Step

### 1) Donor intake starts in the UI

The main command center lives in [src/app/page.tsx](src/app/page.tsx). It renders the intake form, starts a live session, and polls for offer updates every few seconds.

The form payload is defined in [src/types/dashboard.ts](src/types/dashboard.ts) and sent through [src/lib/api.ts](src/lib/api.ts) to `POST /api/match`.

### 2) The match route validates and normalizes the request

`POST /api/match` in [src/app/api/match/route.ts](src/app/api/match/route.ts) checks for the required donor fields, packs blood type + HLA loci into one donor mask, and queries MongoDB for recipients with `status: "waiting"` and a matching organ requirement.

If the database is unavailable, the route returns a clear fallback error rather than pretending the match succeeded. The connection logic is centralized in [src/lib/db.ts](src/lib/db.ts).

### 3) The backend hands candidate data to the native engine

The match route converts recipient documents into a compact engine payload and spawns `cpp-engine/engine` in Node runtime mode.

Inside the engine:

- `bitmask_check` rejects blood/HLA-incompatible recipients.
- `graph` computes transit paths and ETA from the donor hospital.
- `max_heap` ranks remaining candidates by clinical priority.
- The JSON output contains both the ranked queue and the screened-out list.

The engine is described in more detail in [cpp-engine/CPP_README.md](cpp-engine/CPP_README.md).

### 4) The session is persisted and exposed as a live offer queue

If the engine succeeds, the API creates an `OfferSession` document through [src/lib/offerSessions.ts](src/lib/offerSessions.ts) and stores it in MongoDB via [src/models/OfferSession.ts](src/models/OfferSession.ts).

That session tracks:

- the organ being matched,
- the donor hospital and ischemia limit,
- the ranked queue,
- the current offer expiry time,
- accepted and declined history,
- engine latency,
- counts for matches found and screened out.

The command center keeps the active session ID in local storage so it can resume after refresh.

### 5) The operator reviews and responds to offers

`GET /api/offers/:sessionId` returns the current session state, while `POST /api/offers/:sessionId/respond` records the decision.

The response route does real state mutation:

- accept marks the recipient as `matched` in MongoDB and closes the session,
- decline removes the current candidate and advances to the next one,
- timeouts are handled by the session helper when the decision window expires,
- session history is updated with timestamped audit entries.

The live UI components that consume this state are in `src/components/command/`.

### 6) Registry and analytics use the same persisted data

The patient registry in [src/app/recipients/page.tsx](src/app/recipients/page.tsx) reads from `GET /api/recipients`, which returns both recipient records and a merged history feed from all sessions.

The analytics page in [src/app/analytics/page.tsx](src/app/analytics/page.tsx) reads `GET /api/analytics`, which computes:

- average ischemia time from offer ETAs,
- accept rate from session history,
- successful transplant count from the recipient collection,
- average C++ engine latency from persisted session runs.

## Backend Components

### Next.js app layer

- [src/app/page.tsx](src/app/page.tsx): command center dashboard for running donor matches.
- [src/app/recipients/page.tsx](src/app/recipients/page.tsx): registry view and manual patient enrollment.
- [src/app/analytics/page.tsx](src/app/analytics/page.tsx): summary dashboard for session and transplant metrics.
- [src/app/api/match/route.ts](src/app/api/match/route.ts): donor intake to engine pipeline.
- [src/app/api/offers/[sessionId]/route.ts](src/app/api/offers/[sessionId]/route.ts): fetch live session state.
- [src/app/api/offers/[sessionId]/respond/route.ts](src/app/api/offers/[sessionId]/respond/route.ts): accept/decline workflow.
- [src/app/api/recipients/route.ts](src/app/api/recipients/route.ts): list and create recipients.
- [src/app/api/analytics/route.ts](src/app/api/analytics/route.ts): aggregate operational metrics.

### Library and model layer

- [src/lib/bitmask.ts](src/lib/bitmask.ts): packs and unpacks blood type and HLA information.
- [src/lib/db.ts](src/lib/db.ts): MongoDB connection cache with graceful fallback when `MONGODB_URI` is missing.
- [src/lib/offerSessions.ts](src/lib/offerSessions.ts): session lifecycle, timeout handling, and decision mutation logic.
- [src/models/Recipient.ts](src/models/Recipient.ts): recipient schema and validation.
- [src/models/OfferSession.ts](src/models/OfferSession.ts): persisted session schema.
- [src/types/dashboard.ts](src/types/dashboard.ts): shared client/server payload contracts.

### C++ engine layer

The engine currently wires together three active subsystems:

- biochemical filtering in `bitmask_check`,
- pathfinding in `graph`,
- ranking in `max_heap`.

The `trie` and `circular_queue` implementations are also present in the engine folder and covered by the native test suite, even though they are not part of the live matching path yet.

## API Surface

- `POST /api/match`: start a new match run from donor intake.
- `GET /api/offers/:sessionId`: inspect the current queue, history, and session state.
- `POST /api/offers/:sessionId/respond`: accept or decline the current offer.
- `GET /api/recipients`: list waiting recipients and merged history logs.
- `POST /api/recipients`: add a recipient to the registry.
- `GET /api/analytics`: calculate operational metrics from real session and registry data.

## Local Setup

### Prerequisites

- Node.js 20 or newer.
- npm.
- A working C++17 compiler such as `g++`.
- MongoDB, or no MongoDB if you only want the seeded fallback view.

### Environment Variables

Create a `.env.local` file with:

```bash
MONGODB_URI="mongodb+srv://..."
```

If `MONGODB_URI` is not set, the app still boots, but any route that needs persistence will return a clear database-unavailable message and the UI falls back to seed-backed reads where supported.

### Install

```bash
npm install
```

### Build the native engine

The root package already runs this automatically before `dev` and `build`, but you can run it manually too:

```bash
npm run build:engine
```

### Seed MongoDB

The seed script is idempotent and only writes if MongoDB is reachable:

```bash
npx tsx scripts/seedDatabase.ts
```

Use `--sync` if you want existing seeded recipients updated to match the current seed file:

```bash
npx tsx scripts/seedDatabase.ts --sync
```

### Run the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Testing

### Web app checks

```bash
npm run lint
npm run build
```

### Native engine checks

From `cpp-engine/`:

```bash
g++ -std=c++17 -Iinclude tests/test_structures.cpp src/*.cpp -o tests/run_tests
./tests/run_tests
```

## Deployment Notes

### Docker

Docker is the most predictable deployment target because it can build the native engine and run the Node app in one image.

Important points:

- install a C++17 compiler in the image,
- run `npm install` and `npm run build:engine` during the image build,
- pass `MONGODB_URI` at runtime,
- expose the Next.js port used by `next start`.

A typical container flow is: build dependencies, compile `cpp-engine/engine`, build the Next.js app, then start the server with the same binary available on disk.

### Vercel

Vercel can work, but the native binary is the critical constraint.

For a successful deployment:

- keep the app on the Node.js runtime, not the Edge runtime,
- make sure the deployment build step compiles `cpp-engine/engine` for Linux,
- ensure the generated binary is present in the final serverless output,
- set `MONGODB_URI` in the Vercel environment variables.

This repo already helps by wiring `npm run build:engine` into `prebuild` and `predev`, so the native binary is part of the normal build path. If your Vercel build environment does not preserve the binary correctly, Docker or another Node hosting target will be more reliable.

## Project Notes

- MongoDB is the source of truth for recipients and persisted sessions.
- Session history is persisted, but the in-memory session cache is not the authoritative store.
- The engine graph is currently a fixed regional network seeded in code.
- The ranking score favors urgency first, then waiting time, then travel cost.
- The UI is intentionally split into command center, registry, and analytics views so the pipeline can be understood in stages.

## Engine Documentation

The C++ subsystem has its own detailed guide in [cpp-engine/CPP_README.md](cpp-engine/CPP_README.md).
