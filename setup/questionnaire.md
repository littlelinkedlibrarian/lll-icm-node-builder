# Builder setup questionnaire

Ask all questions in one pass. These configure the reusable builder, not one node.

1. How should implementation usually be divided: skeleton only, learner-led pair build, agent-led pair build, or complete build with review? Default: agent-led pair build.
2. Which languages, frameworks, datastores, hosts, or tools should be preferred or avoided? Default: decide per project.
3. Should projects default to independent own-domain apps, standalone LLL-compatible nodes, or ask every run? Default: ask every run.
4. When AI is selected, should OpenAI models be required exclusively? Default: yes.
5. Rank learning depth, delivery speed, operating cost, privacy, and production rigor. Default: learning depth, maintainability, privacy, speed, cost.
6. How often should the agent pause beyond stage approvals? Default: after each vertical slice and before infrastructure.
7. What evidence is mandatory before completion? Default: clean setup, automated tests, observed user journey, secret scan, and recovery instructions.
8. Who owns code, deployment accounts, domains, OpenAI usage, and stored data? Default: learner or their organization.
9. Which accessibility, privacy, licensing, branding, or educational rules apply to every project? Default: accessible UI, least data, explicit consent, owner-selected license.
10. What should the builder call its owner? Default: Learner.

After answers, populate `_config/builder-profile.md`, show it for approval, and verify no placeholders remain.
