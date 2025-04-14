// Chart.js configuration defaults
Chart.defaults.font.family = "'Arial', sans-serif";
Chart.defaults.color = '#666';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Initialize charts
let co2PredictionChart = null;
let anomalyChart = null;

// API endpoints
const API_BASE_URL = 'http://localhost:5000/api';
const PREDICTIONS_ENDPOINT = `${API_BASE_URL}/predictions`;
const ANOMALIES_ENDPOINT = `${API_BASE_URL}/anomalies`;

// Error handling function
function showError(message) {
    console.error('Error:', message);
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    if (errorAlert && errorMessage) {
        errorMessage.textContent = message;
        errorAlert.style.display = 'flex';
    }
}

// Initialize CO2 Prediction Chart
function initCO2PredictionChart(data) {
    try {
        const canvas = document.getElementById('co2PredictionChart');
        if (!canvas) {
            throw new Error('Could not find chart canvas element');
        }
        const ctx = canvas.getContext('2d');
        
        if (co2PredictionChart) {
            co2PredictionChart.destroy();
        }

        co2PredictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.timestamps,
                datasets: [
                    {
                        label: 'Actual CO2',
                        data: data.actual_values.map((value, index) => ({
                            x: new Date(data.timestamps[index]),
                            y: value
                        })),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Predicted CO2',
                        data: data.predicted_values.map((value, index) => ({
                            x: new Date(data.timestamps[index]),
                            y: value
                        })),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderDash: [5, 5],
                        fill: true
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'CO2 Predictions vs Actual Values'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'MMM d, HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'CO2 (ppm)'
                        }
                    }
                }
            }
        });

        // Update metrics
        const maeElement = document.getElementById('maeValue');
        const mseElement = document.getElementById('mseValue');
        if (maeElement) maeElement.textContent = `${data.metrics.mae.toFixed(2)} ppm`;
        if (mseElement) mseElement.textContent = data.metrics.mse.toFixed(2);
    } catch (error) {
        showError('Error initializing CO2 prediction chart: ' + error.message);
    }
}

// Initialize Anomaly Chart
function initAnomalyChart(data) {
    try {
        const canvas = document.getElementById('anomalyChart');
        if (!canvas) {
            throw new Error('Could not find anomaly chart canvas element');
        }
        const ctx = canvas.getContext('2d');
        
        if (anomalyChart) {
            anomalyChart.destroy();
        }

        anomalyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.timestamps,
                datasets: [
                    {
                        label: 'Reconstruction Error',
                        data: data.mse_scores.map((value, index) => ({
                            x: new Date(data.timestamps[index]),
                            y: value
                        })),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Threshold',
                        data: data.timestamps.map(ts => ({
                            x: new Date(ts),
                            y: data.threshold
                        })),
                        borderColor: 'rgb(255, 99, 132)',
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Anomaly Detection Results'
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'MMM d, HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Reconstruction Error'
                        }
                    }
                }
            }
        });
    } catch (error) {
        showError('Error initializing anomaly chart: ' + error.message);
    }
}

// Update Anomaly List
function updateAnomalyList(data) {
    try {
        const anomalyList = document.getElementById('anomalyList');
        if (!anomalyList) {
            throw new Error('Could not find anomaly list element');
        }

        const anomalies = data.anomalies;
        if (anomalies.length === 0) {
            anomalyList.innerHTML = '<p class="no-anomalies">No anomalies detected in the selected timeframe.</p>';
            return;
        }

        const anomalyHTML = anomalies.map((isAnomaly, index) => {
            if (!isAnomaly) return '';
            const timestamp = new Date(data.timestamps[index]);
            return `
                <div class="anomaly-item">
                    <div class="anomaly-time">
                        <i class="material-icons">warning</i>
                        ${timestamp.toLocaleString()}
                    </div>
                    <div class="anomaly-details">
                        <p>Reconstruction Error: ${data.mse_scores[index].toFixed(4)}</p>
                        <p>Threshold: ${data.threshold.toFixed(4)}</p>
                    </div>
                </div>
            `;
        }).filter(html => html !== '').join('');

        anomalyList.innerHTML = anomalyHTML || '<p class="no-anomalies">No anomalies detected in the selected timeframe.</p>';
    } catch (error) {
        showError('Error updating anomaly list: ' + error.message);
    }
}

// Fetch prediction data
async function fetchPredictionData() {
    try {
        console.log('Fetching prediction data...');
        const response = await fetch(PREDICTIONS_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        console.log('Prediction data received:', data);
        initCO2PredictionChart(data);
    } catch (error) {
        showError('Error fetching prediction data: ' + error.message);
    }
}

// Fetch anomaly data
async function fetchAnomalyData() {
    try {
        console.log('Fetching anomaly data...');
        const response = await fetch(ANOMALIES_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        console.log('Anomaly data received:', data);
        initAnomalyChart(data);
        updateAnomalyList(data);
    } catch (error) {
        showError('Error fetching anomaly data: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    // Initial data load
    fetchPredictionData();
    fetchAnomalyData();

    // Refresh button listener
    const refreshButton = document.getElementById('refreshData');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            console.log('Refreshing data...');
            fetchPredictionData();
            fetchAnomalyData();
        });
    }
}); 