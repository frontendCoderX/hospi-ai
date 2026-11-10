# HospiAI: Take-Home Assignment

> [!IMPORTANT]
> It is **not** production software, is not used by or affiliated with any hospital or practice,
> and is **not** HIPAA compliant. All patients and data in it are **fictional seed data**.
> Do not enter real patient information.

Doctors type quick, unstructured notes ("Discharged Jane Doe, bill a level 3"). An LLM turns
them into **structured, editable tasks**. A staff member **checks and corrects every task before
it is approved**. The AI proposes; a human decides.

---

## What it does

**`/doctor`: Doctor's Command Center**
- A chat box for plain-English notes. One note can create several tasks
  (discharge + billing).
- The same box answers questions ("How many patients do I currently have at Mercy?") **from the
  database**. Each reply is labelled *Action → staff queue* or *Query → read from database*.
- A daily census card: active patients by hospital, discharges, pending tasks, and tasks staff sent
  back ("Needs your input").

**`/staff`: Staff Action Queue (human in the loop)**
- Tabs: **Pending Review**, **Approved**, **Needs Doctor Clarification**. New tasks appear within
  ~2 seconds (the page polls the server).
- Each task is an **editable form**, not raw JSON.
  - 🔴 **Red**: a required field the doctor didn't mention (e.g. insurance). **Blocks Approve**,
    in the browser *and* on the server.
  - 🟡 **Yellow**: a value that isn't in the doctor's words, so the AI inferred it
    (e.g. "level 3" → `99213`). Warns staff to verify.
- **Source Transcript**: the doctor's exact note with the extracted words highlighted. Hovering a
  field highlights where it came from.
- **Audit trail**: the AI's original output is never overwritten. Edited fields show
  *"Edited by staff · AI said: X"*.
- **Approve** (marks the task completed and, for status changes, updates the patient record),
  **Save Edits**, **Flag for Doctor**.

## Tech stack

| | |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | shadcn/ui (Radix), Tailwind CSS v4, Lucide icons |
| AI | Vercel AI SDK v7 (`ai`, `@ai-sdk/react`) + OpenAI (`@ai-sdk/openai`), tool calling, streaming |
| Database | Supabase (Postgres) via `@supabase/supabase-js`, **server-side only** |
| Validation | zod |

---

## Running it locally

**You need:** Node.js 22+, a free [Supabase](https://supabase.com) project, an OpenAI API key.

```bash
npm install
cp .env.example .env.local   # then fill in the values below
```

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `OPENAI_MODEL` | Any OpenAI chat model with tool calling (built and tested with `gpt-4o-mini`) |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API keys |

**Database:** in Supabase → **SQL Editor**, run these in order:
1. `supabase/schema.sql`: creates the two tables (run once).
2. `supabase/seed.sql`: loads fictional demo data. Re-run it any time to reset the demo.

```bash
npm run dev          # http://localhost:3000
```

Optional, to test the AI route from the terminal:
```bash
node scripts/test-chat.mjs "Discharged Jane Doe from Mercy, bill a level 3"
```

## Demo

Open `/doctor` and `/staff` side by side after running the seed.

1. On `/doctor`: **"Discharged Jane Doe from Mercy, bill a level 3"** → 2 tasks queued.
2. Within ~2 seconds the cards appear on `/staff`. The billing card has a **red** insurance field
   (Approve is blocked) and a
   **yellow** billing code (AI inferred 99213 from "level 3"). Hover the fields to see the source
   words.
3. Fill in the insurance, correct the code → *"AI said: 99213"* appears → **Approve** → the card
   moves to the Approved tab. Approve the discharge → Jane moves to discharges on `/doctor`.
4. **"Admitted John Smith to Mercy"** → then ask **"How many patients do I currently have at
   Mercy?"** The AI switches from writing a task to reading the database, and says pending tasks
   aren't counted. Approve John's card, ask again → the count goes up.
5. **Flag for Doctor** on any card → it appears under *"Needs your input"* on `/doctor`.

---

## How it works

```
Doctor types a note
  → app/api/chat/route.ts       streamText + 4 tools (AI SDK v7)
      ├ create_billing_task ┐
      ├ update_patient_status├─→ lib/ai/tools.ts: works out missing + inferred fields IN CODE
      ├ draft_staff_followup ┘   → inserts action_queue row (status: pending)
      └ query_patients ────────→ reads patients (never writes)
Staff reviews on /staff
  → app/staff/actions.ts        saveEdits / executeAction / flagForDoctor (server actions, zod)
      → Approve: re-checks required fields, updates patients (status changes), status: completed
```


## Key decisions

- **Human in the loop, enforced by the server.** The AI never executes anything. Required fields
  are checked again on the server at Approve, so a disabled button isn't the only safeguard.
- **Don't trust the model to grade itself.** "Missing" and "inferred" are computed in code: an
  empty required field, or a value that doesn't appear in the doctor's note. They don't come from
  the model reporting its own confidence.
- **Audit trail.** `ai_payload` is written once by the AI; staff changes go to `edited_payload`.
  You can always see what the AI proposed and what a person approved.
- **The browser never talks to Supabase.** All database access is in server code (`server-only`).
  Keys have no `NEXT_PUBLIC_` prefix.
- **Answers come from data, not memory.** Questions must go through `query_patients`, and the tool
  result says that pending tasks are not counted.
- **Scope.** Two pages, two tables, and the workflows from the brief. Everything else is listed under
  *What I'd do next*.

## Known limitations

- **Not HIPAA compliant.** Notes are sent to OpenAI (production would need a BAA). There's no
  login, so there's no record of *who* approved what. Row level security is off.
- **No external integrations yet.** Approving updates this app's own database only. Syncing to
  Google Sheets, Salesforce or an EMR is the next step (see below).
- **Billing codes are inferred by the AI**, and therefore flagged yellow for a human. Real billing
  rules change often and belong in versioned code/config, not in a prompt.
- **Hospital-name matching is plain text.** "lukes" doesn't match "St. Luke's".
- One doctor, no clinics or schedules. No automated tests.

## What I'd do next

1. **Auth + roles + an audit log** of every status change (who, when, what changed).
2. **Per-clinic configuration**: required fields, workflows and sync targets per clinic, insurance
   and hospital, instead of hard-coded rules.
3. **Sync adapters** behind one interface: Google Sheets, Salesforce, EMR (FHIR).
4. **Push-based live updates** (the staff queue polls every 2 s today), plus doctor schedules
   across hospitals and patients "coming back for something" (follow-ups).
5. **An eval suite**: a fixed set of doctor notes → expected tool calls, run on every prompt or model
   change.
6. Hospital names loaded from the database into the prompt, and a stronger model for billing.

---


## Time spent

| Duration | Work |
|---|---|
| ~75 min | Planning and scope cuts; Phase 1: Supabase schema, seed, env, base pages |
| ~27 min | Phase 2: staff queue, editable cards, server actions |
| ~50 min | Phase 3: AI route + tools. Phase 4: doctor chat + census. Explainability |
| ~60 | Audit trail, README, staff polling, removed the fake sync, final checks |
| ~20 min | Read the brief, wrote the goal, scaffolded Next.js 16 + shadcn |
