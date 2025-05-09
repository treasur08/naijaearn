document.addEventListener("DOMContentLoaded", () => {
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
    const pinForm = document.getElementById("pinLoginForm")
    const attemptsText = document.getElementById("attemptsText")
  
    let attempts = 3 // Default attempts
  
    // Handle input navigation for PIN fields
    function setupPinInputs(inputs) {
      inputs.forEach((input, index) => {
        // Auto-advance to next input
        input.addEventListener("input", (e) => {
          if (e.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus()
          }
  
          // Auto-submit if last digit is entered
          if (e.target.value.length === 1 && index === inputs.length - 1) {
            // Wait a moment before submitting to show the last digit
            setTimeout(() => {
              const allFilled = Array.from(inputs).every((input) => input.value.length === 1)
              if (allFilled) {
                pinForm.dispatchEvent(new Event("submit"))
              }
            }, 300)
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
  
    // Handle form submission
    pinForm.addEventListener("submit", async (e) => {
      e.preventDefault()
  
      const pin = Array.from(pinDigits)
        .map((input) => input.value)
        .join("")
      const userId = document.querySelector("input[name='user_id']").value
      const redirectUrl = document.querySelector("input[name='redirect_url']").value || `/?user_id=${userId}`
  
      // Validate PIN
      if (pin.length !== 6) {
        showPopup("Please enter a 6-digit PIN", false)
        return
      }
  
      try {
        // Submit PIN to server for verification
        const response = await fetch("/verify-pin/", {
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
          showPopup("PIN verified successfully! Redirecting...", true)
  
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = redirectUrl
          }, 1500)
        } else {
          // Decrease attempts
          attempts--
  
          // Update attempts text
          if (attempts > 0) {
            attemptsText.textContent = `You have ${attempts} attempt${attempts === 1 ? "" : "s"} remaining`
            attemptsText.style.color = attempts === 1 ? "var(--error-color)" : ""
  
            // Clear PIN inputs
            pinDigits.forEach((input) => {
              input.value = ""
            })
            pinDigits[0].focus()
  
            showPopup(data.error || "Incorrect PIN. Please try again.", false)
          } else {
            // Lock account or redirect to support
            showPopup("Too many failed attempts. Please contact support.", false)
  
            setTimeout(() => {
              window.location.href = `https://t.me/${document.querySelector("a.forgot-pin-link").href.split("=")[1]}?start=locked_account`
            }, 3000)
          }
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
  
    const changePinLink = document.getElementById("changePinLink")
  const changePinPopup = document.getElementById("changePinPopup")
  const closeChangePinPopup = document.getElementById("closeChangePinPopup")
  const changePinForm = document.getElementById("changePinForm")
  const currentPinDigits = document.querySelectorAll(".current-pin-digit")
  const newPinDigits = document.querySelectorAll(".new-pin-digit")
  const confirmNewPinDigits = document.querySelectorAll(".confirm-new-pin-digit")

  // Open change PIN popup
  changePinLink.addEventListener("click", (e) => {
    e.preventDefault()
    changePinPopup.style.display = "flex"
    
    // Focus the first input field
    setTimeout(() => {
      currentPinDigits[0].focus()
    }, 100)
  })

  // Close change PIN popup
  closeChangePinPopup.addEventListener("click", () => {
    changePinPopup.style.display = "none"
    
    // Clear all input fields
    clearPinInputs(currentPinDigits)
    clearPinInputs(newPinDigits)
    clearPinInputs(confirmNewPinDigits)
  })

  // Setup PIN input navigation for all PIN fields
  setupPinInputs(currentPinDigits)
  setupPinInputs(newPinDigits)
  setupPinInputs(confirmNewPinDigits)

  // Handle change PIN form submission
  changePinForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Get PIN values
    const currentPin = getPinValue(currentPinDigits)
    const newPin = getPinValue(newPinDigits)
    const confirmNewPin = getPinValue(confirmNewPinDigits)
    const userId = document.querySelector("input[name='user_id']").value

    // Validate inputs
    if (currentPin.length !== 6) {
      showPopup("Please enter your current 6-digit PIN", false)
      return
    }

    if (newPin.length !== 6) {
      showPopup("Please enter a new 6-digit PIN", false)
      return
    }

    if (newPin !== confirmNewPin) {
      showPopup("New PINs do not match", false)
      return
    }

    if (currentPin === newPin) {
      showPopup("New PIN must be different from current PIN", false)
      return
    }

    try {
      // Submit PIN change request to server
      const response = await fetch("/change-pin/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: JSON.stringify({
          user_id: userId,
          current_pin: currentPin,
          new_pin: newPin,
        }),
      })

      const data = await response.json()

      if (data.success) {
        showPopup("PIN changed successfully!", true)
        
        // Close popup and clear fields after 5 seconds
        setTimeout(() => {
          changePinPopup.style.display = "none"
          clearPinInputs(currentPinDigits)
          clearPinInputs(newPinDigits)
          clearPinInputs(confirmNewPinDigits)
        }, 5000)
      } else {
        showPopup(data.error || "Failed to change PIN. Please try again.", false)
      }
    } catch (error) {
      console.error("Error:", error)
      showPopup("An error occurred. Please try again later.", false)
    }
  })

  // Helper function to get PIN value from input fields
  function getPinValue(inputs) {
    return Array.from(inputs)
      .map((input) => input.value)
      .join("")
  }

  function clearPinInputs(inputs) {
    inputs.forEach((input) => {
      input.value = ""
    })
  }

  
})
  
  