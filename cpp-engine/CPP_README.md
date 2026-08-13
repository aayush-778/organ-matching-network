# C++ Engine

This folder contains the native matching engine used by the Next.js app. It is built as a standalone C++17 binary and executed from `src/app/api/match/route.ts` during every donor match run.

## Purpose

The engine is responsible for the part of the pipeline that benefits most from a compiled, deterministic implementation:

- reject incompatible donor/recipient pairs quickly,
- compute transport feasibility against the ischemia window,
- rank the remaining recipients into a clinically ordered queue,
- emit a JSON result that the web app can persist as an offer session.

## What The Engine Receives

`main.cpp` reads a single JSON object from stdin. The shape expected by the live API is:

```json
{
  "organ": "Kidney",
  "ischemia_limit_mins": 1800,
  "donor_hospital_id": 12,
  "donor_blood_mask": 18,
  "max_allowed_hla_mismatches": 4,
  "recipients": [
    {
      "id": "P-001",
      "urgency": 9,
      "waiting_years": 2,
      "blood_mask": 260,
      "hospital_id": 45
    }
  ]
}
```

Only the fields above are needed by the live matching route.

## What The Engine Returns

The final line printed by `main.cpp` is JSON with:

- `status`: `success` or `error`,
- `organ`: the organ name that was matched,
- `matches_found`: number of candidates that survived filtering,
- `ranked_match_run`: ordered match queue,
- `screened_out`: rejected candidates and reasons.

The web app reads this result, stores it in MongoDB as an `OfferSession`, and exposes the session through the live offer endpoints.

## Engine Architecture

The engine is split into three active stages plus two supporting utilities.

### Tier 1: Biochemical compatibility

Files:

- [include/bitmask_check.h](include/bitmask_check.h)
- [src/bitmask_check.cpp](src/bitmask_check.cpp)

This layer encodes ABO, Rh, and HLA data into bitmasks and checks compatibility using bitwise operations. The live route combines donor blood type and HLA antigens into one integer before calling the engine.

### Tier 2: Transit logistics

Files:

- [include/graph.h](include/graph.h)
- [src/graph.cpp](src/graph.cpp)

This layer uses a weighted directed graph and Dijkstra’s algorithm to calculate the fastest path from the donor hospital to each recipient hospital.

The current graph is a fixed regional network seeded in code. It is intentionally small and explainable rather than dynamically loaded from an external routing service.

### Tier 3: Clinical triage ranking

Files:

- [include/max_heap.h](include/max_heap.h)
- [src/max_heap.cpp](src/max_heap.cpp)

The heap ranks the remaining candidates by a score computed from urgency, waiting time, and travel cost. The highest score is extracted first and becomes the top offer.

### Supporting utilities

Files:

- [include/trie.h](include/trie.h)
- [src/trie.cpp](src/trie.cpp)
- [include/circular_queue.h](include/circular_queue.h)

These utilities are part of the native codebase and are exercised by the test suite, even though they are not currently on the live matching path.

## Live Matching Flow

1. The web app sends a JSON payload to the binary through stdin.
2. The engine loads the fixed hospital graph and computes all shortest paths from the donor hospital.
3. Each recipient is checked for blood/HLA compatibility.
4. Compatible recipients are checked again for route availability and ischemia window limits.
5. Surviving candidates are inserted into the heap and ranked.
6. The engine emits the final ranked queue and the screened-out list as JSON.

## Ranking Logic

The current score formula is:

$$
score = 10 \times urgency + 2 \times waiting\_years - 0.5 \times distance\_km
$$

Tie-breaking favors:

1. higher score,
2. longer waiting time,
3. stable patient identifiers as a final deterministic fallback.

## Ischemia Window Logic

The engine labels a candidate as:

- `safe` when the ETA uses less than 70% of the window,
- `tight` when it is at or above that threshold.

Candidates that exceed the ischemia limit are screened out entirely.

## Build

From the repository root:

```bash
npm run build:engine
```

This compiles the binary to `cpp-engine/engine` on Linux/macOS and `cpp-engine/engine.exe` on Windows.

You can also build manually from inside `cpp-engine/`:

```bash
g++ -std=c++17 -O2 -Iinclude src/*.cpp -o engine
```

## Native Tests

From `cpp-engine/`:

```bash
g++ -std=c++17 -Iinclude tests/test_structures.cpp src/*.cpp -o tests/run_tests
./tests/run_tests
```

The tests cover:

- bitmask compatibility,
- heap ordering,
- graph shortest paths,
- trie lookup/autocomplete,
- circular queue behavior.

## Operational Notes

- The engine reads JSON from stdin, so it can be executed by any wrapper that can spawn a process and write to its standard input.
- The matching API gives the binary 5 seconds before timing it out.
- The current graph is hard-coded; if the hospital network changes, the graph data must be updated in `main.cpp`.
- The engine output is consumed as the last JSON line on stdout.

## Relationship To The Web App

The web app uses the native output to create an offer session, then stores and serves that session through MongoDB-backed routes. If you are looking at the overall product, this folder is the part that decides which recipients are eligible and which one should be offered first.
