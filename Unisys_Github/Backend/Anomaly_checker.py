# test_autoencoder_anomalies.py
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import joblib
import matplotlib.pyplot as plt


def test_autoencoder_anomalies(new_data_path):
    # =============================================
    # 1. Load Pretrained Model and Scaler
    # =============================================
    model_path = "co2_anomaly_detector.h5"
    scaler_path = "co2_anomaly_scaler.save"

    autoencoder = load_model(model_path)
    scaler = joblib.load(scaler_path)

    # =============================================
    # 2. Load and Preprocess New Data
    # =============================================
    def preprocess_new_data(filepath):
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

        return scaled_data, hourly_data, features

    # Preprocess data
    X_new, hourly_data, features = preprocess_new_data(new_data_path)

    # =============================================
    # 3. Create Sequences for Autoencoder
    # =============================================
    SEQ_LENGTH = 24  # Must match training sequence length

    def create_sequences(data, seq_length):
        sequences = []
        for i in range(len(data) - seq_length + 1):
            sequences.append(data[i:i + seq_length])
        return np.array(sequences)

    X_sequences = create_sequences(X_new, SEQ_LENGTH)

    # =============================================
    # 4. Detect Anomalies
    # =============================================
    def detect_anomalies(autoencoder, data, threshold_multiplier=2):
        reconstructions = autoencoder.predict(data)

        # Calculate MSE for each sequence
        mse = np.mean(np.power(data - reconstructions, 2), axis=(1, 2))

        # Calculate threshold (mean + multiplier * std)
        threshold = np.mean(mse) + threshold_multiplier * np.std(mse)

        anomalies = mse > threshold
        return anomalies, mse, threshold

    # Detect anomalies with 2σ threshold
    anomalies, mse, threshold = detect_anomalies(autoencoder, X_sequences)

    # =============================================
    # 5. Visualize Results
    # =============================================
    def plot_anomalies(mse, threshold, hourly_data, seq_length):
        # Prepare timestamps (skip the first seq_length-1 points)
        timestamps = hourly_data.index[seq_length - 1:]
        min_len = min(len(mse), len(timestamps))
        timestamps = timestamps[-min_len:]
        mse = mse[-min_len:]

        plt.figure(figsize=(14, 6))
        plt.plot(timestamps, mse, label='Reconstruction Error')
        plt.axhline(y=threshold, color='r', linestyle='--', label='Threshold')

        # Mark anomalies
        anomaly_indices = np.where(mse > threshold)[0]
        plt.scatter(timestamps[anomaly_indices], mse[anomaly_indices],
                    color='red', label='Anomalies')

        plt.xlabel('Time')
        plt.ylabel('Reconstruction Error (MSE)')
        plt.title(f'Anomaly Detection Results (Threshold: {threshold:.2f})')
        plt.legend()
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

    # Generate plots
    plot_anomalies(mse, threshold, hourly_data, SEQ_LENGTH)

    # =============================================
    # 6. Generate Anomaly Report
    # =============================================
    anomaly_timestamps = hourly_data.index[SEQ_LENGTH - 1:][anomalies]

    print(f"\nAnomaly Detection Report:")
    print(f"Total sequences analyzed: {len(X_sequences)}")
    print(f"Anomalous sequences detected: {sum(anomalies)} ({sum(anomalies) / len(anomalies) * 100:.1f}%)")
    print(f"Threshold MSE: {threshold:.4f}")
    print("\nAnomaly Timestamps:")
    print(anomaly_timestamps.to_frame(name='Anomaly Time'))

    return {
        'anomalies': anomalies,
        'mse_scores': mse,
        'threshold': threshold,
        'timestamps': hourly_data.index[SEQ_LENGTH - 1:]
    }


if __name__ == "__main__":
    # Test with generated data
    results = test_autoencoder_anomalies("industrial.csv")