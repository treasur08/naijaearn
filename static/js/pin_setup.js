document.addEventListener("DOMContentLoaded", () => {
    // Declare particlesJS variable
    let particlesJS
  
    // Initialize particles.js
    if (typeof particlesJS !== "undefined") {
      particlesJS("particles-js", {
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: "#4183ff",
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#000000",
            },
          },
          opacity: {
            value: 0.3,
            random: true,
            anim: {
              enable: true,
              speed: 1,
              opacity_min: 0.1,
              sync: false,
            },
          },
          size: {
            value: 3,
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 0.1,
              sync: false,
            },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#4183ff",
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
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200,
            },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "grab",
            },
            onclick: {
              enable: true,
              mode: "push",
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 140,
              line_linked: {
                opacity: 0.5,
              },
            },
            push: {
              particles_nb: 4,
            },
          },
        },
        retina_detect: true,
      })
    }
  
    // Theme toggle functionality
    const themeToggle = document.getElementById("themeToggle")
    const body = document.body
    const sunIcon = document.querySelector(".sun-icon")
    const moonIcon = document.querySelector(".moon-icon")
  
    // Check for saved theme preference or default to dark theme
    const currentTheme = localStorage.getItem("theme") || "dark"
    body.classList.add(currentTheme === "light" ? "light-theme" : "dark-theme")
  
    // Update icon visibility based on theme
    if (currentTheme === "light") {
      sunIcon.style.display = "none"
      moonIcon.style.display = "block"
    } else {
      sunIcon.style.display = "block"
      moonIcon.style.display = "none"
    }
  
    themeToggle.addEventListener("click", () => {
      if (body.classList.contains("light-theme")) {
        body.classList.remove("light-theme")
        body.classList.add("dark-theme")
        sunIcon.style.display = "block"
        moonIcon.style.display = "none"
        localStorage.setItem("theme", "dark")
      } else {
        body.classList.remove("dark-theme")
        body.classList.add("light-theme")
        sunIcon.style.display = "none"
        moonIcon.style.display = "block"
        localStorage.setItem("theme", "light")
      }
    })
  
    // PIN input functionality
    const pinDigits = document.querySelectorAll(".pin-digit")
    const confirmPinDigits = document.querySelectorAll(".confirm-pin-digit")
    const pinForm = document.getElementById("pinSetupForm")
    const strengthBar = document.querySelector(".strength-bar")
    const strengthValue = document.getElementById("strengthValue")
  
    // Handle input navigation for PIN fields
    function setupPinInputs(inputs) {
      inputs.forEach((input, index) => {
        // Auto-advance to next input
        input.addEventListener("input", (e) => {
          // Only allow numbers
          e.target.value = e.target.value.replace(/[^0-9]/g, "")
  
          if (e.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus()
          }
  
          if (inputs === pinDigits) {
            updatePinStrength()
          }
        })
  
        // Handle backspace to go to previous input
        input.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !e.target.value && index > 0) {
            inputs[index - 1].focus()
          }
  
          // Handle left arrow key
          if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault()
            inputs[index - 1].focus()
          }
  
          // Handle right arrow key
          if (e.key === "ArrowRight" && index < inputs.length - 1) {
            e.preventDefault()
            inputs[index + 1].focus()
          }
        })
  
        // Select all text on focus
        input.addEventListener("focus", (e) => {
          setTimeout(() => {
            e.target.select()
          }, 0)
        })
      })
    }
  
    setupPinInputs(pinDigits)
    setupPinInputs(confirmPinDigits)
  
    // Function to check PIN strength
    function updatePinStrength() {
      const pin = Array.from(pinDigits)
        .map((input) => input.value)
        .join("")
  
      if (pin.length < 6) {
        strengthBar.style.width = "0%"
        strengthValue.textContent = "Weak"
        return
      }
  
      // Check for sequential numbers (e.g., 123456, 654321)
      const isSequential = /^(?:012345|123456|234567|345678|456789|987654|876543|765432|654321|543210)$/.test(pin)
  
      // Check for repeated digits (e.g., 111111, 222222)
      const isRepeated = /^(\d)\1{5}$/.test(pin)
  
      // Check for simple patterns (e.g., 121212, 131313)
      const isPattern = /^(\d\d)\1{2}$/.test(pin) || /^(\d)\d\1\d\1\d$/.test(pin)
  
      if (isSequential || isRepeated) {
        strengthBar.style.width = "20%"
        strengthBar.style.backgroundColor = "var(--error-color)"
        strengthValue.textContent = "Very Weak"
      } else if (isPattern) {
        strengthBar.style.width = "40%"
        strengthBar.style.backgroundColor = "var(--warning-color)"
        strengthValue.textContent = "Weak"
      } else {
        // Check for digit variety
        const uniqueDigits = new Set(pin.split("")).size
  
        if (uniqueDigits <= 2) {
          strengthBar.style.width = "60%"
          strengthBar.style.backgroundColor = "var(--warning-color)"
          strengthValue.textContent = "Moderate"
        } else if (uniqueDigits <= 4) {
          strengthBar.style.width = "80%"
          strengthBar.style.backgroundColor = "var(--info-color)"
          strengthValue.textContent = "Strong"
        } else {
          strengthBar.style.width = "100%"
          strengthBar.style.backgroundColor = "var(--success-color)"
          strengthValue.textContent = "Very Strong"
        }
      }
    }
  
    // Handle form submission
    pinForm.addEventListener("submit", async (e) => {
      e.preventDefault()
  
      const pin = Array.from(pinDigits)
        .map((input) => input.value)
        .join("")
      const confirmPin = Array.from(confirmPinDigits)
        .map((input) => input.value)
        .join("")
      const userId = document.querySelector("input[name='user_id']").value
  
      // Validate PIN
      if (pin.length !== 6) {
        showPopup("Please enter a 6-digit PIN", false)
        return
      }
  
      // Check if PINs match
      if (pin !== confirmPin) {
        showPopup("PINs do not match. Please try again.", false)
        return
      }
  
      // Check PIN strength
      const isSequential = /^(?:012345|123456|234567|345678|456789|987654|876543|765432|654321|543210)$/.test(pin)
      const isRepeated = /^(\d)\1{5}$/.test(pin)
  
      if (isSequential || isRepeated) {
        showPopup("Please choose a stronger PIN. Avoid sequential or repeated digits.", false)
        return
      }
  
      try {
        // Submit PIN to server
        const response = await fetch("/api/set-pin/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
          },
          body: JSON.stringify({
            user_id: userId,
            pin: pin,
          }),
        })
  
        const data = await response.json()
  
        if (data.success) {
          showPopup("PIN set successfully! Redirecting to dashboard...", true)
  
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = `/?user_id=${userId}`
          }, 2000)
        } else {
          showPopup(data.error || "Failed to set PIN. Please try again.", false)
        }
      } catch (error) {
        console.error("Error:", error)
        showPopup("An error occurred. Please try again later.", false)
      }
    })
  
    // Show popup message
    function showPopup(message, success = true) {
      const popup = document.getElementById("popup")
      const popupMessage = popup.querySelector(".popup-message")
  
      popup.className = `popup ${success ? "success" : "error"}`
      popupMessage.textContent = message
      popup.style.display = "flex"
  
      // Add close button functionality
      const closeButton = popup.querySelector(".popup-close")
      closeButton.onclick = () => {
        popup.style.display = "none"
      }
  
      // Auto-close after 5 seconds
      setTimeout(() => {
        if (popup.style.display === "flex") {
          popup.style.display = "none"
        }
      }, 5000)
    }
  
    // Initialize Telegram Web App if available
    const tg = window.Telegram && window.Telegram.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
    }
  
    // Focus the first PIN input on page load
    pinDigits[0].focus()
  })
  
  