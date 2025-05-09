document.addEventListener('DOMContentLoaded', function() {
    // Get the chart canvas
    const ctx = document.getElementById('referralChart').getContext('2d');
    
    // Get user ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    
    if (!userId) {
        console.error('User ID not found in URL');
        return;
    }
    
    // Fetch referral analytics data from the backend
    fetch(`/api/referral-analytics/?user_id=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('API response:', data);
            if (data.success) {
                console.log('Rendering chart with API data');
                renderChart(data.data);
            } else {
                console.error('Error fetching referral data:', data.error);
                renderSampleChart();
            }
        })
        .catch(error => {
            console.error('Error fetching referral data:', error);
            // Fallback to sample data if API fails
            renderSampleChart();
        });
    
    function renderSampleChart() {
        // Sample data for fallback
        const sampleData = {
            dates: getLast10Days(),
            counts: [5, 8, 12, 7, 10, 15, 9, 6, 18, 11],
            total_referrals: 101,
            daily_average: 10.1,
            trend_percentage: 15,
            today_referrals: 11
        };
        renderChart(sampleData);
    }
    
    function getLast10Days() {
        const dates = [];
        for (let i = 9; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const month = date.toLocaleString('default', { month: 'short' });
            const day = date.getDate();
            dates.push(`${month} ${day}`);
        }
        return dates;
    }
    
    function renderChart(data) {
        // Extract data from API response
        const labels = data.dates;
        const referralData = data.counts;
        const isNewUser = referralData.every(count => count === 0);
        
        // Update stats in the UI
        document.getElementById('totalReferrals').textContent = data.total_referrals;
        document.getElementById('avgReferrals').textContent = data.daily_average;
        document.getElementById('trendPercentage').textContent = `${data.trend_percentage}%`;
        document.getElementById('currentPointDate').textContent = 'Today';
        document.getElementById('currentPointValue').textContent = `${data.today_referrals} referrals`;
        
        // Calculate if each day is an increase or decrease from previous day
        const colors = referralData.map((value, index) => {
            if (index === 0) return 'rgba(54, 162, 235, 0.8)'; // First day is always blue
            return value >= referralData[index - 1] ? 'rgba(54, 162, 235, 0.8)' : 'rgba(255, 99, 132, 0.8)';
        });
        
        // Update trend icon
        const trendIcon = document.getElementById('trendIcon');
        const trendIndicator = document.getElementById('trendIndicator');
        
        if (data.trend_percentage > 0) {
            trendIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>';
            trendIndicator.classList.add('trend-up');
            trendIndicator.classList.remove('trend-down', 'trend-neutral');
        } else if (data.trend_percentage < 0) {
            trendIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
            trendIndicator.classList.add('trend-down');
            trendIndicator.classList.remove('trend-up', 'trend-neutral');
        } else {
            trendIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
            trendIndicator.classList.add('trend-neutral');
            trendIndicator.classList.remove('trend-up', 'trend-down');
        }
        
        // Create the chart with animation
        let chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Referrals',
                    data: Array(referralData.length).fill(0), // Start with all zeros for animation
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1,
                    borderRadius: 5,
                    barPercentage: 0.7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `${context.raw} referrals`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(...referralData) > 20 ? Math.max(...referralData) + 5 : 20,
                        ticks: {
                            stepSize: 5,
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                },
                animation: {
                    duration: 1500
                }
            }
        });
        
        // Function to animate the bars when the section is visible
        function animateChart() {
            chart.data.datasets[0].data = referralData;
            chart.update();
        }
        
        // Use Intersection Observer to detect when chart is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(animateChart, 300); // Slight delay for better visual effect
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.3 });
        
        // Observe the chart container
        observer.observe(document.querySelector('.chart-container'));
        
        // Add datalabels to show values above bars
        Chart.register({
            id: 'datalabels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (!meta.hidden) {
                        meta.data.forEach((element, index) => {
                            // Draw the value above the bar
                            const value = dataset.data[index];
                            if (value > 0) { // Only show labels for non-zero values
                                const position = element.tooltipPosition();
                                
                                // Draw the value above the bar
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                const fontSize = 12;
                                ctx.font = `${fontSize}px Arial`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(value, position.x, position.y - 5);
                            }
                        });
                    }
                });
            }
        });
    }
});
