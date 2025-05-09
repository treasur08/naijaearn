document.addEventListener("DOMContentLoaded", () => {
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
  
    // Gift Code Modal
    const addBalanceBtn = document.getElementById("addBalanceBtn")
    const giftCodeModal = document.getElementById("giftCodeModal")
    const closeModalBtn = document.querySelector(".close-modal")
    const giftCodeForm = document.getElementById("giftCodeForm")
  
    // Open modal when add balance button is clicked
    addBalanceBtn.addEventListener("click", () => {
      giftCodeModal.style.display = "flex"
    })
  
    // Close modal when close button is clicked
    closeModalBtn.addEventListener("click", () => {
      giftCodeModal.style.display = "none"
    })
  
    // Close modal when clicking outside the modal content
    window.addEventListener("click", (e) => {
      if (e.target === giftCodeModal) {
        giftCodeModal.style.display = "none"
      }
    })
  
    // Handle gift code form submission
    giftCodeForm.addEventListener("submit", async (e) => {
      e.preventDefault()
  
      const giftCode = document.getElementById("giftCode").value.trim()
  
      if (!giftCode) {
        showToast("Please enter a valid gift code")
        return
      }
  
      try {
        const formData = new FormData(giftCodeForm)
        const response = await fetch(giftCodeForm.action, {
          method: "POST",
          body: formData,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        })
  
        const data = await response.json()
  
        if (data.success) {
          showToast(data.message || "Gift code redeemed successfully!")
          giftCodeModal.style.display = "none"
  
          // Update balance display if provided
          if (data.new_balance) {
            const balanceElement = document.querySelector(".balance span")
            if (balanceElement) {
              balanceElement.textContent = `NGN ${Number.parseFloat(data.new_balance).toLocaleString()}`
  
              // Add highlight effect
              balanceElement.classList.add("balance-updated")
              setTimeout(() => {
                balanceElement.classList.remove("balance-updated")
              }, 2000)
            }
          }
  
          // Reset form
          giftCodeForm.reset()
        } else {
          showToast(data.message || "Invalid gift code. Please try again.")
        }
      } catch (error) {
        console.error("Error:", error)
        showToast("An error occurred. Please try again later.")
      }
    })
  
    // Start Job button functionality
    const startJobBtns = document.querySelectorAll(".start-job-btn")
    startJobBtns.forEach((btn) => {
      btn.addEventListener("click", async function () {
        const jobId = this.dataset.jobId
  
        try {
          const response = await fetch(`/api/start-job/${jobId}/`, {
            method: "POST",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Content-Type": "application/json",
            },
          })
  
          const data = await response.json()
  
          if (data.success) {
            showToast("Job started successfully!")
            // You might want to update the UI or redirect
            setTimeout(() => {
              window.location.href = `/job-detail/${jobId}/`
            }, 1000)
          } else {
            showToast(data.message || "Failed to start job. Please try again.")
          }
        } catch (error) {
          console.error("Error:", error)
          showToast("An error occurred. Please try again later.")
        }
      })
    })
  
    // Submit Proof button functionality
    const submitProofBtns = document.querySelectorAll(".submit-proof-btn")
    submitProofBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const jobId = this.dataset.jobId
        window.location.href = `/submit-proof/${jobId}/`
      })
    })
  
    // Toast notification function
    function showToast(message, duration = 3000) {
      const toast = document.getElementById("toast")
      const toastMessage = toast.querySelector(".toast-message")
  
      toastMessage.textContent = message
      toast.classList.add("show")
      toast.classList.remove("hide")
  
      setTimeout(() => {
        toast.classList.remove("show")
        toast.classList.add("hide")
      }, duration)
    }
  
    // Function to get CSRF token
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
  
    // Initialize Telegram Web App if available
    const tg = window.Telegram && window.Telegram.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
    }
  })
  
  