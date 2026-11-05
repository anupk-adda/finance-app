# Finance APP SDLC

This lab demonstrates how to use **IBM Bob** together with **GitHub.com** to build, test, review, and evolve a small finance analytics application with an end-to-end agentic workflow.

The scenario uses a simple React-based market dashboard application that:
- pulls market data for **IBM** and up to 4 competitors
- shows views for **current day**, **last 7 days**, and **last quarter**
- is validated locally before code is committed and pushed
- is extended through GitHub pull requests that Bob can interpret and implement

---

## Lab Goals

By the end of this lab, participants should understand how IBM Bob can help with:

1. **Code generation**
   - Scaffold a new application
   - Implement dashboards and data integrations
   - Add tests and documentation

2. **Local engineering workflow**
   - Inspect the repository
   - run tests
   - review changes
   - prepare commits

3. **GitHub workflow integration**
   - analyze Git diffs
   - generate PR descriptions
   - align code changes to GitHub issues or PR requests
   - support PR-driven feature delivery

4. **Autonomous change handling**
   - interpret a requested enhancement from GitHub
   - implement a new feature branch
   - validate the change
   - push the update back to the repository for review and merge

---

## Reference Style

This repository contains a reference folder with an example workshop style.  
This new lab follows the same approach:
- clear workshop framing
- step-by-step exercises
- concrete prompts to use with Bob
- focus on realistic engineering outcomes

---

## Lab Contents

- `WORKSHOP-part1-BUILD.md` — Build the finance dashboard application with Bob
- `WORKSHOP-part2-GITHUB-AUTOMATION.md` — Use Bob with GitHub issues, branches, PRs, and review automation
- `.github/workflows/finance-app-ci.yml` — Example CI workflow for the finance app
- `.github/PULL_REQUEST_TEMPLATE.md` — Example pull request template for human + Bob collaboration
- `docs/pr-feature-request-example.md` — Example PR/request scenario for autonomous feature implementation

---

## Run the Finance App Locally

Requires Node 20+.

```bash
npm install
npm run dev          # Express proxy (:3001, live Yahoo Finance) + Vite UI (http://localhost:5173)
npm run dev:mock     # UI only, deterministic mock data (no network needed)
npm run check        # lint + tests (--runInBand) + build, same steps as CI
```

Success looks like:
- `npm run lint` exits 0 with no output.
- `npm test -- --runInBand` reports all test files passing (domain, config, proxy routes, HTTP service, dashboard UI).
- `npm run build` finishes with `built in ...`. A chunk-size warning is expected.
- In the browser, the **Today** tab shows five quote cards. **Last 7 days** and **Last quarter** each show a % change comparison chart and a ranking table, with IBM highlighted.

Layout: `src/domain` (pure normalization and metrics), `src/services` (data service interface, HTTP and mock adapters), `server/` (Express proxy around `yahoo-finance2`), `src/views` and `src/components` (UI). To track another company, add it to `src/config/companies.ts` (IBM plus at most four competitors).

---


## Target Demo Scenario

### Application
A React application that presents finance dashboards for:
- IBM
- Microsoft
- Oracle
- SAP
- Salesforce

The dashboards should cover:
- **current day**
- **last 7 days**
- **last quarter**

Example data source:
- Yahoo Finance, typically through a public npm package such as `yahoo-finance2`, or via a backend proxy if needed

### Operational Flow
1. Bob creates the application structure
2. Bob implements finance data retrieval and dashboard views
3. Bob adds or updates tests
4. Bob validates the project locally
5. Bob reviews the diff
6. Bob helps create commit and PR content
7. A new GitHub PR requests a feature such as:
   - “add a graph for a user-selected company”
8. Bob fetches the request context, implements the feature, tests it, and pushes the branch updates

---

## Important Practical Note

Bob can:
- inspect code
- modify files
- run tests and commands
- analyze diffs
- fetch GitHub issue context
- generate PR descriptions
- help prepare and push branch changes using git commands

Bob typically does **not** directly merge or close PRs through GitHub UI APIs unless a dedicated integration or slash-command path is available in the environment.

Therefore, in this lab, “close the PR” should be understood as one of these realistic outcomes:
- Bob pushes the requested implementation to the PR branch so the PR is ready to merge
- Bob creates the branch, commit, and PR description for a maintainer to merge
- optionally, the maintainer or an external automation closes/merges the PR after validation

---

## Suggested Audience

- Developer advocates
- Solution architects
- Engineering leads
- AI-assisted development champions
- DevOps / platform teams exploring agentic workflows with GitHub

---

## Suggested Lab Duration

- Part 1: 30–45 minutes
- Part 2: 30–45 minutes

---

## Expected Takeaways

Participants should leave with a practical understanding of:
- how Bob accelerates initial application delivery
- how Bob fits into a Git-based workflow
- how Bob can process feature requests coming from GitHub
- how to structure a realistic “AI engineer in the loop” lab for demonstrations and workshops

---

## Related Reference

See the existing reference materials in [Git Platform Operations Guide](https://github.ibm.com/ClientEngineering/bob/blob/main/GitOps/README.md).
