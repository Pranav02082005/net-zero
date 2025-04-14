import { database, ref, onValue } from './firebase-config.js';

class RealtimeData {
    constructor() {
        this.sensorData = {};
        this.charts = {};
        this.initializeListeners();
    }

    initializeListeners() {
        // Reference to your sensor data in Firebase
        const sensorRef = ref(database, 'sensors');

        // Listen for real-time updates
        onValue(sensorRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.updateDashboard(data);
            }
        });
    }

    updateDashboard(data) {
        // Update sensor values
        this.updateSensorValues(data);
        // Update charts
        this.updateCharts(data);
    }

    updateSensorValues(data) {
        // Update temperature
        const tempElement = document.querySelector('.temperature .current-value');
        if (tempElement && data.temperature) {
            tempElement.textContent = data.temperature.toFixed(1);
        }

        // Update humidity
        const humidElement = document.querySelector('.humidity .current-value');
        if (humidElement && data.humidity) {
            humidElement.textContent = data.humidity.toFixed(1);
        }

        // Update CO2
        const co2Element = document.querySelector('.co2 .current-value');
        if (co2Element && data.co2) {
            co2Element.textContent = data.co2.toFixed(0);
        }
    }

    updateCharts(data) {
        // Update real-time chart
        if (this.charts.realTimeChart) {
            const chart = this.charts.realTimeChart;
            
            // Add new data point
            chart.data.labels.push(new Date().toLocaleTimeString());
            chart.data.datasets[0].data.push(data.temperature);
            chart.data.datasets[1].data.push(data.humidity);
            chart.data.datasets[2].data.push(data.co2);

            // Remove old data point if more than 10 points
            if (chart.data.labels.length > 10) {
                chart.data.labels.shift();
                chart.data.datasets.forEach(dataset => dataset.data.shift());
            }

            chart.update();
        }
    }

    initializeCharts() {
        // Initialize real-time chart
        const ctx = document.getElementById('realTimeChart').getContext('2d');
        this.charts.realTimeChart = new Chart(ctx, {
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
                },
                animation: {
                    duration: 0
                }
            }
        });
    }
}

// Initialize real-time data when page loads
document.addEventListener('DOMContentLoaded', () => {
    const realtimeData = new RealtimeData();
    realtimeData.initializeCharts();
}); 