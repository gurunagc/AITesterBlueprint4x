# SOP — Deliver Test Plan

## Purpose
Write the generated test plan to Markdown and JSON files in `.tmp/`.

## Inputs
- `plan`: `TestPlan` dataclass.
- `output_dir`: defaults to `.tmp`.

## Logic
1. Create output dir if missing (`Path.mkdir(parents=True, exist_ok=True)`).
2. Render Markdown via `to_markdown(plan)`.
3. Render JSON via `to_json(plan)`.
4. Write `output.md` and `output.json`.

## Output
Dict `{"markdown": path, "json": path}`.

## Edge Cases
- `.tmp/` does not exist → created.
- Write permission error → unhandled (caller should catch).
