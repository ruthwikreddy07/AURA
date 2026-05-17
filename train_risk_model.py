import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# 1. Generate Synthetic Data
np.random.seed(42)
n_samples = 5000

# Features: amount, mode_encoded, hour_of_day
# mode mapping: 0: QR, 1: BLE, 2: SOUND, 3: LIGHT, 4: NFC
amounts = np.random.exponential(scale=5000, size=n_samples)
modes = np.random.randint(0, 5, size=n_samples)
hours = np.random.randint(0, 24, size=n_samples)

# Labels (0 = Safe, 1 = Fraud)
# Fraud logic: extremely high amounts, or high amounts during late night, or unusual modes for high amounts
labels = np.zeros(n_samples, dtype=int)

for i in range(n_samples):
    risk_points = 0
    if amounts[i] > 20000:
        risk_points += 1
    if amounts[i] > 50000:
        risk_points += 2
    if 1 <= hours[i] <= 5:
        risk_points += 1
    if modes[i] in [2, 3]: # Sound or Light (more experimental, higher baseline risk)
        risk_points += 1
        
    if risk_points >= 3:
        labels[i] = 1 # Fraud/High Risk

X = np.column_stack((amounts, modes, hours)).astype(np.float32)
y = labels

# 2. Train Model
model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
model.fit(X, y)

# 3. Convert to ONNX
# The input will be a float tensor with 3 features
initial_type = [('float_input', FloatTensorType([None, 3]))]
onnx_model = convert_sklearn(model, initial_types=initial_type)

# 4. Save ONNX Model
output_path = "backend/app/ai/risk_model.onnx"
with open(output_path, "wb") as f:
    f.write(onnx_model.SerializeToString())

print(f"✅ ONNX Model successfully trained and saved to {output_path}")
print(f"Total samples: {n_samples}, Fraud cases: {sum(y)}")
