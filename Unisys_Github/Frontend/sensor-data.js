// Initialize real-time sensor data
function initializeSensorData() {
    // Set up real-time chart
    const ctx = document.getElementById('realTimeChart').getContext('2d');
    const realTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#2196f3',
                tension: 0.4
            }, {
                label: 'Humidity (%)',
                data: [],
                borderColor: '#4caf50',
                tension: 0.4
            }, {
                label: 'CO2 (ppm)',
                data: [],
                borderColor: '#f44336',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Simulate real-time updates
    setInterval(() => {
        updateSensorData();
    }, 2000);
}

// Update sensor data
function updateSensorData() {
    // Simulate new sensor readings
    const temperature = 20 + Math.random() * 10;
    const humidity = 40 + Math.random() * 20;
    const co2 = 400 + Math.random() * 200;

    // Update circular progress indicators
    updateMetricCircle('temperature', temperature, 30);
    updateMetricCircle('humidity', humidity, 100);
    updateMetricCircle('co2', co2, 1000);

    // Update values
    document.querySelector('.temperature .current-value').textContent = 
        temperature.toFixed(1);
    document.querySelector('.humidity .current-value').textContent = 
        humidity.toFixed(1);
    document.querySelector('.co2 .current-value').textContent = 
        co2.toFixed(0);

    // Update last update time
    document.getElementById('lastUpdate').textContent = 
        new Date().toLocaleTimeString();
}

// Update circular progress indicator
function updateMetricCircle(metric, value, max) {
    const circle = document.querySelector(`.${metric} .progress-ring-circle`);
    const circumference = 2 * Math.PI * 54;
    const progress = value / max;
    const offset = circumference - progress * circumference;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeSensorData); 