// Chart configurations
const chartConfigs = {
    temperatureChart: {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Temperature',
                data: [22, 24, 27, 23, 25, 28],
                borderColor: '#2196f3',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    },
    carbonChart: {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Carbon Emissions',
                data: [65, 59, 80, 81],
                borderColor: '#4caf50',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    }
};

// Initialize charts
document.addEventListener('DOMContentLoaded', () => {
    // Initialize temperature chart
    const tempCtx = document.getElementById('temperatureChart');
    if (tempCtx) {
        new Chart(tempCtx, chartConfigs.temperatureChart);
    }

    // Initialize carbon emissions chart
    const carbonCtx = document.getElementById('carbonChart');
    if (carbonCtx) {
        new Chart(carbonCtx, chartConfigs.carbonChart);
    }

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', 
                document.body.classList.contains('dark-theme') ? 'dark' : 'light'
            );
        });
    }
}); 