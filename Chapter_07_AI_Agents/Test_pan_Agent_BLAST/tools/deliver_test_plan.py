"""Deliver a test plan to Markdown + JSON output files.

BLAST Phase 4 (Stylize) — formatting and delivery.
"""
from __future__ import annotations

import os
from pathlib import Path

from .generate_test_plan import TestPlan, to_json, to_markdown


def deliver(plan: TestPlan, output_dir: str = ".tmp") -> dict[str, str]:
    """Write test plan to Markdown and JSON files.

    Args:
        plan: The completed test plan.
        output_dir: Directory for output files (created if missing).

    Returns:
        Dict with paths to the written files.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    md_path = out / "output.md"
    json_path = out / "output.json"

    md_content = to_markdown(plan)
    json_content = to_json(plan)

    md_path.write_text(md_content, encoding="utf-8")
    json_path.write_text(json_content, encoding="utf-8")

    return {"markdown": str(md_path), "json": str(json_path)}
