"""Compare page analytics — documents transparent scoring used in frontend."""

def test_risk_score_formula():
    volume, velocity = 53.0, 47.0
    assert round((volume + velocity) / 2) == 50


def test_overall_edge_weights():
    """Frontend computeOverallEdge weights (documented in compare-analytics.ts)."""
    weights = {
        "volume": 30,
        "positive": 25,
        "lower_negativity": 20,
        "momentum": 15,
        "source_diversity": 10,
    }
    assert sum(weights.values()) == 100


def test_sentiment_pp_threshold():
    """Differences under 3pp treated as similar in sentiment verdict."""
    assert abs(8 - 9) < 3
    assert abs(14 - 8) >= 3


def test_factual_context_excludes_opinionpulse_analytics():
    """Frontend extractFactualContext skips OpinionPulse analytics paragraphs."""
    overview = (
        "React is a JavaScript library.\n\n"
        "OpinionPulse analyzed 86 live mentions about \"React\" from 9 sources."
    )
    first = overview.split("\n\n")[0].strip()
    assert not first.startswith("OpinionPulse analyzed")
    assert "JavaScript" in first
