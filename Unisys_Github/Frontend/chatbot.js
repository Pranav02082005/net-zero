class NetZeroAssistant {
    constructor() {
        this.currentFeature = null;
        this.questionIndex = 0;
        this.userResponses = {};
        this.features = {
            carbon: {
                title: 'Carbon Footprint Calculator',
                questions: [
                    'What type of transportation do you primarily use?',
                    'How many kilometers do you travel per day?',
                    'What is your average monthly electricity consumption?'
                ]
            },
            monitor: {
                title: 'Real-Time Monitoring',
                metrics: ['Temperature', 'CO2 Levels', 'Energy Usage']
            },
            strategies: {
                title: 'Emission Reduction Strategies',
                sectors: ['Industrial', 'Transportation', 'Household']
            },
            predict: {
                title: 'Predictive Analytics',
                features: ['Emission Forecasting', 'Anomaly Detection', 'Trend Analysis']
            }
        };
    }

    async handleUserInput(input) {
        const response = await this.processInput(input);
        return this.formatResponse(response);
    }

    async processInput(input) {
        // Simulate AI processing
        const lowercaseInput = input.toLowerCase();
        
        if (lowercaseInput.includes('carbon') || lowercaseInput.includes('footprint')) {
            return {
                type: 'carbon',
                content: 'I can help you calculate your carbon footprint. Would you like to start the assessment?',
                actions: ['Start Assessment', 'Learn More', 'See Example']
            };
        }
        
        if (lowercaseInput.includes('monitor') || lowercaseInput.includes('real-time')) {
            return {
                type: 'monitor',
                content: 'I can show you real-time emission data from our IoT sensors. What would you like to monitor?',
                actions: ['CO2 Levels', 'Energy Usage', 'Temperature']
            };
        }

        if (lowercaseInput.includes('strategy') || lowercaseInput.includes('reduce')) {
            return {
                type: 'strategies',
                content: 'I can suggest personalized strategies to reduce your emissions. Which sector interests you?',
                actions: ['Industrial', 'Transportation', 'Household']
            };
        }

        if (lowercaseInput.includes('predict') || lowercaseInput.includes('forecast')) {
            return {
                type: 'predict',
                content: 'Our AI can predict future emission trends. What would you like to analyze?',
                actions: ['Weekly Forecast', 'Monthly Trends', 'Anomaly Detection']
            };
        }

        return {
            type: 'general',
            content: 'I can help you with carbon footprint calculation, real-time monitoring, reduction strategies, and emission predictions. What interests you?',
            actions: ['Calculate Footprint', 'Monitor Emissions', 'Get Strategies', 'See Predictions']
        };
    }

    formatResponse(response) {
        return `
            <div class="message bot-message">
                <i class="material-icons bot-icon">smart_toy</i>
                <div class="message-content">
                    ${response.content}
                    <div class="quick-actions">
                        ${response.actions.map(action => 
                            `<button onclick="selectAction('${action.toLowerCase()}')">${action}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Carbon Footprint Calculator Feature
    async startCarbonCalculator() {
        const questions = [
            {
                type: 'transport',
                question: 'What is your primary mode of transportation?',
                options: ['Car', 'Public Transport', 'Bicycle/Walk', 'Electric Vehicle']
            },
            {
                type: 'energy',
                question: 'What is your monthly electricity consumption (in kWh)?',
                options: ['< 200 kWh', '200-500 kWh', '500-1000 kWh', '> 1000 kWh']
            },
            {
                type: 'lifestyle',
                question: 'How would you describe your diet?',
                options: ['Meat Daily', 'Occasional Meat', 'Vegetarian', 'Vegan']
            }
        ];

        return this.formatQuestionResponse(questions[this.questionIndex]);
    }

    // Real-time Monitoring Feature
    async showRealTimeData() {
        // Simulate real-time data
        const data = {
            co2: Math.floor(400 + Math.random() * 100),
            temperature: (20 + Math.random() * 5).toFixed(1),
            energy: Math.floor(200 + Math.random() * 100)
        };

        return `
            <div class="message bot-message">
                <i class="material-icons bot-icon">sensors</i>
                <div class="message-content">
                    <h4>Real-Time Monitoring</h4>
                    <div class="monitoring-data">
                        <canvas id="realTimeChart"></canvas>
                        <div class="current-readings">
                            <div class="reading">
                                <span class="label">CO2 Levels:</span>
                                <span class="value">${data.co2} ppm</span>
                            </div>
                            <div class="reading">
                                <span class="label">Temperature:</span>
                                <span class="value">${data.temperature}°C</span>
                            </div>
                            <div class="reading">
                                <span class="label">Energy Usage:</span>
                                <span class="value">${data.energy} kWh</span>
                            </div>
                        </div>
                    </div>
                    <div class="quick-actions">
                        <button onclick="updateRealTimeData()">Refresh Data</button>
                        <button onclick="showHistoricalData()">View History</button>
                        <button onclick="returnToMain()">Back to Menu</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Emission Reduction Strategies
    async getReductionStrategies(sector) {
        const strategies = {
            industrial: [
                'Implement energy-efficient machinery',
                'Switch to renewable energy sources',
                'Optimize production schedules',
                'Install smart monitoring systems'
            ],
            transportation: [
                'Transition to electric vehicles',
                'Implement route optimization',
                'Encourage carpooling',
                'Use hybrid vehicles'
            ],
            household: [
                'Install LED lighting',
                'Use smart thermostats',
                'Improve insulation',
                'Install solar panels'
            ]
        };

        return `
            <div class="message bot-message">
                <i class="material-icons bot-icon">eco</i>
                <div class="message-content">
                    <h4>Recommended Strategies for ${sector}</h4>
                    <ul class="strategy-list">
                        ${strategies[sector].map(strategy => 
                            `<li>${strategy}</li>`
                        ).join('')}
                    </ul>
                    <div class="quick-actions">
                        <button onclick="getDetailedStrategy('${sector}')">Get Details</button>
                        <button onclick="calculateSavings('${sector}')">Calculate Savings</button>
                        <button onclick="returnToMain()">Back to Menu</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Predictive Analytics
    async showPredictions() {
        return `
            <div class="message bot-message">
                <i class="material-icons bot-icon">trending_up</i>
                <div class="message-content">
                    <h4>Emission Predictions</h4>
                    <div class="prediction-chart">
                        <canvas id="predictionChart"></canvas>
                    </div>
                    <div class="prediction-insights">
                        <h5>AI Insights:</h5>
                        <ul>
                            <li>Predicted 15% reduction in next month</li>
                            <li>Anomaly detected in evening usage</li>
                            <li>Optimal efficiency period: 10AM-2PM</li>
                        </ul>
                    </div>
                    <div class="quick-actions">
                        <button onclick="updatePredictions()">Update Forecast</button>
                        <button onclick="showAnomalyDetails()">View Anomalies</button>
                        <button onclick="returnToMain()">Back to Menu</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize chatbot
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new NetZeroAssistant();
    const chatbotButton = document.getElementById('chatbotButton');
    const chatbotInterface = document.getElementById('chatbotInterface');
    const closeChatbot = document.getElementById('closeChatbot');
    const userInput = document.getElementById('userInput');
    const sendMessage = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    chatbotButton.addEventListener('click', () => {
        chatbotInterface.style.display = 'flex';
        chatbotButton.style.display = 'none';
    });

    closeChatbot.addEventListener('click', () => {
        chatbotInterface.style.display = 'none';
        chatbotButton.style.display = 'flex';
    });

    async function sendUserMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message
        chatMessages.innerHTML += `
            <div class="message user-message">
                <div class="message-content">${message}</div>
            </div>
        `;

        // Get and add bot response
        const response = await chatbot.handleUserInput(message);
        chatMessages.innerHTML += response;

        // Clear input and scroll to bottom
        userInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendMessage.addEventListener('click', sendUserMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendUserMessage();
    });

    // Initialize Charts
    function initializeCharts() {
        // Real-time monitoring chart
        const realTimeCtx = document.getElementById('realTimeChart');
        if (realTimeCtx) {
            new Chart(realTimeCtx, {
                type: 'line',
                data: {
                    labels: ['Now', '-1m', '-2m', '-3m', '-4m', '-5m'],
                    datasets: [{
                        label: 'CO2 Levels',
                        data: [420, 415, 418, 422, 419, 421],
                        borderColor: '#4caf50'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Prediction chart
        const predictionCtx = document.getElementById('predictionChart');
        if (predictionCtx) {
            new Chart(predictionCtx, {
                type: 'line',
                data: {
                    labels: ['Now', '+1h', '+2h', '+3h', '+4h', '+5h'],
                    datasets: [{
                        label: 'Predicted',
                        data: [420, 425, 422, 428, 423, 426],
                        borderColor: '#2196f3',
                        borderDash: [5, 5]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    // Add navigation functions
    window.returnToMain = function() {
        chatbot.currentFeature = null;
        chatbot.questionIndex = 0;
        chatMessages.innerHTML += `
            <div class="message bot-message">
                <i class="material-icons bot-icon">smart_toy</i>
                <div class="message-content">
                    What would you like to do?
                    <div class="quick-actions">
                        <button onclick="selectFeature('carbon')">Calculate Footprint</button>
                        <button onclick="selectFeature('monitor')">Real-time Monitoring</button>
                        <button onclick="selectFeature('strategies')">Get Strategies</button>
                        <button onclick="selectFeature('predict')">View Predictions</button>
                        <button onclick="returnToLanding()">Return to Home</button>
                    </div>
                </div>
            </div>
        `;
    };

    window.returnToLanding = function() {
        window.location.href = 'landing.html';
    };

    // Feature selection handler
    window.selectFeature = async function(feature) {
        chatbot.currentFeature = feature;
        let response;

        switch(feature) {
            case 'carbon':
                response = await chatbot.startCarbonCalculator();
                break;
            case 'monitor':
                response = await chatbot.showRealTimeData();
                break;
            case 'strategies':
                response = await chatbot.getReductionStrategies('industrial');
                break;
            case 'predict':
                response = await chatbot.showPredictions();
                break;
        }

        chatMessages.innerHTML += response;
        initializeCharts();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
});

// Handle quick action selection
window.selectAction = async function(action) {
    const chatbot = new NetZeroAssistant();
    const chatMessages = document.getElementById('chatMessages');
    const response = await chatbot.handleUserInput(action);
    chatMessages.innerHTML += response;
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

/* Add to your existing chatbot styles */
.monitoring-data, .prediction-chart {
    height: 200px;
    margin: 1rem 0;
    background: #f5f5f5;
    border-radius: 10px;
    padding: 1rem;
}

.current-readings {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.reading {
    background: white;
    padding: 0.5rem;
    border-radius: 8px;
    text-align: center;
}

.reading .label {
    font-size: 0.8rem;
    color: #666;
}

.reading .value {
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--primary-color);
}

.strategy-list {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
}

.strategy-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
}

.prediction-insights {
    margin: 1rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 8px;
}

.prediction-insights h5 {
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

.prediction-insights ul {
    list-style: none;
    padding: 0;
}

.prediction-insights li {
    padding: 0.25rem 0;
    font-size: 0.9rem;
} 