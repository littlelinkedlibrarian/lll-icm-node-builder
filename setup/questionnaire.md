# Builder setup questionnaire

Ask all questions in one pass. These configure the reusable builder, not one node.

1. How should implementation usually be divided: skeleton only, learner-led pair build, agent-led pair build, or complete build with review? Default: agent-led pair build.
2. Which languages, frameworks, datastores, hosts, or tools should be preferred or avoided? Default: decide per project.
3. Should projects default to independent own-domain, standalone LLL-compatible, hybrid own-domain plus LLL, LLL-hosted, or ask every run? Default: ask every run.
4. When AI is selected, should OpenAI models be required exclusively? Default: yes.
5. Rank learning depth, delivery speed, operating cost, privacy, and production rigor. Default: learning depth, maintainability, privacy, speed, cost.
6. How often should the agent pause beyond stage approvals? Default: after each vertical slice and before infrastructure.
7. What evidence is mandatory before completion? Default: clean setup, automated tests, observed user journey, secret scan, and recovery instructions.
8. Who owns code, deployment accounts, domain or delegated subdomain, DNS, TLS, OpenAI usage, backups, exports, and stored data? Default: learner or their organization; record every LLL-hosted exception.
9. Which accessibility, privacy, licensing, branding, or educational rules apply to every project? Default: accessible UI, least data, explicit consent, owner-selected license.
10. What should the builder call its owner? Default: Learner.
11. Should book scanning accept one cover only, several shelf spines as a review batch, or ask each run? Default: both single-cover and bounded multi-book batches.
12. Should the node support box-scoped “Assorted Things” such as puzzles, note cards, art, and trinkets: omit them, keep them private, or publish human-confirmed items inside each box? Default: photo capture and human-authored metadata with no object-recognition call; only confirmed items are public.
13. Should books and Assorted Things share a destination-first scanner selector while retaining separate entities, prompts, review states, and routes? Default: yes.

After answers, populate `_config/builder-profile.md`, show it for approval, and verify no placeholders remain.
