"""Pulse AI orchestrator — router → tools → evidence → answer → verify."""

from __future__ import annotations

import logging
from typing import Any

from app.services.pulse_evidence_service import (
    build_evidence_bundle,
    compute_analysis_confidence,
    format_evidence_for_llm,
)
from app.services.pulse_grounding import PULSE_ANSWER_STRUCTURE, PULSE_GROUNDING_RULES
from app.services.pulse_router_service import RouterDecision, route_pulse_query
from app.services.pulse_tools_service import execute_pulse_tools
from app.services.pulse_verifier_service import (
    build_verifier_revision_prompt,
    verify_answer_against_evidence,
)
from app.services.chat_cited_service import (
    build_cited_system_prompt,
    extract_cited_sources,
    generate_followup_suggestions,
)
from app.services.chat_research_service import (
    build_references,
    build_research_context_for_llm,
    build_research_steps,
    format_research_markdown,
    validate_research_structured,
)
from app.services.chat_service import (
    SYSTEM_PROMPT,
    _response_format_hint,
    _max_tokens_for_kind,
    _should_use_research_mode,
    call_ai_provider,
    classify_question,
    clean_response_text,
    extract_search_query,
    extract_suggestions,
    extract_structured_payload,
)

logger = logging.getLogger(__name__)

PULSE_AGENT_PROMPT = f"""You are Pulse AI — the intelligence assistant for OpinionPulse.

{PULSE_GROUNDING_RULES}

{PULSE_ANSWER_STRUCTURE}

When an EVIDENCE BUNDLE is provided:
- Use ONLY numbers from the bundle for statistics.
- Cite representative mentions as [N] using citation_number.
- End with a one-line analysis confidence summary from the bundle.
- If data is insufficient, say so clearly.
"""


async def collect_pulse_evidence(
    message: str,
    *,
    live_sources: bool = True,
    deep_mode: bool = False,
) -> tuple[RouterDecision, dict[str, Any], dict[str, Any]]:
    """Route query and execute tools to build evidence bundle."""
    decision = route_pulse_query(
        message,
        live_sources=live_sources,
        deep_mode=deep_mode,
    )

    tool_results: dict[str, Any] = {
        "search_payload": None,
        "intelligence": None,
        "comparison": None,
        "web_results": [],
        "x_results": [],
        "errors": [],
    }

    if decision.tools:
        tool_results = await execute_pulse_tools(
            decision.tools,
            query=decision.query or extract_search_query(message),
            comparison_queries=decision.comparison_queries or None,
        )

    search_payload = tool_results.get("search_payload") or {}
    results = search_payload.get("results") or []
    wiki = search_payload.get("wiki")

    intelligence = tool_results.get("intelligence")
    if intelligence and search_payload.get("sentiment"):
        intelligence = dict(intelligence)
        intelligence["sentiment_summary"] = search_payload["sentiment"]
        intelligence["query"] = search_payload.get("query") or decision.query

    source_health: dict[str, str] = {}
    for platform in search_payload.get("platforms_searched") or []:
        source_health[str(platform)] = "available"
    if tool_results.get("web_results"):
        source_health["web"] = "available"
    elif decision.requires_current_web:
        source_health["web"] = "unavailable"
    if tool_results.get("x_results"):
        source_health["x"] = "available"
    elif decision.requires_x:
        source_health["x"] = "unavailable"

    bundle = build_evidence_bundle(
        question=message,
        router_intent=decision.intent,
        search_results=results,
        intelligence=intelligence,
        wiki_summary=wiki,
        web_results=tool_results.get("web_results"),
        x_results=tool_results.get("x_results"),
        comparison=tool_results.get("comparison"),
        source_health=source_health,
        tool_errors=tool_results.get("errors"),
    )

    return decision, bundle, tool_results


async def generate_pulse_answer(
    message: str,
    conversation_history: list[dict[str, str]],
    *,
    live_sources: bool = True,
    deep_mode: bool = False,
) -> dict[str, Any]:
    """Full Pulse AI pipeline with optional Deep verification."""
    decision, bundle, tool_results = await collect_pulse_evidence(
        message,
        live_sources=live_sources,
        deep_mode=deep_mode,
    )

    search_payload = tool_results.get("search_payload") or {}
    fetched_results: list[dict[str, Any]] = search_payload.get("results") or []
    sentiment_summary = search_payload.get("sentiment") or {}
    wiki_summary = search_payload.get("wiki")
    search_query = search_payload.get("query") or decision.query

    references: list[dict[str, Any]] = []
    cited_sources: list[dict[str, Any]] = []
    use_research = False
    use_cited_mode = False
    cited_live_results = fetched_results[:15]

    if fetched_results:
        references = build_references(fetched_results, limit=10)
        question_kind = classify_question(message)
        use_cited_mode = len(cited_live_results) >= 3 and not deep_mode
        use_research = (
            not use_cited_mode
            and deep_mode
            and _should_use_research_mode(question_kind, fetched_results)
            and bool(references)
        )

    evidence_text = format_evidence_for_llm(bundle)
    confidence = compute_analysis_confidence(bundle)

    messages_for_ai: list[dict[str, str]] = []
    for msg in conversation_history[-8:]:
        if msg.get("role") in ("user", "assistant"):
            messages_for_ai.append(
                {"role": msg["role"], "content": str(msg["content"])[:800]}
            )

    question_kind = decision.intent if decision.intent != "general" else classify_question(message)
    if use_cited_mode:
        question_kind = "cited"
    elif use_research or deep_mode:
        question_kind = "research" if deep_mode else question_kind

    format_hint = _response_format_hint(message, use_research=use_research or deep_mode)
    max_tokens = _max_tokens_for_kind("research" if deep_mode else question_kind)
    if deep_mode:
        max_tokens = min(max_tokens + 400, 1600)

    temperature = 0.1 if use_cited_mode or deep_mode else 0.35

    if use_cited_mode:
        system_prompt = build_cited_system_prompt(
            cited_live_results,
            search_query or extract_search_query(message) or message,
        )
        messages_for_ai.append({"role": "user", "content": message})
    else:
        system_prompt = f"{PULSE_AGENT_PROMPT}\n\n{SYSTEM_PROMPT}"
        if use_research and references:
            context_data = build_research_context_for_llm(
                search_query or extract_search_query(message),
                references,
                sentiment_summary,
                wiki_summary,
            )
            current_content = f"{context_data}\n\n{evidence_text}\n\n{format_hint}\n\nQuestion: {message}"
        else:
            current_content = f"{evidence_text}\n\n{format_hint}\n\nQuestion: {message}"
        messages_for_ai.append({"role": "user", "content": current_content})

    ai_response = await call_ai_provider(
        messages_for_ai,
        system_prompt,
        max_tokens=max_tokens,
        temperature=temperature,
    )

    if deep_mode and fetched_results:
        verification = verify_answer_against_evidence(ai_response, bundle)
        if not verification.get("valid"):
            logger.info("Pulse verifier flagged issues: %s", verification.get("issues"))
            revision_prompt = build_verifier_revision_prompt(
                ai_response, verification, evidence_text
            )
            messages_for_ai[-1] = {"role": "user", "content": revision_prompt}
            ai_response = await call_ai_provider(
                messages_for_ai,
                system_prompt,
                max_tokens=max_tokens,
                temperature=0.1,
            )

    if use_cited_mode:
        cited_sources = extract_cited_sources(ai_response, cited_live_results)
        suggestions = await generate_followup_suggestions(
            search_query or message, ai_response, cited_live_results
        )
        clean_response = clean_response_text(ai_response, response_format="cited")
        structured = None
    else:
        suggestions = extract_suggestions(ai_response)
        structured = extract_structured_payload(ai_response)
        clean_response = clean_response_text(ai_response, response_format=question_kind)

        conf_line = (
            f"\n\n---\n**{confidence['label']}** — {confidence['explanation']}"
        )
        if confidence.get("level") and conf_line not in clean_response:
            clean_response = clean_response.rstrip() + conf_line

    if (use_research or deep_mode) and references:
        topic = search_query or extract_search_query(message)
        if structured and structured.get("type") == "research_brief":
            structured = validate_research_structured(structured, len(references))
            if not structured.get("steps"):
                structured["steps"] = build_research_steps(
                    topic, len(fetched_results), len(references)
                )
            clean_response = format_research_markdown(structured)
        elif deep_mode and not use_cited_mode:
            structured = {
                "type": "research_brief",
                "title": f"{topic} — Pulse AI Analysis",
                "overview": clean_response,
                "steps": build_research_steps(topic, len(fetched_results), len(references)),
                "aspects": [],
            }

    return {
        "message": clean_response,
        "suggestions": suggestions,
        "response_format": question_kind,
        "structured": structured,
        "references": references if (use_research or deep_mode) else [],
        "cited_sources": cited_sources if use_cited_mode else [],
        "sources_fetched": len(cited_live_results) if use_cited_mode else len(fetched_results),
        "data_used": {
            "query": search_query,
            "results_count": len(fetched_results),
            "sentiment": sentiment_summary,
            "platforms": list(
                {r.get("platform", "") for r in fetched_results if r.get("platform")}
            ),
        },
        "wiki_summary": wiki_summary,
        "has_real_data": len(fetched_results) > 0,
        "intent": decision.intent,
        "analysis_confidence": confidence,
        "deep_mode": deep_mode,
        "live_sources": live_sources,
        "evidence_bundle_meta": {
            "tool_errors": tool_results.get("errors"),
            "source_health": bundle.get("source_health"),
        },
    }
