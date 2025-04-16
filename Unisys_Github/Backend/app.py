from flask import Flask, jsonify, send_from_directory, abort, request
from flask_cors import CORS
import pandas as pd
import json
from datetime import datetime, timedelta
import os
from CO2_Predictor import preprocess_new_data, create_sequences, inverse_scale, lstm_model, scaler, features
from Anomaly_checker import test_autoencoder_anomalies
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the absolute path to the Frontend directory
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Frontend'))

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Google AI
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

# Cache for storing results
prediction_cache = {}
anomaly_cache = {}
conversation_history = {}

# Function to clean old sessions (older than 24 hours)
def clean_old_sessions():
    current_time = datetime.now()
    sessions_to_remove = []
    
    for session_id, session_data in conversation_history.items():
        if 'last_accessed' in session_data:
            time_diff = current_time - session_data['last_accessed']
            if time_diff > timedelta(hours=24):
                sessions_to_remove.append(session_id)
    
    for session_id in sessions_to_remove:
        del conversation_history[session_id]

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        user_message = data['message']
        session_id = request.headers.get('X-Session-ID', 'default')

        # Clean old sessions periodically
        clean_old_sessions()

        # Initialize conversation history for new sessions
        if session_id not in conversation_history:
            conversation_history[session_id] = {
                'messages': [],
                'last_accessed': datetime.now()
            }
        else:
            # Update last accessed time
            conversation_history[session_id]['last_accessed'] = datetime.now()

        # Add user message to history
        conversation_history[session_id]['messages'].append(f"User: {user_message}")

        # Prepare conversation context
        context = """You are an AI assistant for a carbon emissions monitoring system. 
        Focus on topics related to:
        1. CO2 emissions and their environmental impact
        2. Sustainability practices
        3. Carbon footprint reduction
        4. Environmental monitoring
        Keep responses concise (under 100 words) and professional.
        Provide specific, actionable insights when possible."""
        
        # Combine context with conversation history
        full_prompt = context + "\n" + "\n".join(conversation_history[session_id]['messages'][-5:])

        try:
            # Generate response with streaming
            response = model.generate_content(full_prompt, stream=True)
            bot_response = ""
            
            # Collect streaming response
            for chunk in response:
                if chunk.text:
                    bot_response += chunk.text

            # Clean and format the response
            bot_response = bot_response.strip()
            
            # Add bot response to history
            conversation_history[session_id]['messages'].append(f"Assistant: {bot_response}")

            # Limit conversation history
            if len(conversation_history[session_id]['messages']) > 10:
                conversation_history[session_id]['messages'] = conversation_history[session_id]['messages'][-10:]

            return jsonify({'response': bot_response})
            
        except Exception as model_error:
            print(f"Model error: {str(model_error)}")
            return jsonify({'error': 'Failed to generate response. Please try again.'}), 500

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

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