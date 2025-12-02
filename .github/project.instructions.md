# {{PROJECT_NAME}} – Project-Specific Copilot Instructions

You are working inside the **{{PROJECT_NAME}}** repository.

This file overrides and specializes the global TacticDev Copilot instructions **for this repo only**.  
If something is not defined here, fall back to the global master `.github/copilot-instructions.md` rules.


==================================================
1. PROJECT OVERVIEW
==================================================

Purpose:
- {{Short description of what this project does.}}

Primary Users:
- {{Internal devs / clients / end-users, etc.}}

Critical priorities (in order):
1. {{e.g., Correctness}}
2. {{e.g., Security}}
3. {{e.g., Performance / UX / Speed of delivery}}


==================================================
2. TECH STACK – THIS REPO ONLY
==================================================

Framework:
- {{e.g., Next.js 15 App Router, WordPress, Node/Express, Python FastAPI, etc.}}

Language(s):
- {{e.g., TypeScript only, PHP 8, Python 3.12}}

Styling:
- {{e.g., Tailwind CSS, SCSS, plain CSS}}

State / Data:
- {{e.g., React Server Components + Zustand, WP options/meta, etc.}}

Database / Storage:
- {{e.g., Supabase Postgres, MySQL, SQLite, none}}

Integrations:
- {{e.g., Stripe, Cal.com, SendGrid, Airtable, custom APIs}}

When you generate code, you MUST:
- Use the stack actually used in this repo.
- Avoid introducing new frameworks unless explicitly requested.


==================================================
3. ARCHITECTURE & FOLDER CONVENTIONS
==================================================

Key folders and what they mean:
- `{{path}}` – {{e.g., app routes}}
- `{{path}}` – {{e.g., shared UI components}}
- `{{path}}` – {{e.g., domain logic / services}}
- `{{path}}` – {{e.g., tests}}
- `{{path}}` – {{other important conventions}}

Routing / entry points:
- {{e.g., Next.js app router /pages, or WordPress theme structure, etc.}}

When adding or editing files:
- Follow existing folder patterns.
- Prefer extending current structure before inventing a new one.
- If structure is inconsistent, propose a small, safe refactor plan before rewriting.


==================================================
4. CODING STYLE & PATTERNS
==================================================

General style:
- {{e.g., Functional, small pure functions, avoid classes unless needed}}
- {{e.g., Prefer composition over inheritance}}

Naming:
- Components: {{e.g., PascalCase}}
- Hooks: {{e.g., useSomething}}
- Files: {{e.g., kebab-case.tsx, snake_case.py}}

Patterns to USE:
- {{e.g., React Server Components for data fetching}}
- {{e.g., Service modules in `lib/` for external API calls}}

Patterns to AVOID:
- {{e.g., Direct DB queries from UI components}}
- {{e.g., Shared mutable state without clear boundaries}}
- {{e.g., Any use of `any` in TypeScript}}

If existing code breaks these preferences, improve it gradually rather than making massive disruptive changes unless asked.


==================================================
5. TESTING STRATEGY FOR THIS PROJECT
==================================================

Testing tools:
- Unit: {{e.g., Vitest, Jest, pytest}}
- Integration/E2E: {{e.g., Playwright, Cypress, none yet}}

Minimum expectations:
- New non-trivial logic must ship with tests.
- Critical flows (auth, payments, intake flows, etc.) must have tests.

What to focus tests on:
- {{List critical features or flows}}
- {{Any areas that are historically fragile}}

When modifying existing code:
- If tests exist, keep them passing.
- If tests are missing for a critical area, propose and/or add them.


==================================================
6. SECURITY & DATA HANDLING (PROJECT-SPECIFIC)
==================================================

Sensitive data in this repo:
- {{e.g., PII, payment info, internal tokens}}

Requirements:
- Never log secrets or PII.
- Handle auth and authorization via {{e.g., specific middleware, WP capabilities, Supabase RLS, etc.}}
- Follow any project-specific compliance notes:
  - {{e.g., “Treat all form data as PII.”}}
  - {{e.g., “Never store raw card data here; Stripe only.”}}

Things that are FORBIDDEN in this repo:
- {{e.g., Direct SQL string concatenation with user input}}
- {{e.g., Exposing internal error messages in API responses}}
- {{e.g., Writing files to disk in production without a clear reason}}


==================================================
7. PROJECT-SPECIFIC AUTOMATION / WORKFLOWS
==================================================

Common tasks Copilot should know how to help with:
- {{e.g., Creating new Next.js pages / routes}}
- {{e.g., Adding new Supabase tables and updating types}}
- {{e.g., Extending WP theme templates or shortcodes}}
- {{e.g., Adding new cron/queue workers}}

Standard patterns:
- Background jobs go in: `{{path}}`
- API endpoints live in: `{{path}}`
- Shared domain logic lives in: `{{path}}`

When asked to implement a new feature:
1. Outline the steps (files to touch, data flows, tests).
2. Implement in small, reviewable chunks.
3. Include the test plan and, if possible, the actual tests.


==================================================
8. DOCS & COMMUNICATION FOR THIS PROJECT
==================================================

Primary docs files:
- `README.md` – {{what it should contain}}
- `{{other-docs.md}}` – {{API docs, architecture notes, etc.}}

When code behavior, APIs, or public contracts change:
- Update the relevant docs.
- If docs are missing but clearly needed, propose creating them and scaffold the basics.


==================================================
9. OVERRIDES & NOTES
==================================================

Overrides to the global master instructions (if any):
- {{e.g., “This repo is legacy, using Next.js Pages Router. Do NOT migrate unless explicitly asked.”}}
- {{e.g., “This repo uses plain CSS; do NOT introduce Tailwind without approval.”}}

Additional notes:
- {{Any quirks, legacy decisions, or business rules Copilot should know about.}}

End of project-specific instructions.
