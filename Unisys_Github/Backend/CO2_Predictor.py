# test_lstm.py
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import joblib
import matplotlib.pyplot as plt

# =============================================
# 1. Load Pretrained LSTM Model and Scaler
# =============================================
model_path = "weekly_co2_lstm.h5"
scaler_path = "weekly_co2_scaler.save"

lstm_model = load_model(model_path)
scaler = joblib.load(scaler_path)

# =============================================
# 2. Load and Preprocess New Data
# =============================================
def preprocess_new_data(filepath):
    # Load and prepare data
    data = pd.read_csv(filepath, parse_dates=['timestamp'])
    data.set_index('timestamp', inplace=True)

    # Resample to hourly (matches training setup)
    hourly_data = data.resample('h').mean()

    # Feature engineering (same as training)
    hourly_data['hour'] = hourly_data.index.hour
    hourly_data['day_of_week'] = hourly_data.index.dayofweek
    hourly_data['week_sin'] = np.sin(2 * np.pi * hourly_data['day_of_week'] / 7)
    hourly_data['week_cos'] = np.cos(2 * np.pi * hourly_data['day_of_week'] / 7)
    hourly_data['time_sin'] = np.sin(2 * np.pi * hourly_data['hour'] / 24)
    hourly_data['time_cos'] = np.cos(2 * np.pi * hourly_data['hour'] / 24)

    # Select features (order matters!)
    features = ['co2_ppm', 'temperature_c', 'humidity_pct',
                'time_sin', 'time_cos', 'week_sin', 'week_cos']

    # Scale using original scaler
    scaled_data = scaler.transform(hourly_data[features])

    return scaled_data, hourly_data, features  # Now returns hourly_data for timestamps

# Preprocess your generated data
X_new, hourly_data, features = preprocess_new_data("industrial.csv")

# =============================================
# 3. Create Sequences for Prediction
# =============================================
SEQ_LENGTH = 168  # Same as training

def create_sequences(data, seq_length):
    X = []
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
    return np.array(X)

X_sequences = create_sequences(X_new, SEQ_LENGTH)

# =============================================
# 4. Make Predictions and Evaluate
# =============================================
def inverse_scale(y_scaled, feature_index=0):
    dummy = np.zeros((len(y_scaled), len(features)))
    dummy[:, feature_index] = y_scaled.flatten()
    return scaler.inverse_transform(dummy)[:, feature_index]

# Predict
y_pred_scaled = lstm_model.predict(X_sequences)

# Get actual values (last element of each sequence)
y_actual_scaled = X_new[SEQ_LENGTH:, 0]  # CO2 is first feature

# Inverse scaling
y_pred = inverse_scale(y_pred_scaled)
y_actual = inverse_scale(y_actual_scaled.reshape(-1, 1))

# Calculate metrics
mae = np.mean(np.abs(y_pred - y_actual))
mse = np.mean((y_pred - y_actual) ** 2)
print(f"\nTest Metrics:")
print(f"MAE: {mae:.2f} ppm")
print(f"MSE: {mse:.2f}")

# =============================================
# 5. Create Prediction Output DataFrame
# =============================================
# Get corresponding timestamps (shifted by sequence length)
prediction_timestamps = hourly_data.index[SEQ_LENGTH:SEQ_LENGTH + len(y_pred)]

results_df = pd.DataFrame({
    'timestamp': prediction_timestamps,
    'Actual_CO2': y_actual,
    'Predicted_CO2': y_pred,
    'Absolute_Error': np.abs(y_pred - y_actual)
})

# Save predictions to CSV
results_df.to_csv('co2_predictions.csv', index=False)
print("\nFirst 5 predictions:")
print(results_df.head().to_string(index=False))

# =============================================
# 6. Visualize Results
# =============================================
plt.figure(figsize=(14, 6))
plt.plot(results_df['timestamp'], results_df['Actual_CO2'],
        label='Actual CO2', alpha=0.7, marker='o', markersize=4)
plt.plot(results_df['timestamp'], results_df['Predicted_CO2'],
        label='Predicted CO2', linestyle='--', marker='x', markersize=4)
plt.title(f"CO2 Prediction Results (MAE: {mae:.1f} ppm)")
plt.ylabel('CO2 Concentration (ppm)')
plt.xlabel('Date and Time')
plt.legend()
plt.grid(True)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('co2_prediction_visualization.png', dpi=300, bbox_inches='tight')
plt.show()