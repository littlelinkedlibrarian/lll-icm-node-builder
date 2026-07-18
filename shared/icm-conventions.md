# ICM conventions

Canonical methodology: Jake Van Clief and David McDermott's Interpretable Context Methodology and Model Workspace Protocol.

## Five layers

1. `AGENTS.md`: global identity and map
2. root `CONTEXT.md`: task router
3. stage `CONTEXT.md`: Inputs, Process, Outputs contract
4. `_config/` and `shared/`: stable references
5. stage `output/`: per-run artifacts

## Rules

- One stage performs one job.
- Plain text is the interface.
- Every stage has an `output/` handoff.
- Outputs are human edit surfaces.
- Inputs tables name exact files and sections.
- References point one way.
- Every rule has one canonical source.
- `CONTEXT.md` routes and does not duplicate reference content.
- Stable references are the factory. Outputs are the product.
- Configure the factory once.
- Use checkpoints for judgment and audits for pass/fail quality.
- Use deterministic tools for mechanical operations.

## Guardrails

- Stage `CONTEXT.md` files stay under 80 lines.
- Reference files stay under 200 lines or are split.
- Empty output folders retain `.gitkeep`.
- Previous outputs are handoffs, not templates.
- Trace bad output to the earliest source instruction or handoff that caused it.

## Sources

- https://arxiv.org/abs/2603.16021
- https://github.com/RinDig/Interpreted-Context-Methdology
