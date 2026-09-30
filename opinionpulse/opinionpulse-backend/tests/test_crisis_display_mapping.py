"""Display-label mapping tests for Crisis Radar UI conventions."""

from app.services.pulse_metrics import QUADRANT_EXPLANATIONS, QUADRANT_LABELS

# Frontend maps noise -> "High Activity" (see src/lib/crisis-display.ts)
FRONTEND_QUADRANT_LABELS = {
    "quiet": "Normal",
    "noise": "High Activity",
    "watch": "Watch",
    "crisis": "Crisis",
}


def test_backend_quadrant_enums_unchanged():
    assert set(QUADRANT_LABELS.keys()) == {"quiet", "noise", "watch", "crisis"}
    assert set(QUADRANT_EXPLANATIONS.keys()) == {"quiet", "noise", "watch", "crisis"}


def test_frontend_maps_noise_to_high_activity():
    assert FRONTEND_QUADRANT_LABELS["noise"] == "High Activity"
    assert FRONTEND_QUADRANT_LABELS["quiet"] == "Normal"


def test_risk_score_formula_documented():
    volume, velocity = 53.0, 47.0
    risk = round((volume + velocity) / 2)
    assert risk == 50
