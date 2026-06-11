"""Keyword-based sentiment scoring for search results."""

from __future__ import annotations

POSITIVE_WORDS = frozenset(
    {
        "good", "great", "excellent", "amazing", "awesome", "fantastic", "love",
        "best", "incredible", "outstanding", "brilliant", "perfect", "happy",
        "excited", "growth", "profit", "win", "success", "bullish", "rise",
        "gain", "positive", "strong", "boom", "surge", "innovation",
        "revolutionary", "promising", "optimistic", "support", "milestone",
        "record", "adoption", "trusted", "secure", "future", "hope", "wonderful",
        "superb", "impressive", "leading", "thriving", "recovering", "opportunity",
        "potential", "advance", "breakthrough", "powerful", "effective", "reliable",
        "robust", "celebrated", "praised", "approved", "endorsed", "recommended",
        "popular", "viral", "trending", "historic", "landmark", "triumphant",
        "confident", "exciting",
    }
)

NEGATIVE_WORDS = frozenset(
    {
        "bad", "terrible", "awful", "horrible", "worst", "hate", "scam", "fraud",
        "crash", "fail", "failure", "loss", "bearish", "down", "drop", "fall",
        "decline", "negative", "weak", "bust", "collapse", "risk", "danger",
        "problem", "issue", "concern", "worried", "fear", "panic", "bubble",
        "volatile", "unstable", "ban", "illegal", "hack", "stolen", "lost",
        "debt", "crisis", "warning", "threat", "dump", "corrupt", "broken",
        "disaster", "catastrophe", "emergency", "alarm", "shocking", "outrage",
        "controversial", "scandal", "accused", "arrested", "charged", "guilty",
        "banned", "censored", "blocked", "suspended", "fired", "resigned",
        "failed", "rejected", "denied", "opposed", "attacked", "criticized",
        "condemned",
    }
)

INTENSIFIERS = frozenset(
    {
        "very", "extremely", "absolutely", "completely", "totally", "highly",
        "massively", "incredibly", "exceptionally", "remarkably", "deeply",
    }
)

NEGATORS = frozenset({"not", "no", "never", "without"})


def analyze_sentiment(text: str) -> dict:
    if not text or len(text.strip()) < 3:
        return {"sentiment": "neutral", "score": 0.0}

    words = (
        text.lower()
        .replace("n't", " not ")
        .replace("'", " ")
    )
    words = "".join(c if c.isalpha() or c.isspace() else " " for c in words).split()
    words = [w for w in words if len(w) > 1]

    positive_count = 0.0
    negative_count = 0.0
    multiplier = 1.0

    for i, word in enumerate(words):
        if word in INTENSIFIERS:
            multiplier = 1.5
            continue

        prev = words[i - 1] if i > 0 else ""
        is_negated = prev in NEGATORS or prev.endswith("nt")

        if word in POSITIVE_WORDS:
            if is_negated:
                negative_count += multiplier
            else:
                positive_count += multiplier
        elif word in NEGATIVE_WORDS:
            if is_negated:
                positive_count += multiplier
            else:
                negative_count += multiplier

        multiplier = 1.0

    total = positive_count + negative_count
    if total == 0:
        return {"sentiment": "neutral", "score": 0.0}

    score = (positive_count - negative_count) / total

    if score > 0.15:
        return {"sentiment": "positive", "score": round(float(score), 2)}
    if score < -0.15:
        return {"sentiment": "negative", "score": round(float(score), 2)}
    return {"sentiment": "neutral", "score": round(float(score), 2)}


def calculate_sentiment_summary(results: list[dict]) -> dict:
    total = len(results)
    if total == 0:
        return {"positive": 0, "negative": 0, "neutral": 100}

    positive = sum(1 for r in results if r.get("sentiment") == "positive")
    negative = sum(1 for r in results if r.get("sentiment") == "negative")
    neutral = sum(1 for r in results if r.get("sentiment") == "neutral")

    return {
        "positive": round((positive / total) * 100),
        "negative": round((negative / total) * 100),
        "neutral": round((neutral / total) * 100),
    }


def apply_sentiment_to_results(results: list[dict]) -> list[dict]:
    out = []
    for row in results:
        item = dict(row)
        text = f"{item.get('title', '')} {item.get('content', '')}".strip()
        analysis = analyze_sentiment(text)
        item["sentiment"] = analysis["sentiment"]
        item["sentiment_score"] = analysis["score"]
        out.append(item)
    return out


def calculate_sentiment_forecast(results: list[dict]) -> list[dict]:
    # A simple forecasting algorithm based on the velocity of recent sentiment
    from datetime import datetime, timedelta, timezone
    from dateutil.parser import parse
    
    if not results:
        return []
    
    # Sort results by time
    valid_results = []
    for r in results:
        if r.get("posted_at"):
            try:
                dt = parse(r["posted_at"])
                valid_results.append((dt, r.get("sentiment_score", 0.0)))
            except Exception:
                pass

    if len(valid_results) < 5:
        # Not enough data, return flat forecast
        base_score = 0.5
        base_vol = 10
        velocity = 0.0
    else:
        valid_results.sort(key=lambda x: x[0])
        recent_half = valid_results[len(valid_results)//2:]
        older_half = valid_results[:len(valid_results)//2]
        
        recent_avg = sum(x[1] for x in recent_half) / len(recent_half)
        older_avg = sum(x[1] for x in older_half) / len(older_half)
        
        # Velocity is the difference between recent and older avg
        velocity = recent_avg - older_avg
        base_score = recent_avg
        base_vol = len(valid_results) // 7

    forecast = []
    now = datetime.now(timezone.utc)
    current_score = base_score
    
    for day in range(1, 8):
        future_date = now + timedelta(days=day)
        # Apply velocity, dampening it slightly over time to simulate mean reversion
        current_score += velocity * (0.8 ** day)
        
        # Clamp score between -1 and 1
        current_score = max(-1.0, min(1.0, current_score))
        
        # Determine label based on threshold
        if current_score > 0.15:
            sentiment_label = "positive"
        elif current_score < -0.15:
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"
            
        forecast.append({
            "date": future_date.strftime("%b %d"),
            "predicted_score": round(current_score, 2),
            "sentiment": sentiment_label,
            "estimated_volume": max(1, int(base_vol * (1.0 + current_score * 0.2)))
        })
        
    return forecast
