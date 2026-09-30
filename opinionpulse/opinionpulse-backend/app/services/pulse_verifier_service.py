"""Lightweight claim verification pass for Pulse AI (Deep mode)."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

PERCENT_RE = re.compile(r"(\d{1,3})\s*%")


def _extract_sentiment_from_evidence(bundle: dict[str, Any]) -> dict[str, int]:
    op = bundle.get("opinionpulse") or {}
    sentiment = op.get("sentiment") or {}
    return {
        "positive": int(sentiment.get("positive") or 0),
        "negative": int(sentiment.get("negative") or 0),
        "neutral": int(sentiment.get("neutral") or 0),
    }


def verify_answer_against_evidence(
    answer: str,
    bundle: dict[str, Any],
) -> dict[str, Any]:
    """Rule-based verifier — flags obvious stat mismatches without extra LLM call."""
    issues: list[dict[str, str]] = []
    evidence_sent = _extract_sentiment_from_evidence(bundle)
    total_evidence = sum(evidence_sent.values())

    if total_evidence == 0:
        pct_claims = PERCENT_RE.findall(answer)
        if pct_claims and any(int(p) > 5 for p in pct_claims):
            issues.append(
                {
                    "claim": "Numeric sentiment percentages in answer",
                    "reason": "No OpinionPulse sentiment data was retrieved.",
                }
            )

    for label, key in (("positive", "positive"), ("negative", "negative"), ("neutral", "neutral")):
        expected = evidence_sent.get(key, 0)
        if expected <= 0:
            continue
        for match in PERCENT_RE.finditer(answer):
            val = int(match.group(1))
            context = answer[max(0, match.start() - 40) : match.end() + 20].lower()
            if label in context and abs(val - expected) > 12:
                issues.append(
                    {
                        "claim": f"{val}% {label}",
                        "reason": f"Evidence reports {expected}% {label}.",
                    }
                )
                break

    opinion_as_fact = re.search(
        r"\b(is|are)\s+(bad|good|terrible|awful|great|the best|the worst)\b",
        answer,
        re.I,
    )
    if opinion_as_fact and total_evidence > 0:
        if "sampled" not in answer.lower() and "public opinion" not in answer.lower():
            issues.append(
                {
                    "claim": opinion_as_fact.group(0),
                    "reason": "Frame subjective judgment as public opinion signal, not objective fact.",
                }
            )

    return {"valid": len(issues) == 0, "issues": issues}


def build_verifier_revision_prompt(
    answer: str,
    verification: dict[str, Any],
    evidence_text: str,
) -> str:
    issues_json = json.dumps(verification.get("issues") or [], indent=2)
    return (
        f"Revise this answer to fix verification issues.\n\n"
        f"ISSUES:\n{issues_json}\n\n"
        f"ORIGINAL ANSWER:\n{answer}\n\n"
        f"{evidence_text}\n\n"
        "Return only the corrected answer. Do not invent new statistics."
    )
