"""Weekly brand reputation report — HTML export from real pulse + crisis data."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db.models import CrisisEvent, PulseBucket, SavedSearch, User
from app.services.brand_watch_service import parse_watch_meta, spike_summary, watch_display_name


def _bucket_stats(buckets: list[PulseBucket]) -> dict:
    if not buckets:
        return {
            "total_mentions": 0,
            "total_negative": 0,
            "avg_negative_pct": 0.0,
            "peak_quadrant": "quiet",
        }
    total = sum(b.mention_count for b in buckets)
    neg = sum(b.negative_count for b in buckets)
    quadrants = [b.quadrant for b in buckets]
    peak = "crisis" if "crisis" in quadrants else "watch" if "watch" in quadrants else "quiet"
    return {
        "total_mentions": total,
        "total_negative": neg,
        "avg_negative_pct": round(neg / total * 100, 1) if total else 0.0,
        "peak_quadrant": peak,
    }


def build_weekly_report_html(
    db: Session,
    *,
    user: User,
    watch: SavedSearch,
    days: int = 7,
) -> str:
    meta = parse_watch_meta(watch)
    name = watch_display_name(watch, meta)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    buckets = (
        db.query(PulseBucket)
        .filter(
            PulseBucket.saved_search_id == watch.id,
            PulseBucket.bucket_start >= since,
        )
        .order_by(PulseBucket.bucket_start.asc())
        .all()
    )
    events = (
        db.query(CrisisEvent)
        .filter(
            CrisisEvent.saved_search_id == watch.id,
            CrisisEvent.created_at >= since,
        )
        .order_by(CrisisEvent.created_at.desc())
        .limit(10)
        .all()
    )

    stats = _bucket_stats(buckets)
    latest = buckets[-1] if buckets else None
    spike = spike_summary(
        current_negative=latest.negative_count if latest else 0,
        baseline_negative=(
            sum(b.negative_count for b in buckets[:-1]) / max(len(buckets) - 1, 1)
            if len(buckets) > 1
            else 0.5
        ),
        current_mentions=latest.mention_count if latest else 0,
        baseline_mentions=(
            sum(b.mention_count for b in buckets[:-1]) / max(len(buckets) - 1, 1)
            if len(buckets) > 1
            else 1.0
        ),
    )

    event_rows = ""
    for ev in events:
        event_rows += f"""
        <tr>
          <td>{ev.created_at.strftime('%Y-%m-%d %H:%M')}</td>
          <td>{ev.quadrant.upper()}</td>
          <td>{ev.status_label}</td>
          <td>{(ev.summary or '')[:120]}</td>
        </tr>"""

    narratives_html = ""
    if events and events[0].narratives_json:
        for n in (events[0].narratives_json.get("items") or [])[:5]:
            narratives_html += f"<li><strong>{n.get('label', 'Theme')}</strong> — {n.get('summary', '')}</li>"

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    period = f"{since.strftime('%b %d')} – {datetime.now(timezone.utc).strftime('%b %d, %Y')}"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Weekly Reputation Report — {name}</title>
  <style>
    body {{ font-family: Georgia, 'Times New Roman', serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #111; }}
    h1 {{ font-size: 28px; margin-bottom: 4px; }}
    .meta {{ color: #666; font-size: 14px; margin-bottom: 32px; }}
    h2 {{ font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 28px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
    th {{ background: #f5f5f5; }}
    .stat-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }}
    .stat {{ background: #f9f9f9; border: 1px solid #eee; padding: 14px; border-radius: 8px; }}
    .stat strong {{ display: block; font-size: 22px; }}
    .spike {{ background: #fef2f2; border-color: #fecaca; padding: 12px; border-radius: 8px; margin: 16px 0; }}
    ul {{ padding-left: 20px; line-height: 1.6; }}
    @media print {{ body {{ margin: 20px; }} }}
  </style>
</head>
<body>
  <h1>Weekly Reputation Report</h1>
  <p class="meta">{name} · {period}<br/>Prepared for {user.email} · Generated {generated}</p>

  <div class="spike"><strong>{spike['spike_label']}</strong><br/>
  Baseline: {spike['baseline_negative_30m']} negative mentions / 30 min avg ·
  Current window: {latest.negative_count if latest else 0} negative
  ({spike['negative_spike_multiplier']}× baseline)</div>

  <h2>Summary</h2>
  <div class="stat-grid">
    <div class="stat"><span>Total mentions ({days}d)</span><strong>{stats['total_mentions']}</strong></div>
    <div class="stat"><span>Negative mentions</span><strong>{stats['total_negative']}</strong></div>
    <div class="stat"><span>Avg negative %</span><strong>{stats['avg_negative_pct']}%</strong></div>
    <div class="stat"><span>Peak alert level</span><strong>{stats['peak_quadrant'].upper()}</strong></div>
  </div>

  <h2>What was said</h2>
  <ul>{narratives_html or '<li>No narrative clusters recorded this period.</li>'}</ul>

  <h2>Alert events</h2>
  <table>
    <thead><tr><th>When</th><th>Level</th><th>Status</th><th>Summary</th></tr></thead>
    <tbody>{event_rows or '<tr><td colspan="4">No crisis events this period.</td></tr>'}</tbody>
  </table>

  <p class="meta" style="margin-top:40px;">OpinionPulse · Live opinion data · Not legal or financial advice</p>
</body>
</html>"""
