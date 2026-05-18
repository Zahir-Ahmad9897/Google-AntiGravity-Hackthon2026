from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = PROJECT_ROOT / "artifacts"


def _artifact_path(filename: str) -> Path:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    candidate = (ARTIFACT_DIR / filename).resolve()
    artifact_root = ARTIFACT_DIR.resolve()
    if artifact_root not in candidate.parents and candidate != artifact_root:
        raise ValueError(f"Artifact filename escapes artifact directory: {filename}")
    return candidate


def _json_default(value: Any) -> str:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _serialize_content(content: Any, suffix: str) -> str:
    if isinstance(content, BaseModel):
        content = content.model_dump(mode="json")
    if suffix.lower() == ".json":
        return json.dumps(content, indent=2, ensure_ascii=True, default=_json_default)
    if isinstance(content, str):
        return content
    return json.dumps(content, indent=2, ensure_ascii=True, default=_json_default)


def save_artifact(filename: str, content: Any) -> str:
    path = _artifact_path(filename)
    path.write_text(_serialize_content(content, path.suffix), encoding="utf-8")
    return str(path.relative_to(PROJECT_ROOT))


def read_artifact(filename: str) -> str:
    return _artifact_path(filename).read_text(encoding="utf-8")


def list_artifacts() -> list[dict[str, Any]]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    artifacts: list[dict[str, Any]] = []
    for path in sorted(ARTIFACT_DIR.iterdir(), key=lambda item: item.name):
        if path.is_file():
            artifacts.append(
                {
                    "filename": path.name,
                    "path": str(path.relative_to(PROJECT_ROOT)),
                    "size_bytes": path.stat().st_size,
                    "modified_utc": path.stat().st_mtime,
                }
            )
    return artifacts
