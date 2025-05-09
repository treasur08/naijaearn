document.addEventListener("DOMContentLoaded", () => {
  // Declare particlesJS variable
  let particlesJS

  // Initialize particles background
  if (typeof particlesJS !== "undefined") {
    particlesJS("particles-js", {
      // Particles configuration remains the same
      // ...
    })
  }

  // Theme toggle functionality
  const themeToggle = document.getElementById("themeToggle")
  const body = document.body
  const themeIcon = themeToggle.querySelector("i")

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "dark-mode") {
    body.classList.add("dark-mode")
    themeIcon.classList.remove("fa-moon")
    themeIcon.classList.add("fa-sun")
  }

  // Toggle theme
  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode")

    if (body.classList.contains("dark-mode")) {
      themeIcon.classList.remove("fa-moon")
      themeIcon.classList.add("fa-sun")
      localStorage.setItem("theme", "dark-mode")
    } else {
      themeIcon.classList.remove("fa-sun")
      themeIcon.classList.add("fa-moon")
      localStorage.setItem("theme", "light-mode")
    }
  })

  // FAQ accordion functionality
  const faqItems = document.querySelectorAll(".faq-item")

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question")

    question.addEventListener("click", () => {
      // Close all other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("active")) {
          otherItem.classList.remove("active")
        }
      })

      // Toggle current item
      item.classList.toggle("active")
    })
  })

  // WhatsApp float button - MODIFIED to remove dragging functionality
  const whatsappFloat = document.getElementById("whatsappFloat")

  if (whatsappFloat) {
    // Remove all drag-related code and just handle the click
    whatsappFloat.addEventListener("click", () => {
      // Use the external link handling logic for consistency
      const url = "https://wa.me/1234567890"; // Replace with your actual WhatsApp number
      const tgApp = window.Telegram && window.Telegram.WebApp;
      
      if (tgApp) {
        console.log('Opening WhatsApp in Telegram:', url);
        tgApp.openLink(url);
      } else {
        console.log('Opening WhatsApp in browser:', url);
        window.open(url, "_blank");
      }
    });
  }

  // Toast notification function
  function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast")
    const toastMessage = document.getElementById("toastMessage")

    toastMessage.textContent = message
    toast.classList.add("show")
    toast.classList.remove("hide")

    setTimeout(() => {
      toast.classList.add("hide")
      toast.classList.remove("show")
    }, duration)
  }

  // Add click event to pricing buttons
  const pricingButtons = document.querySelectorAll(".pricing-btn")

  pricingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showToast("Please contact our team to get started with this package!")
    })
  })

  // Add animation on scroll
  const animateOnScroll = () => {
    const elements = document.querySelectorAll(".slide-in, .slide-up, .fade-in")

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top
      const screenPosition = window.innerHeight / 1.2

      if (elementPosition < screenPosition) {
        element.style.opacity = "1"
        element.style.transform = "translateY(0)"
      }
    })
  }

  // Initial check for elements in view
  animateOnScroll()

  // Listen for scroll events
  window.addEventListener("scroll", animateOnScroll)

  const externalLinks = document.querySelectorAll('.external-link');
  const tgApp = window.Telegram && window.Telegram.WebApp;

  externalLinks.forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault();
          const url = this.getAttribute('data-url');
          
          if (tgApp) {
              console.log('Opening external URL in Telegram:', url);
              tgApp.openLink(url);
          } else {
              console.log('Opening external URL in browser:', url);
              window.open(url, '_blank');
          }
      });
  });
})
