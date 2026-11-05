# Finance Market Dashboard - Implementation Plan

## Top-Level Overview

**Goal:** Build a React market dashboard that tracks IBM plus up to four competitors using Yahoo Finance data, with three time-window views: current day, last 7 days and last quarter.

**Repository starting point (verified):** The repo has no application code yet. It contains workshop docs ([`WORKSHOP-part1-BUILD.md`](WORKSHOP-part1-BUILD.md), [`WORKSHOP-part2-GITHUB-AUTOMATION.md`](WORKSHOP-part2-GITHUB-AUTOMATION.md)), a CI workflow ([`.github/workflows/finance-app-ci.yml`](.github/workflows/finance-app-ci.yml)), a PR template ([`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)) and a sample feature request ([`docs/pr-feature-request-example.md`](docs/pr-feature-request-example.md)).

**Hard constraints from the repo:**
- CI has no `working-directory`, so `package.json` lives at the **repo root**.
- CI runs `npm install`, `npm run lint --if-present`, `npm test --if-present -- --runInBand` and `npm run build --if-present` on Node 20. All four scripts must exist and pass.
- CI triggers on `main`, `feature/**` and `bob/**` pushes and on PRs to `main`.
- Default tickers per workshop doc: IBM, MSFT, ORCL, SAP, CRM.
- The workshop warns that Yahoo browser access is unreliable. The UI and normalization layers must stay stable while the data source is swapped.

**Decisions confirmed with the user:**
- Data comes from a small Node/Express proxy using `yahoo-finance2`, plus a mock adapter for tests and offline demos.
- The app lives at the repo root.

**Proposed stack:**
- Vite, React and TypeScript.
- Vitest with React Testing Library.
- ESLint.
- Recharts.
- Express for the proxy.
- `concurrently` to run the proxy and the UI together in dev.

**Approach:** Keep a strict layering of UI -> hooks/state -> service interface -> adapters -> pure normalization. The tickers list is configuration, not code. That makes the later "user-selected company graph" feature additive.

### Target Folder Layout

```
package.json, vite.config.ts, tsconfig*.json, eslint config, index.html   (repo root)
src/
  main.tsx, App.tsx
  config/        tickers.ts, timeWindows.ts
  types/         market.ts (Quote, PricePoint, SeriesResult, TimeWindow, Ticker)
  domain/        normalize.ts, metrics.ts            (pure functions, no I/O)
  services/      marketDataService.ts (interface), httpMarketDataService.ts,
                 mockMarketDataService.ts, errors.ts, index.ts (factory)
  state/         dashboardReducer.ts, DashboardContext.tsx
  hooks/         useMarketData.ts
  components/
    layout/      DashboardShell, TimeWindowTabs
    cards/       QuoteCard, ComparisonTable
    charts/      PriceLineChart, RelativePerformanceChart
    common/      LoadingState, ErrorState
  views/         TodayView, WeekView, QuarterView
  test/          fixtures/, setup.ts
server/          index.ts (Express app), yahooClient.ts, routes.ts
docs/            architecture.md, adding-a-company.md, existing feature request doc
.github/         PULL_REQUEST_TEMPLATE.md (existing), ISSUE_TEMPLATE/, workflows/ (existing)
```

### Key Architecture Decisions

| Concern | Decision | Why |
|---|---|---|
| Component boundaries | Views (data-aware) -> cards/charts (presentational, props only) -> common states | Presentational pieces are trivially testable and reusable for new chart panels |
| Data service | `MarketDataService` interface with `getQuotes(symbols)` and `getHistory(symbol, window)`. Adapters: HTTP (talks to the Express proxy) and Mock (fixtures). Factory chooses by `VITE_DATA_SOURCE`. | Swap sources without touching UI. Tests and CI never hit the network. |
| Proxy | Express wraps `yahoo-finance2`, exposes `/api/quotes` and `/api/history`, validates symbol and window params, and maps Yahoo failures to stable error codes | Avoids browser CORS and Yahoo instability. Contains the unofficial-API risk in one place. |
| Normalization | Pure functions convert raw Yahoo payloads into app types, drop null points, and compute daily change, 7-day move, quarter trend and ranking | Where partial-data resilience lives. Easy to unit test. |
| Time windows | Window config maps each of the three windows to a Yahoo range and interval (intraday for day, hourly or similar for 7 days, daily for quarter). Exact values are confirmed against the `yahoo-finance2` chart API during implementation. | Single place to tune. |
| Charting | Recharts. Line chart for day and 7 days, area or line for the quarter. Multi-ticker comparison charts plot percent change from window start so IBM and competitors share a scale. | Declarative React fit, covers all three suggested chart types |
| State | `useReducer` plus Context for UI state (selected window, active symbols). A `useMarketData` hook owns async state (`idle/loading/success/error`) per symbol, with an in-memory cache keyed by symbol and window. No Redux or react-query. | State is small. Per-symbol status enables partial failure. Cache avoids refetch on tab switch. |
| Error handling | Typed errors (`NetworkError`, `InvalidSymbolError`, `PartialDataError`, `UpstreamError`). Per-ticker error state, so one failing competitor shows an error card while the others render. A global banner appears only when all tickers fail. | Resilience requirement from the workshop |
| Extensibility | `tickers.ts` is the single source of the symbol list (IBM fixed as primary, max four competitors, enforced in config validation). A selected-symbol slot in state is designed for but not built. | The part 2 user-selected company feature becomes a new panel plus an input, reusing the service and hook |

---

## Sub-Tasks

### 1. Project scaffold and tooling
**Intent:** Create a root-level project that satisfies the existing CI contract.
**Expected Outcomes:**
- `npm install`, `npm run lint`, `npm test -- --runInBand` and `npm run build` all succeed on an empty app shell.
- `npm run dev` starts the UI. A placeholder App renders.
**Todo List:**
1. Create `package.json` with scripts `dev`, `dev:ui`, `dev:server`, `build`, `lint`, `test`, `preview`.
2. Add the Vite, React and TypeScript configs and `index.html`.
3. Add the ESLint config, Vitest config (jsdom, setup file) and `.gitignore` (node_modules, dist).
4. Verify that `npm test -- --runInBand` is accepted by Vitest. If the unknown Jest flag is rejected, adapt the test script, or switch to Jest, so the unchanged CI command passes.
5. Add the placeholder `App` and a smoke test.
**Relevant Context:** [`.github/workflows/finance-app-ci.yml`](.github/workflows/finance-app-ci.yml:29) (exact commands, Node 20). Root has no existing `package.json`.
**Status:** `[ ] pending`

### 2. Domain types, config and pure normalization
**Intent:** Define the data contract and logic before any I/O, so everything else depends on stable types.
**Expected Outcomes:**
- Types for quote, price point, series and time window.
- Ticker config with IBM + 4 competitors and a validation rule.
- Normalizers and metrics (daily change, 7-day move, quarter trend, ranking, percent-from-start) are unit tested.
**Todo List:**
1. Write `types/market.ts`.
2. Write `config/tickers.ts` (IBM, MSFT, ORCL, SAP, CRM) and `config/timeWindows.ts`.
3. Write `domain/normalize.ts` handling null and missing points and unsorted data.
4. Write `domain/metrics.ts`.
5. Add unit tests with fixtures covering missing, partial and empty data.
**Relevant Context:** Metrics list in [`WORKSHOP-part1-BUILD.md`](WORKSHOP-part1-BUILD.md:161).
**Status:** `[ ] pending`

### 3. Service abstraction and mock adapter
**Intent:** Decouple UI from the data source and give tests and offline demos a deterministic provider.
**Expected Outcomes:**
- `MarketDataService` interface, typed errors and a factory selecting the adapter by env var.
- Mock adapter returns fixture data for all three windows and can simulate failures for chosen symbols.
**Todo List:**
1. Define the interface and `errors.ts`.
2. Implement `mockMarketDataService` with fixtures, including a configurable failure mode.
3. Implement `services/index.ts` factory (`VITE_DATA_SOURCE=mock|http`).
4. Unit test the mock adapter and factory.
**Relevant Context:** Types from sub-task 2.
**Status:** `[ ] pending`

### 4. Express proxy and Yahoo Finance integration
**Intent:** Provide real Yahoo data without browser CORS or instability issues.
**Expected Outcomes:**
- `server/` exposes `/api/quotes` and `/api/history` backed by `yahoo-finance2`.
- Input validation (symbol format, window enum) and consistent error responses.
- The HTTP adapter in the UI consumes the proxy and maps error codes to typed errors.
- Vite dev proxy forwards `/api` to the server.
**Todo List:**
1. Add `express` and `yahoo-finance2` dependencies, with a server TypeScript or ESM setup that fits Vite.
2. Implement `yahooClient.ts` and `routes.ts`, with the window-to-range/interval mapping shared via config.
3. Implement `httpMarketDataService.ts`.
4. Add server route tests with a mocked Yahoo client (no network).
5. Manually smoke test live data locally and record the result in `docs/architecture.md`.
**Relevant Context:** Proxy fallback guidance in [`WORKSHOP-part1-BUILD.md`](WORKSHOP-part1-BUILD.md:175). Confirm the current `yahoo-finance2` API from its docs before coding.
**Status:** `[ ] pending`

### 5. State management and data hook
**Intent:** Centralize UI state and async loading with per-symbol status.
**Expected Outcomes:**
- Reducer and Context for selected window and active symbols.
- `useMarketData(window)` returns per-symbol `{status, data, error}` and uses a cache.
**Todo List:**
1. Implement `dashboardReducer` and `DashboardContext`.
2. Implement `useMarketData` with cache and request cancellation on window change.
3. Unit test the reducer and the hook (with the mock service, including a partial-failure case).
**Relevant Context:** Service from sub-task 3.
**Status:** `[ ] pending`

### 6. UI components, charts and the three views
**Intent:** Deliver the visible dashboard.
**Expected Outcomes:**
- `TimeWindowTabs` switches among Today, 7 Days and Quarter views.
- Today: summary quote cards (price, change, percent) for all tickers.
- 7 Days: line chart of relative movement plus a comparison table.
- Quarter: area or line trend chart plus a ranking.
- Simple, readable, demo-friendly layout with IBM visually emphasized.
**Todo List:**
1. Build the common `LoadingState` and `ErrorState`.
2. Build `QuoteCard`, `ComparisonTable`, `PriceLineChart` and `RelativePerformanceChart` as props-only components.
3. Build the three views, wiring in the hook.
4. Build `DashboardShell`, `TimeWindowTabs` and `App` composition.
5. Add basic responsive styling.
**Relevant Context:** Suggested charts in [`WORKSHOP-part1-BUILD.md`](WORKSHOP-part1-BUILD.md:169).
**Status:** `[ ] pending`

### 7. Error handling and resilience pass
**Intent:** Make failure modes deliberate rather than accidental.
**Expected Outcomes:**
- One failing ticker produces a per-card error. Other tickers render.
- All-fail shows a global banner with retry.
- Empty or partial series show "insufficient data" instead of crashing.
- A top-level React error boundary is in place.
**Todo List:**
1. Add the error boundary.
2. Add retry actions to `ErrorState`.
3. Confirm partial-data paths through normalization, hook and UI.
**Relevant Context:** Typed errors from sub-task 3.
**Status:** `[ ] pending`

### 8. Test suite
**Intent:** Cover the layers that matter, with no network access in CI.
**Expected Outcomes:**
- Unit tests for normalization, metrics, reducer, services and hook.
- Component tests for cards, charts (render without crash) and views.
- At least one integration test: render `App` with the mock service, switch among all three windows and assert content.
- A partial-failure integration test.
**Todo List:**
1. Fill gaps in the unit tests from earlier sub-tasks.
2. Add component tests (React Testing Library). Handle Recharts under jsdom, for example by mocking `ResponsiveContainer` in the test setup.
3. Add the App-level integration tests.
4. Check for coverage gaps.
**Relevant Context:** Test expectations in [`WORKSHOP-part1-BUILD.md`](WORKSHOP-part1-BUILD.md:109).
**Status:** `[ ] pending`

### 9. GitHub-driven evolution support
**Intent:** Make future features arrive through issues and PRs with minimal friction.
**Expected Outcomes:**
- Issue templates (feature request, bug) aligned with the PR template and the sample in `docs/`.
- Docs explaining the extension points and how to add a company or panel.
- README with run and validate instructions and the branch and PR flow.
**Todo List:**
1. Add `.github/ISSUE_TEMPLATE/feature_request.md` and `bug_report.md` reusing the sample request structure (expected behavior, acceptance criteria).
2. Write `docs/architecture.md` covering layers, the service interface, the window config and the data flow.
3. Write `docs/adding-a-company.md` (edit `tickers.ts`) and a note on how the user-selected company feature would plug in: new input, a `selectedSymbol` state slot, a new chart panel, and the existing hook and service reused.
4. Update `README.md` with setup, scripts, env vars and the branch naming convention (`feature/*`, `bob/*`, `fix/*`), as CI already triggers on these.
5. Check that the PR template's validation commands match the real scripts.
**Relevant Context:** [`WORKSHOP-part2-GITHUB-AUTOMATION.md`](WORKSHOP-part2-GITHUB-AUTOMATION.md:282) (workflow pattern), [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md), [`docs/pr-feature-request-example.md`](docs/pr-feature-request-example.md).
**Open note:** `git status` shows paths prefixed `Github SDLC Automation/`, so the git root may be a parent folder. If so, `.github/` must be at the git root for Actions to run. Verify the git root before the first push. Do not move anything without user approval.
**Status:** `[ ] pending`

### 10. Local validation and handoff
**Intent:** Prove the whole thing works the way CI will run it.
**Expected Outcomes:** All of these pass locally:
- `npm install`
- `npm run lint`
- `npm test -- --runInBand` (exactly as CI calls it)
- `npm run build`
- `npm run dev` with mock data renders all three views.
- `npm run dev` with live Yahoo data via the proxy renders the three views. If Yahoo fails, the failure shows as an error state and not a crash.
**Todo List:**
1. Run the four CI commands in order and fix failures.
2. Manually exercise the three views with mock and live sources.
3. Review the diff and prepare a commit message and PR description using the PR template.
**Relevant Context:** CI file and PR template.
**Status:** `[ ] pending`

---

## Risks and Notes
- `yahoo-finance2` is an unofficial API and may break. This is contained behind the proxy and service interface, and the mock adapter keeps tests and CI independent of it.
- The `--runInBand` flag is a Jest flag. Vitest compatibility must be checked in sub-task 1, before building on top of it.
- Recharts in jsdom needs `ResponsiveContainer` handled in tests.
- Out of scope: authentication, persistence, deployment, the user-selected company feature itself (designed for, not built), real-time streaming.
