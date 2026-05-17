import os
import numpy as np
import onnxruntime as ort
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.onnx")

def _get_mode_encoded(mode: str) -> int:
    mapping = {"QR": 0, "BLE": 1, "SOUND": 2, "LIGHT": 3, "NFC": 4}
    return mapping.get(mode.upper(), 0)

def evaluate_transaction(
    amount: float,
    mode: str,
    timestamp: datetime,
) -> dict:
    """
    Evaluates transaction risk using an ML ONNX model.
    Falls back to simple heuristics if the model file is not present.
    """
    if os.path.exists(MODEL_PATH):
        try:
            # 1. Prepare Features
            hour = timestamp.hour
            mode_enc = _get_mode_encoded(mode)
            
            # Input shape must match what we defined in skl2onnx: float_input of shape [1, 3]
            input_data = np.array([[amount, mode_enc, hour]], dtype=np.float32)
            
            # 2. Run Inference
            session = ort.InferenceSession(MODEL_PATH)
            input_name = session.get_inputs()[0].name
            # RandomForestClassifier in skl2onnx returns (label, probabilities_dict)
            output = session.run(None, {input_name: input_data})
            
            # Extract probability of class 1 (Fraud)
            # The probability output is a list of dictionaries, e.g., [{0: 0.1, 1: 0.9}]
            probabilities = output[1]
            risk_score = float(probabilities[0][1])
            
            # 3. Decision Logic
            if risk_score >= 0.70:
                decision = "block"
            elif risk_score >= 0.35:
                decision = "review"
            else:
                decision = "approve"
                
            return {
                "risk_score": round(risk_score, 4),
                "decision": decision,
            }
            
        except Exception as e:
            print(f"ONNX Model failed, falling back to heuristics: {e}")

    # Fallback Heuristics
    risk_score: float = 0.05
    if amount > 50000:
        risk_score = 0.75
    elif amount > 20000:
        risk_score = 0.40
    elif mode.upper() in ("SOUND", "LIGHT"):
        risk_score = 0.20

    if risk_score >= 0.70:
        decision = "block"
    elif risk_score >= 0.35:
        decision = "review"
    else:
        decision = "approve"

    return {
        "risk_score": round(risk_score, 4),
        "decision": decision,
    }