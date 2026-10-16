"""Local resume parser: PDF via pdfplumber, DOCX via python-docx.

This is the deterministic fallback that always works with no network calls.
The AI port may supersede it when AI_MODE=remote, but this file must remain
functional on its own.
"""
from __future__ import annotations

import io
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# ---------- text extraction ----------

def extract_text(data: bytes, content_type: str) -> str:
    """Extract plain text from a PDF or DOCX byte buffer.

    Raises ValueError for unsupported content types.
    """
    ct = (content_type or "").lower()
    if "pdf" in ct or data[:4] == b"%PDF":
        return _extract_pdf(data)
    if "officedocument.wordprocessingml" in ct or data[:2] == b"PK":
        return _extract_docx(data)
    raise ValueError(f"Unsupported content type for parsing: {content_type}")


def _extract_pdf(data: bytes) -> str:
    import pdfplumber

    pages: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    return "\n".join(pages).strip()


def _extract_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs]
    return "\n".join(paragraphs).strip()


# ---------- experience extraction ----------

_DATE_RANGE_RE = re.compile(
    r"(?P<start>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\d{4})"
    r"\s*[-–—to]+\s*"
    r"(?P<end>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\d{4}|Present|Current)",
    re.IGNORECASE,
)


def extract_experience(text: str) -> list[dict[str, Any]]:
    """Very small heuristic: find date ranges and pull the surrounding lines.

    This is intentionally simple — the remote AI adapter can replace it.
    """
    if not text:
        return []
    results: list[dict[str, Any]] = []
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for i, line in enumerate(lines):
        m = _DATE_RANGE_RE.search(line)
        if not m:
            continue
        # Look back at up to two lines for a company/title hint
        context_start = max(0, i - 2)
        context = lines[context_start:i + 1]
        title = context[0] if len(context) >= 1 else None
        company = context[1] if len(context) >= 2 else None
        results.append(
            {
                "title": title,
                "company": company,
                "start": m.group("start"),
                "end": m.group("end"),
            }
        )
    return results