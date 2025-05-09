document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("activationForm")
  const inputs = document.querySelectorAll(".key-digit")
  const popup = document.getElementById("popup")
  const pasteFromClipboardBtn = document.querySelector(".paste-clipboard")
  const clipboardPermission = document.querySelector(".clipboard-permission")

  // Get CSRF token
  const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value

  // Handle input navigation
  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      // Convert to uppercase
      e.target.value = e.target.value.toUpperCase()

      // Only keep the first character
      e.target.value = e.target.value.slice(0, 1)

      // Auto-advance to next input
      if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus()
      }

      // Check if all inputs are filled to auto-submit
      if (index === inputs.length - 1 && e.target.value.length === 1) {
        const allFilled = Array.from(inputs).every((input) => input.value.length === 1)
        if (allFilled) {
          // Wait a moment before submitting to show the last digit
          setTimeout(() => {
            form.dispatchEvent(new Event("submit"))
          }, 500)
        }
      }
    })

    input.addEventListener("keydown", (e) => {
      // Handle backspace to go to previous input
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

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const activationKey = Array.from(inputs)
      .map((input) => input.value)
      .join("")

    if (activationKey.length !== 6) {
      showPopup("Please enter a valid 6-digit activation key", false)
      return
    }

    // Show loading state
    showLoadingState(true)

    // Get user_id from URL
    const userId = new URLSearchParams(window.location.search).get("user_id")

    try {
      // Submit activation key
      const response = await fetch("/activate/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          user_id: userId,
          activation_key: activationKey,
        }),
      })

      const data = await response.json()

      // Hide loading state
      showLoadingState(false)

      if (data.success) {
        showPopup("Account activated successfully! Redirecting to dashboard...", true)
        setTimeout(() => {
          window.location.href = data.redirect_url || `/set-pin/?user_id=${userId}`
        }, 2000)
      } else {
        showPopup(data.error || "Invalid activation key. Please try again.", false)
        // Clear inputs on error
        inputs.forEach((input) => (input.value = ""))
        inputs[0].focus()
      }
    } catch (error) {
      console.error("Error:", error)
      showLoadingState(false)
      showPopup("An error occurred. Please check your connection and try again.", false)
    }
  })

  // Show loading state
  function showLoadingState(isLoading) {
    const submitBtn = document.querySelector(".submit-btn")
    if (isLoading) {
      submitBtn.disabled = true
      submitBtn.innerHTML = `
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `
    } else {
      submitBtn.disabled = false
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `
    }
  }

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

    // Auto-close error messages after 5 seconds
    if (!success) {
      setTimeout(() => {
        if (popup.style.display === "flex") {
          popup.style.display = "none"
        }
      }, 5000)
    }
  }

  // Create clipboard paste button if not exists
  if (!document.querySelector(".paste-clipboard")) {
    const clipboardContainer = document.createElement("div")
    clipboardContainer.className = "clipboard-container"

    const pasteFromClipboard = document.createElement("div")
    pasteFromClipboard.className = "paste-clipboard"
    pasteFromClipboard.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
      Paste from Clipboard
    `

    clipboardContainer.appendChild(pasteFromClipboard)
    document.querySelector(".key-input").insertAdjacentElement("afterend", clipboardContainer)
  }

  // Create clipboard permission notification if not exists
  if (!document.querySelector(".clipboard-permission")) {
    const clipboardPermission = document.createElement("div")
    clipboardPermission.className = "clipboard-permission"
    clipboardPermission.textContent = "Please allow clipboard access to paste your activation key"
    document.body.appendChild(clipboardPermission)
  }

  // Handle paste from clipboard button
  const pasteFromClipboard = document.querySelector(".paste-clipboard")
  pasteFromClipboard.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText()
      const digits = text.replace(/\D/g, "").slice(0, 6)

      if (digits.length === 0) {
        // Try to extract alphanumeric characters if no digits found
        const alphanumeric = text.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)
        if (alphanumeric.length > 0) {
          fillInputs(alphanumeric)
        } else {
          showPopup("No valid activation key found in clipboard", false)
        }
      } else {
        fillInputs(digits)
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err)

      // Show clipboard permission notification
      const clipboardPermission = document.querySelector(".clipboard-permission")
      clipboardPermission.style.display = "block"

      setTimeout(() => {
        clipboardPermission.style.display = "none"
      }, 3000)
    }
  })

  // Handle paste event anywhere in the document
  document.addEventListener("paste", (e) => {
    const activeElement = document.activeElement
    const isInputFocused = Array.from(inputs).includes(activeElement)

    // Only handle paste if one of our inputs is focused
    if (isInputFocused) {
      e.preventDefault()
      const paste = (e.clipboardData || window.clipboardData).getData("text")
      const alphanumeric = paste.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)

      if (alphanumeric.length > 0) {
        fillInputs(alphanumeric)
      }
    }
  })

  // Fill inputs with characters
  function fillInputs(chars) {
    inputs.forEach((input, index) => {
      if (index < chars.length) {
        input.value = chars[index].toUpperCase()
        input.classList.add("fade-in")

        // Remove animation class after animation completes
        setTimeout(() => {
          input.classList.remove("fade-in")
        }, 500)
      } else {
        input.value = ""
      }
    })

    // Focus the next empty input or the last one
    const emptyInputIndex = Array.from(inputs).findIndex((input) => !input.value)
    if (emptyInputIndex !== -1) {
      inputs[emptyInputIndex].focus()
    } else if (chars.length >= inputs.length) {
      inputs[inputs.length - 1].focus()

      // Auto-submit if all inputs are filled
      setTimeout(() => {
        form.dispatchEvent(new Event("submit"))
      }, 500)
    }
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

  // Focus the first input on page load
  inputs[0].focus()
})

