from flask import Flask, jsonify, send_from_directory, abort
from flask_cors import CORS
import pandas as pd
import json
from datetime import datetime, timedelta
import os
from CO2_Predictor import preprocess_new_data, create_sequences, inverse_scale, lstm_model, scaler, features
from Anomaly_checker import test_autoencoder_anomalies

# Get the absolute path to the Frontend directory
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Frontend'))

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Cache for storing results
prediction_cache = {}
anomaly_cache = {}

@app.route('/')
def serve_landing():
    try:
        return send_from_directory(frontend_dir, 'landing.html')
    except Exception as e:
        print(f"Error serving landing page: {str(e)}")
        return jsonify({'error': 'Could not load landing page'}), 500

@app.route('/<path:path>')
def serve_static(path):
    try:
        if os.path.exists(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)
        else:
            print(f"File not found: {path}")
            return abort(404)
    except Exception as e:
        print(f"Error serving static file {path}: {str(e)}")
        return jsonify({'error': f'Could not load file: {path}'}), 500

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    try:
        # Check if we have cached results less than 1 hour old
        if 'data' in prediction_cache and 'timestamp' in prediction_cache:
            cache_age = datetime.now() - prediction_cache['timestamp']
            if cache_age < timedelta(hours=1):
                return jsonify(prediction_cache['data'])

        # Process new data and make predictions
        data_file = os.path.join(os.path.dirname(__file__), "industrial.csv")
        if not os.path.exists(data_file):
            return jsonify({'error': 'Data file not found'}), 404

        X_new, hourly_data, _ = preprocess_new_data(data_file)
        X_sequences = create_sequences(X_new, 168)  # 168 hours = 1 week

        # Make predictions
        y_pred_scaled = lstm_model.predict(X_sequences)
        y_actual_scaled = X_new[168:, 0]  # CO2 is first feature

        # Inverse scaling
        y_pred = inverse_scale(y_pred_scaled)
        y_actual = inverse_scale(y_actual_scaled.reshape(-1, 1))

        # Calculate metrics
        mae = float(abs(y_pred - y_actual).mean())
        mse = float(((y_pred - y_actual) ** 2).mean())

        # Get timestamps
        timestamps = hourly_data.index[168:168 + len(y_pred)].strftime('%Y-%m-%d %H:%M:%S').tolist()

        # Prepare response data
        response_data = {
            'timestamps': timestamps,
            'actual_values': y_actual.tolist(),
            'predicted_values': y_pred.tolist(),
            'metrics': {
                'mae': mae,
                'mse': mse
            }
        }

        # Cache the results
        prediction_cache['data'] = response_data
        prediction_cache['timestamp'] = datetime.now()

        return jsonify(response_data)

    except Exception as e:
        print(f"Error in predictions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    try:
        # Check if we have cached results less than 1 hour old
        if 'data' in anomaly_cache and 'timestamp' in anomaly_cache:
            cache_age = datetime.now() - anomaly_cache['timestamp']
            if cache_age < timedelta(hours=1):
                return jsonify(anomaly_cache['data'])

        # Run anomaly detection
        data_file = os.path.join(os.path.dirname(__file__), "industrial.csv")
        if not os.path.exists(data_file):
            return jsonify({'error': 'Data file not found'}), 404

        results = test_autoencoder_anomalies(data_file)

        # Convert numpy arrays to lists for JSON serialization
        response_data = {
            'timestamps': results['timestamps'].strftime('%Y-%m-%d %H:%M:%S').tolist(),
            'mse_scores': results['mse_scores'].tolist(),
            'threshold': float(results['threshold']),
            'anomalies': results['anomalies'].tolist()
        }

        # Cache the results
        anomaly_cache['data'] = response_data
        anomaly_cache['timestamp'] = datetime.now()

        return jsonify(response_data)

    except Exception as e:
        print(f"Error in anomalies: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print(f"Frontend directory: {frontend_dir}")
    print("Starting Flask server...")
    app.run(debug=True, port=5000) 