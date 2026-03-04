# app/ai/mode_scoring_engine.py

def score_modes(
    ble_available: bool,
    mic_available: bool,
    camera_available: bool,
    noise_level: float,
    light_level: float,
):
    """
    SECURITY: environment-aware mode scoring engine.
    Returns recommended mode and all available modes.
    """

    scores = {}

    # BLE scoring
    if ble_available:
        score = 80
        scores["ble"] = score

    # Sound scoring
    if mic_available:
        score = 70 - noise_level
        scores["sound"] = score

    # Light scoring
    if camera_available:
        score = 65 - light_level
        scores["light"] = score

    # QR scoring
    if camera_available:
        score = 60
        scores["qr"] = score

    # Filter negative scores
    scores = {k: v for k, v in scores.items() if v > 0}

    if not scores:
        raise ValueError("No communication modes available")

    # sort modes by score
    sorted_modes = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    recommended_mode = sorted_modes[0][0]

    # available modes
    available_modes = [mode for mode, score in sorted_modes if score > 20]

    return {
        "recommended_mode": recommended_mode,
        "available_modes": available_modes,
        "scores": scores,
    }