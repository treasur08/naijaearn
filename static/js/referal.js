// Declare particlesJS as a global variable
if (typeof window !== "undefined") {
  window.particlesJS = window.particlesJS || {}
  window.Telegram = window.Telegram || {}
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing referral page")

  // Initialize particles.js if available
  if (typeof window.particlesJS !== "undefined") {
    window.particlesJS("particles-js", {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#ffffff" },
        shape: {
          type: "circle",
          stroke: { width: 0, color: "#000000" },
        },
        opacity: {
          value: 0.3,
          random: true,
          anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false },
        },
        size: {
          value: 3,
          random: true,
          anim: { enable: true, speed: 2, size_min: 0.1, sync: false },
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#ffffff",
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false,
          attract: { enable: false, rotateX: 600, rotateY: 1200 },
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" },
          resize: true,
        },
        modes: {
          grab: { distance: 140, line_linked: { opacity: 0.5 } },
          push: { particles_nb: 4 },
        },
      },
      retina_detect: true,
    })
  } else {
    console.warn("particles.js is not loaded, using fallback")
    createFallbackParticles()
  }

  // // Initialize Referral Analytics
  // initReferralAnalytics()

  // Set up copy button functionality
  setupCopyButton()

  // Animate stats
  animateStats()

  // Set up theme toggle
  setupThemeToggle()

  // Set up scroll animation for chart
  //setupScrollAnimation() // Removed setupScrollAnimation
})

// Set up scroll animation for the chart
// function setupScrollAnimation() { // Removed setupScrollAnimation
//   const observer = new IntersectionObserver(
//     (entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting && !isChartAnimated && chart) {
//           console.log("Chart is visible, animating bars")
//           animateChart()
//           isChartAnimated = true
//         }
//       })
//     },
//     { threshold: 0.3 },
//   )

//   const chartContainer = document.querySelector(".analytics-container")
//   if (chartContainer) {
//     observer.observe(chartContainer)
//   }
// }

// Animate the chart bars
// function animateChart() { // Removed animateChart
//   if (!chart) return

//   // Get the original data
//   const originalData = [...chart.data.datasets[0].data]

//   // Reset data to zero
//   chart.data.datasets[0].data = Array(originalData.length).fill(0)
//   chart.update()

//   // Animate to actual values
//   let currentStep = 0
//   const totalSteps = 20

//   const animateStep = () => {
//     currentStep++
//     const progress = currentStep / totalSteps

//     chart.data.datasets[0].data = originalData.map((value) => Math.round(value * progress))

//     chart.update()

//     if (currentStep < totalSteps) {
//       requestAnimationFrame(animateStep)
//     }
//   }

//   requestAnimationFrame(animateStep)
// }

// Copy referral link function
function setupCopyButton() {
  const copyBtn = document.getElementById("copyBtn")
  const shareBtn = document.getElementById("shareBtn")

  if (copyBtn) {
    console.log("Setting up copy button")
    copyBtn.addEventListener("click", async () => {
      const referralLink = document.getElementById("referralLink").textContent.trim()
      console.log("Copying referral link:", referralLink)

      try {
        await navigator.clipboard.writeText(referralLink)
        showToast("Referral link copied! Share with friends to earn rewards")

        // Add visual feedback
        copyBtn.classList.add("pulse")
        setTimeout(() => {
          copyBtn.classList.remove("pulse")
        }, 1000)
      } catch (err) {
        console.error("Clipboard API failed:", err)

        // Fallback method
        const textArea = document.createElement("textarea")
        textArea.value = referralLink
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          const successful = document.execCommand("copy")
          if (successful) {
            showToast("Referral link copied! Share with friends to earn rewards")
          } else {
            showToast("Could not copy link. Please try again.")
          }
        } catch (e) {
          console.error("Fallback copy failed:", e)
          showToast("Could not copy link. Please try again.")
        }

        document.body.removeChild(textArea)
      }
    })
  } else {
    console.error("Copy button not found")
  }

}

// Update the share button functionality
window.shareReferralLink = function() {
  const referralLink = document.getElementById("referralLink").textContent.trim();
  const tgApp = window.Telegram && window.Telegram.WebApp;
  
  console.log("Share button clicked, referral link:", referralLink);
  
  if (tgApp) {
    // Add visual feedback
    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
      shareBtn.classList.add("pulse");
      setTimeout(() => {
        shareBtn.classList.remove("pulse");
      }, 1000);
    }
    
    // Prepare the message to share
    const message = `Join me on Fluxx Earn and start earning! Use my referral link: ${referralLink}`;
    
    // Use Telegram's native sharing
    if (typeof tgApp.switchInlineQuery === 'function') {
      tgApp.switchInlineQuery(message);
    } else {
      // Fallback if switchInlineQuery is not available
      showToast("Sharing via Telegram is not available");
      
      // Try to copy to clipboard instead
      navigator.clipboard.writeText(message)
        .then(() => showToast("Message copied to clipboard"))
        .catch(err => console.error("Could not copy message", err));
    }
  } else {
    // Fallback for when Telegram WebApp is not available
    if (navigator.share) {
      navigator.share({
        title: 'Fluxx Earn Referral',
        text: 'Join me on Fluxx Earn and start earning!',
        url: referralLink,
      })
      .then(() => showToast("Thanks for sharing!"))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // If Web Share API is not available, copy to clipboard
      navigator.clipboard.writeText(referralLink)
        .then(() => showToast("Link copied to clipboard"))
        .catch(err => {
          console.error("Could not copy link", err);
          showToast("Sharing not supported on this browser");
        });
    }
  }
}

// Update the global copyReferralLink function
window.copyReferralLink = () => {
  const copyBtn = document.getElementById("copyBtn")
  if (copyBtn) {
    copyBtn.click()
  }
}

// Toast notification function
function showToast(message) {
  // Remove existing toast if any
  const existingToast = document.querySelector(".toast")
  if (existingToast) {
    existingToast.remove()
  }

  // Create new toast
  const toast = document.createElement("div")
  toast.className = "toast"
  toast.textContent = message
  document.body.appendChild(toast)

  // Show toast with animation
  setTimeout(() => {
    toast.classList.add("show")
  }, 10)

  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, 3000)
}

// Animate stats
function animateStats() {
  // Animate referral count and earnings
  const refCount = document.getElementById("totalReferrals")
  const refEarning = document.getElementById("refEarning")

  if (refCount) {
    const value = Number.parseInt(refCount.textContent.replace(/,/g, "")) || 0
    animateValue(refCount, 0, value, 2000)
  }

  if (refEarning) {
    const value = Number.parseInt(refEarning.textContent.replace(/,/g, "")) || 0
    animateValue(refEarning, 0, value, 2000)
  }

  // Animate balance
  const balanceAmount = document.querySelector(".balance-amount")
  if (balanceAmount) {
    const targetBalance = Number.parseFloat(balanceAmount.textContent.replace(/,/g, "")) || 0
    animateValue(balanceAmount, 0, targetBalance, 2000)
  }
}

// Value animation helper
function animateValue(element, start, end, duration) {
  if (!element) return

  let startTimestamp = null
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp
    const progress = Math.min((timestamp - startTimestamp) / duration, 1)

    // Easing function for smoother animation
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    const currentValue = Math.floor(easeProgress * (end - start) + start)

    element.textContent = currentValue.toLocaleString()

    if (progress < 1) {
      window.requestAnimationFrame(step)
    }
  }

  window.requestAnimationFrame(step)
}

// Theme toggle setup
function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle")
  const body = document.body

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-mode")
      localStorage.setItem("darkMode", body.classList.contains("dark-mode"))
    })

    // Check for saved theme preference
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode === "true") {
      body.classList.add("dark-mode")
    }
  }
}

// Fallback particles
function createFallbackParticles() {
  const particlesContainer = document.getElementById("particles-js")
  if (!particlesContainer) return

  const canvas = document.createElement("canvas")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.position = "absolute"
  canvas.style.top = "0"
  canvas.style.left = "0"
  canvas.style.zIndex = "0"

  particlesContainer.appendChild(canvas)

  const ctx = canvas.getContext("2d")
  const particles = []
  const particleCount = 50

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      color: "#4183ff",
      speedX: Math.random() * 1 - 0.5,
      speedY: Math.random() * 1 - 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    })
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]

      // Move particles
      p.x += p.speedX
      p.y += p.speedY

      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1

      // Draw particle
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(65, 131, 255, ${p.opacity})`
      ctx.fill()
    }

    requestAnimationFrame(drawParticles)
  }

  drawParticles()

  // Handle window resize
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  })
}
function createImprovedReferralChart(canvas, dates, counts, trendValue) {
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  // Calculate average for threshold
  const average = counts.reduce((sum, val) => sum + val, 0) / counts.length || 0.5;

  // Set up point styles based on whether they're above or below average
  const pointBackgroundColors = counts.map((count) =>
    count >= average ? "var(--positive-color)" : "var(--negative-color)"
  );

  // Determine line color based on trend
  const lineColor = trendValue >= 0 ? "var(--positive-color)" : "var(--negative-color)";

  // Set up gradient fill
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);

  if (trendValue >= 0) {
    gradient.addColorStop(0, "rgba(46, 204, 113, 0.3)");
    gradient.addColorStop(1, "rgba(46, 204, 113, 0)");
  } else {
    gradient.addColorStop(0, "rgba(231, 76, 60, 0.3)");
    gradient.addColorStop(1, "rgba(231, 76, 60, 0)");
  }

  // Destroy existing chart if it exists
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // Create new chart with improved visibility
  const chart = new Chart(ctx, {
    type: "bar", // Changed to bar for better visibility
    data: {
      labels: dates,
      datasets: [
        {
          label: "Daily Referrals",
          data: counts,
          backgroundColor: counts.map((_, i) => 
            i === counts.length - 1 ? "#4183ff" : "rgba(255, 255, 255, 0.5)"
          ),
          borderColor: counts.map((_, i) => 
            i === counts.length - 1 ? "#4183ff" : "rgba(255, 255, 255, 0.5)"
          ),
          borderWidth: 1,
          borderRadius: 4,
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(26, 30, 46, 0.9)",
          titleColor: "#fff",
          bodyColor: "#fff",
          titleFont: {
            size: 14,
          },
          bodyFont: {
            size: 14,
          },
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (tooltipItems) => tooltipItems[0].label,
            label: (context) => `${context.parsed.y} referrals`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false, // Hide grid lines for cleaner look
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.9)", // Brighter color for better visibility
            font: {
              size: 12,
              weight: 'bold' // Make font bold
            },
            maxRotation: 0, // Keep labels horizontal
            padding: 10, // Add padding
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)", // Subtle grid lines
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.9)", // Brighter color for better visibility
            precision: 0, // Show whole numbers only
            font: {
              size: 12,
              weight: 'bold' // Make font bold
            },
          },
        },
      },
    },
  });

  console.log("Chart created successfully");
  return chart;
}
// Referral Analytics Chart
function initReferralAnalytics() {
  console.log("Initializing referral analytics");

  // Get the canvas element
  const chartCanvas = document.getElementById("referralChart");
  if (!chartCanvas) {
    console.error("Chart canvas element not found");
    return;
  }

  // Get user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("user_id");

  if (!userId) {
    console.error("User ID not found in URL");
    showFallbackChart();
    return;
  }

  console.log("Fetching analytics for user:", userId);

  // Show loading state
  const chartContainer = document.querySelector(".chart-container");
  if (!chartContainer) {
    console.error("Chart container not found");
    return;
  }

  // Add loading spinner
  const loadingSpinner = document.createElement("div");
  loadingSpinner.className = "loading-spinner-container";
  loadingSpinner.innerHTML = '<div class="loading-spinner"></div>';
  chartContainer.appendChild(loadingSpinner);

  // Fetch analytics data
  fetch(`/api/referral-analytics/?user_id=${userId}`)
    .then((response) => {
      console.log("API response status:", response.status);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Analytics data received:", data);

      // Remove loading spinner
      const spinner = chartContainer.querySelector(".loading-spinner-container");
      if (spinner) {
        chartContainer.removeChild(spinner);
      }

      if (data.success) {
        // Update metrics
        const totalReferrals = document.getElementById("totalReferrals");
        if (totalReferrals) {
          totalReferrals.textContent = data.data.total_referrals.toLocaleString();
        }

        const avgReferrals = document.getElementById("avgReferrals");
        if (avgReferrals) {
          avgReferrals.textContent = data.data.daily_average;
        }

        // Update trend indicator
        updateTrendIndicator(data.data.trend_percentage);

        // Update current point display
        const dates = data.data.dates;
        const counts = data.data.counts;
        const lastIndex = counts.length - 1;

        const currentPointDate = document.getElementById("currentPointDate");
        if (currentPointDate) {
          currentPointDate.textContent = "Today";
        }

        const currentPointValue = document.getElementById("currentPointValue");
        if (currentPointValue) {
          currentPointValue.textContent = `${counts[lastIndex]} referrals`;
        }

        // Create chart with improved visibility
        createImprovedReferralChart(chartCanvas, dates, counts, data.data.trend_percentage);
      } else {
        console.error("API returned error:", data.error);
        showFallbackChart();
      }
    })
    .catch((error) => {
      console.error("Error fetching analytics data:", error);
      showFallbackChart();
    });
}


// Update trend indicator
function updateTrendIndicator(trendValue) {
  const trendIcon = document.getElementById("trendIcon")
  const trendIndicator = document.getElementById("trendIndicator")
  const trendPercentage = document.getElementById("trendPercentage")

  if (!trendIcon || !trendIndicator || !trendPercentage) {
    console.error("Trend elements not found")
    return
  }

  // Reset classes
  trendIndicator.classList.remove("trend-up", "trend-down", "trend-neutral")

  if (trendValue > 0) {
    trendIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>'
    trendIndicator.classList.add("trend-up")
    trendPercentage.textContent = `+${trendValue}%`
  } else if (trendValue < 0) {
    trendIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
    trendIndicator.classList.add("trend-down")
    trendPercentage.textContent = `${trendValue}%`
  } else {
    trendIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h8"/></svg>'
    trendIndicator.classList.add("trend-neutral")
    trendPercentage.textContent = `0%`
  }
}

// Create simple bar chart
// Create simple bar chart - updated to show all 10 days
function showSimpleBarChart(values, todayCount) {
  const chartContainer = document.querySelector(".chart-container");
  if (!chartContainer) {
    console.error("Chart container not found");
    return;
  }

  // Clear existing content
  chartContainer.innerHTML = "";

  // Get user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("user_id");

  // Fetch the full 10 days of data
  fetch(`/api/referral-analytics/?user_id=${userId}`)
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        console.error("Failed to fetch analytics data");
        return;
      }

      const dates = data.data.dates;
      const counts = data.data.counts;
      
      // Create custom bar chart
      const barChartContainer = document.createElement("div");
      barChartContainer.className = "simple-bar-chart";
      barChartContainer.style.position = "relative";
      barChartContainer.style.width = "100%";
      barChartContainer.style.height = "200px";
      barChartContainer.style.marginTop = "20px";
      barChartContainer.style.marginBottom = "30px"; // Increased for x-axis labels

      // Create y-axis labels
      const yAxisLabels = document.createElement("div");
      yAxisLabels.className = "y-axis-labels";
      yAxisLabels.style.position = "absolute";
      yAxisLabels.style.left = "0";
      yAxisLabels.style.top = "0";
      yAxisLabels.style.height = "100%";
      yAxisLabels.style.display = "flex";
      yAxisLabels.style.flexDirection = "column-reverse";
      yAxisLabels.style.justifyContent = "space-between";
      yAxisLabels.style.paddingBottom = "20px";
      yAxisLabels.style.color = "rgba(255, 255, 255, 0.8)";
      yAxisLabels.style.fontSize = "12px";
      yAxisLabels.style.fontWeight = "500";

      // Add y-axis labels
      const maxValue = Math.max(...counts, 5); // Ensure at least 5 for scale
      const yLabels = [0, Math.ceil(maxValue/3), Math.ceil(2*maxValue/3), maxValue];
      yLabels.forEach(label => {
        const labelDiv = document.createElement("div");
        labelDiv.textContent = label;
        yAxisLabels.appendChild(labelDiv);
      });

      barChartContainer.appendChild(yAxisLabels);

      // Create bars container
      const barsContainer = document.createElement("div");
      barsContainer.className = "bars-container";
      barsContainer.style.position = "absolute";
      barsContainer.style.left = "25px";
      barsContainer.style.right = "10px";
      barsContainer.style.top = "0";
      barsContainer.style.bottom = "30px"; // Increased for x-axis labels
      barsContainer.style.display = "flex";
      barsContainer.style.alignItems = "flex-end";
      barsContainer.style.justifyContent = "space-around";
      barsContainer.style.paddingBottom = "20px";

      // Create x-axis line
      const xAxisLine = document.createElement("div");
      xAxisLine.className = "x-axis-line";
      xAxisLine.style.position = "absolute";
      xAxisLine.style.left = "25px";
      xAxisLine.style.right = "10px";
      xAxisLine.style.bottom = "30px"; // Increased for x-axis labels
      xAxisLine.style.height = "1px";
      xAxisLine.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
      barChartContainer.appendChild(xAxisLine);

      // Create x-axis labels
      const xAxisLabels = document.createElement("div");
      xAxisLabels.className = "x-axis-labels";
      barChartContainer.appendChild(xAxisLabels);

      // Add bars and x-axis labels
      counts.forEach((value, index) => {
        // Create bar container
        const barContainer = document.createElement("div");
        barContainer.className = "bar-container";
        barContainer.style.display = "flex";
        barContainer.style.flexDirection = "column";
        barContainer.style.alignItems = "center";
        barContainer.style.width = `${90/counts.length}%`;
        barContainer.style.minWidth = "20px";

        // Create bar value label
        const valueLabel = document.createElement("div");
        valueLabel.className = "bar-value";
        valueLabel.textContent = value;
        valueLabel.style.marginBottom = "5px";
        valueLabel.style.color = index === counts.length - 1 ? "#4183ff" : "rgba(255, 255, 255, 0.8)";
        valueLabel.style.fontWeight = "bold";
        barContainer.appendChild(valueLabel);

        // Create bar
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.width = "80%";
        bar.style.backgroundColor = index === counts.length - 1 ? "#4183ff" : "rgba(255, 255, 255, 0.5)";
        bar.style.borderRadius = "3px 3px 0 0";

        // Calculate height based on value
        const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        bar.style.height = `${heightPercentage}%`;
        bar.style.minHeight = "1px"; // Ensure bars with 0 value are still visible

        // Animate bar height
        bar.style.transition = "height 1s ease-out";

        barContainer.appendChild(bar);
        barsContainer.appendChild(barContainer);

        // Add x-axis label
        const xLabel = document.createElement("div");
        xLabel.className = "x-axis-label";
        xLabel.textContent = dates[index].split(" ")[1]; // Just show the day number
        xAxisLabels.appendChild(xLabel);
      });

      barChartContainer.appendChild(barsContainer);

      // Add "Today" indicator with value
      const todayIndicator = document.createElement("div");
      todayIndicator.className = "current-point-details";
      todayIndicator.style.position = "absolute";
      todayIndicator.style.top = "10px";
      todayIndicator.style.right = "10px";
      todayIndicator.style.backgroundColor = "rgba(26, 30, 46, 0.8)";
      todayIndicator.style.padding = "8px 12px";
      todayIndicator.style.borderRadius = "4px";
      todayIndicator.style.fontSize = "14px";
      todayIndicator.style.zIndex = "5";
      todayIndicator.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
      todayIndicator.style.border = "1px solid rgba(255, 255, 255, 0.1)";

      const todayLabel = document.createElement("div");
      todayLabel.id = "currentPointDate";
      todayLabel.textContent = "Today";
      todayLabel.style.color = "rgba(255, 255, 255, 0.7)";
      todayLabel.style.fontSize = "12px";
      todayIndicator.appendChild(todayLabel);

      const todayValueDisplay = document.createElement("div");
      todayValueDisplay.id = "currentPointValue";
      todayValueDisplay.textContent = `${counts[counts.length - 1]} referrals`;
      todayValueDisplay.style.fontWeight = "bold";
      todayIndicator.appendChild(todayValueDisplay);

      barChartContainer.appendChild(todayIndicator);

      // Add to chart container
      chartContainer.appendChild(barChartContainer);

      // Trigger animation after a short delay
      setTimeout(() => {
        const bars = document.querySelectorAll(".bar");
        bars.forEach(bar => {
          const originalHeight = bar.style.height;
          bar.style.height = "0";

          setTimeout(() => {
            bar.style.height = originalHeight;
          }, 100);
        });
      }, 300);
    })
    .catch(error => {
      console.error("Error fetching analytics data:", error);
      // Show a fallback chart with placeholder data
      const placeholderData = Array(10).fill(0).map(() => Math.floor(Math.random() * 5));
      const placeholderDates = Array(10).fill(0).map((_, i) => `Day ${i+1}`);
      
      // Create a simple fallback chart
      // (implementation similar to above but with placeholder data)
    });
}

// CSRF token setup for Django
function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// Setup CSRF token for all AJAX requests
const csrftoken = getCookie("csrftoken")
