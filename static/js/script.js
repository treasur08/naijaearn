document.addEventListener("DOMContentLoaded", () => {
  // Initialize particles.js
  document.body.style.overflow = 'auto';
  document.body.style.overflowX = 'hidden';
  
  function preventHorizontalScroll() {
    // Add overflow-x: hidden to both body and html elements
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.width = '100%';
    document.body.style.position = 'relative';
    
    // Check for any elements extending beyond viewport width
    const viewportWidth = window.innerWidth;
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.right > viewportWidth) {
        // If element is wider than viewport, constrain it
        element.style.maxWidth = '100%';
        element.style.boxSizing = 'border-box';
      }
    });
  }

  preventHorizontalScroll();
  window.addEventListener('resize', preventHorizontalScroll);

  if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
            value_area: 800
          }
        },
        color: {
          value: "#ffffff"
        },
        shape: {
          type: "circle",
          stroke: {
            width: 0,
            color: "#000000"
          },
        },
        opacity: {
          value: 0.3,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.1,
            sync: false
          }
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: true,
            speed: 2,
            size_min: 0.1,
            sync: false
          }
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#ffffff",
          opacity: 0.2,
          width: 1
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
            rotateY: 1200
          }
        }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: true,
            mode: "grab"
          },
          onclick: {
            enable: true,
            mode: "push"
          },
          resize: true
        },
        modes: {
          grab: {
            distance: 140,
            line_linked: {
              opacity: 0.5
            }
          },
          push: {
            particles_nb: 4
          }
        }
      },
      retina_detect: true
    });
  }

  // Add staggered animation to elements
  const animateElements = () => {
    const elements = document.querySelectorAll('.fade-in, .slide-in');
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 100 * index);
    });
  };
  
  // Call animation function after a short delay
  setTimeout(animateElements, 300);

  // Theme toggle functionality with enhanced animation
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  themeToggle.addEventListener("click", () => {
    // Add transition class for smooth color changes
    body.classList.add('theme-transition');
    
    // Toggle dark mode
    body.classList.toggle("dark-mode");
    
    // Store preference
    localStorage.setItem("darkMode", body.classList.contains("dark-mode"));
    
    // Remove transition class after animation completes
    setTimeout(() => {
      body.classList.remove('theme-transition');
    }, 500);
    
    // Add ripple effect to button
    createRipple(themeToggle);
  });

  // Check for saved theme preference
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    body.classList.add("dark-mode");
  }

  // Update navigation active state with animation
  const currentPath = window.location.pathname;
  document.querySelectorAll(".bottom-nav a").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
      // Add subtle pulse animation to active nav item
      link.querySelector('.nav-icon').classList.add('pulse');
    }
  });

  // Enhanced hover effects for channel buttons
  const channelButtons = document.querySelectorAll(".channel-btn");
  channelButtons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-5px)";
      button.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.2)";
    });
    
    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
      button.style.boxShadow = "";
    });
    
    // Add click effect
    button.addEventListener("click", (e) => {
      createRipple(button, e);
    });
  });

  // Animate balance on page load with improved animation
  const balanceAmount = document.querySelector(".balance-amount");
  if (balanceAmount) {
    const targetBalance = Number.parseFloat(balanceAmount.textContent.replace(/,/g, ""));
    let currentBalance = 0;
    const duration = 2000; // 2 seconds
    const framesPerSecond = 60;
    const incrementPerFrame = targetBalance / ((duration / 1000) * framesPerSecond);
    
    // Add subtle glow effect to balance amount
    balanceAmount.style.textShadow = "0 0 10px rgba(255, 255, 255, 0.5)";

    function animateBalance() {
      currentBalance += incrementPerFrame;
      if (currentBalance < targetBalance) {
        balanceAmount.textContent = Math.floor(currentBalance).toLocaleString();
        requestAnimationFrame(animateBalance);
      } else {
        balanceAmount.textContent = targetBalance.toLocaleString();
        // Add completion effect
        balanceAmount.classList.add('balance-complete');
      }
    }

    animateBalance();
  }

  // Update check joined button functionality with enhanced feedback
  const checkJoinedButtons = document.querySelectorAll(".check-joined-btn");
  checkJoinedButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.disabled) return;

      // Add loading state
      button.innerHTML = '<div class="loading-spinner"></div>';
      button.disabled = true;

      const channelId = button.dataset.channelId;
      const userId = new URLSearchParams(window.location.search).get("user_id");

      try {
        const response = await fetch(`/check_joined/${channelId}/?user_id=${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.is_member) {
            button.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            button.disabled = true;
            button.classList.add("joined");

            // Animate the task balance change
            if (data.task_balance) {
              const currentTaskBalance = Number(document.getElementById("taskBalanceAmount").textContent.replace(/,/g, ""));
              animateBalanceChange('task', currentTaskBalance, data.task_balance);
            }
            
            // Animate the total balance change
            if (data.total_balance) {
              const currentTotalBalance = Number(document.getElementById("totalBalanceAmount").textContent.replace(/,/g, ""));
              animateBalanceChange('total', currentTotalBalance, data.total_balance);
            }

            if (data.all_joined) {
              showToast("🎉 Congratulations! You've joined all channels.", "success");
            } else {
              showToast("✅ Channel joined successfully! Earned NGN 20", "success");
            }
          } else {
            button.disabled = false;
            button.innerHTML = "Check Joined";
            showToast("⚠️ You haven't joined this channel yet. Please join and try again.", "warning");
          }
        } else {
          button.disabled = false;
          button.innerHTML = "Check Joined";
          showToast("❌ Failed to verify channel membership. Please try again.", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        button.disabled = false;
        button.innerHTML = "Check Joined";
        showToast("❌ An error occurred. Please try again later.", "error");
      }
    });
  });

  // Profile button functionality
  const profileBtn = document.getElementById("profileBtn");
  const profilePic = document.getElementById("profilePic");

  if (profileBtn && profilePic) {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const user = tg.initDataUnsafe.user;
      if (user.photo_url) {
        profilePic.src = user.photo_url;
      }
    }
    
    // Add hover effect
    profileBtn.addEventListener("mouseenter", () => {
      profilePic.style.transform = "scale(1.1)";
    });
    
    profileBtn.addEventListener("mouseleave", () => {
      profilePic.style.transform = "";
    });
  }

  // Task functionality with enhanced animations
  const taskRows = document.querySelectorAll(".task-row");
  taskRows.forEach((row) => {
    const startBtn = row.querySelector(".start-task-btn");
    const doneBtn = row.querySelector(".done-task-btn");
    const taskId = row.dataset.taskId;
    const taskLink = row.querySelector(".task-link").href;

    if (startBtn && doneBtn) {
      // Check localStorage on load
      const taskStarted = localStorage.getItem(`task_${taskId}_started`);
      if (taskStarted) {
        startBtn.style.display = "none";
        doneBtn.style.display = "inline-block";
        const startTime = Number.parseInt(taskStarted);
        const timeElapsed = Date.now() - startTime;
        
        if (timeElapsed >= 20000) {
          doneBtn.disabled = false;
        } else {
          // Add countdown timer
          doneBtn.disabled = true;
          const remainingTime = Math.ceil((20000 - timeElapsed) / 1000);
          doneBtn.innerHTML = `Wait (${remainingTime}s)`;
          
          const countdownInterval = setInterval(() => {
            const newRemainingTime = Math.ceil((20000 - (Date.now() - startTime)) / 1000);
            if (newRemainingTime <= 0) {
              clearInterval(countdownInterval);
              doneBtn.disabled = false;
              doneBtn.innerHTML = "Done Task";
              // Add subtle pulse animation
              doneBtn.classList.add('pulse');
            } else {
              doneBtn.innerHTML = `Wait (${newRemainingTime}s)`;
            }
          }, 1000);
        }
      }

      startBtn.addEventListener("click", () => {
        const taskLinkElement = row.querySelector(".task-link");
        const taskUrl = taskLinkElement ? taskLinkElement.href : null;
        
        if (taskUrl) {
          console.log("Opening task URL:", taskUrl);
          
          // Try to open the link
          const newWindow = window.open(taskUrl, '_blank');
          
          // Check if popup was blocked
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.warn("Popup blocked or failed to open. URL:", taskUrl);
            showToast("⚠️ Please allow popups to open the task", "warning");
          }
        } else {
          console.error("No task URL found");
        }
        // Add loading state
        startBtn.innerHTML = '<div class="loading-spinner"></div>';
        startBtn.disabled = true;
        
       

        fetch(`/start_task/${taskId}/?user_id=${getUserId()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              const startTime = Date.now();
              localStorage.setItem(`task_${taskId}_started`, startTime.toString());
              startBtn.style.display = "none";
              doneBtn.style.display = "inline-block";
              doneBtn.disabled = true;
              
              // Add countdown timer
              const countdownInterval = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.ceil((20000 - elapsedTime) / 1000);
                
                if (remainingTime <= 0) {
                  clearInterval(countdownInterval);
                  doneBtn.disabled = false;
                  doneBtn.innerHTML = "Done Task";
                  // Add subtle pulse animation
                  doneBtn.classList.add('pulse');
                  showToast("✅ Task ready to complete!", "info");
                } else {
                  doneBtn.innerHTML = `Wait (${remainingTime}s)`;
                }
              }, 1000);
              
              if (!taskUrl || !newWindow || newWindow.closed) {
                showToast("▶️ Task started! Click 'View Task' to open the task", "info");
              } else {
                showToast("▶️ Task started! Please wait...", "info");
              }
            } else {
              startBtn.disabled = false;
              startBtn.innerHTML = "Start Task";
              showToast("❌ Failed to start task", "error");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            startBtn.disabled = false;
            startBtn.innerHTML = "Start Task";
            showToast("❌ An error occurred", "error");
          });
      });

      doneBtn.addEventListener("click", () => {
        if (doneBtn.disabled) return;
        
        // Add loading state
        doneBtn.innerHTML = '<div class="loading-spinner"></div>';
        doneBtn.disabled = true;
        
        fetch(`/complete_task/${taskId}/?user_id=${getUserId()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              localStorage.removeItem(`task_${taskId}_started`);
              
              // Add completion animation
              row.classList.add('task-complete-animation');
              
              setTimeout(() => {
                row.innerHTML = `
                <span class="task-title">${row.querySelector(".task-title").textContent}</span>
                <button class="task-completed-btn" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </button>
              `;
                row.classList.remove('task-complete-animation');
              }, 500);
              
              showToast("🎉 Task completed successfully!", "success");
              
              // Animate balance change
              if (data.task_balance) {
                const currentTaskBalance = Number(document.getElementById("taskBalanceAmount").textContent.replace(/,/g, ""));
                animateBalanceChange('task', currentTaskBalance, data.task_balance);
              }
              
              // Animate total balance change
              if (data.total_balance) {
                const currentTotalBalance = Number(document.getElementById("totalBalanceAmount").textContent.replace(/,/g, ""));
                animateBalanceChange('total', currentTotalBalance, data.total_balance);
              }
            } else {
              doneBtn.disabled = false;
              doneBtn.innerHTML = "Done Task";
              showToast(data.error || "❌ Failed to complete task", "error");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            doneBtn.disabled = false;
            doneBtn.innerHTML = "Done Task";
            showToast("❌ An error occurred. Please try again.", "error");
          });
      });
    }
  });

  // ===== ENHANCED BALANCE CARDS FUNCTIONALITY =====
  const balanceCardsWrapper = document.getElementById("balanceCardsWrapper");
  const balanceCards = document.querySelectorAll(".balance-card");
  const balanceDots = document.querySelectorAll(".balance-dot");
  let currentCardIndex = 0;
  let autoRotateInterval;
  let isAnimating = false;
  let isDragging = false;
  let startX, startY, initialX, initialY;
  let xOffset = 0, yOffset = 0;
  let cardWidth = 0;
  let touchStartTime = 0;
  let touchTimeout = null;
  let isPaused = false;

  // Store initial positions of cards
  function initializeCards() {
    cardWidth = balanceCards[0].offsetWidth;
    
    // Set initial active card
    balanceCards[0].classList.add("active");
    balanceDots[0].classList.add("active");
    
    // Start auto-rotation
    startAutoRotate();
  }

  // Initialize cards on page load
  initializeCards();

  // Function to show a specific card with animation
  function showCard(index, direction = null) {
    if (isAnimating) return;
    isAnimating = true;
    
    // Get previous active index
    const prevIndex = currentCardIndex;
    
    // Update current index
    currentCardIndex = index;
    
    // Determine animation direction if not specified
    if (direction === null) {
      direction = index > prevIndex ? "left" : "right";
      // Handle wrap-around cases
      if (prevIndex === balanceCards.length - 1 && index === 0) direction = "left";
      if (prevIndex === 0 && index === balanceCards.length - 1) direction = "right";
    }
    
    // Remove all position classes first
    balanceCards.forEach((card) => {
      card.classList.remove("active", "transition-left", "transition-right", "coming-next", "coming-after-next");
      // Reset any inline transforms
      card.style.transform = "";
    });
    
    // Add appropriate classes based on direction
    balanceCards.forEach((card, i) => {
      if (i === index) {
        // Active card
        card.classList.add("active");
      } else if (direction === "left") {
        // When moving left (next card)
        if (i === prevIndex) {
          card.classList.add("transition-right");
        } else if (i === (index + 1) % balanceCards.length) {
          card.classList.add("coming-next");
        } else if (i === (index + 2) % balanceCards.length) {
          card.classList.add("coming-after-next");
        } else {
          card.classList.add("transition-left");
        }
      } else {
        // When moving right (previous card)
        if (i === prevIndex) {
          card.classList.add("transition-left");
        } else if (i === (index - 1 + balanceCards.length) % balanceCards.length) {
          card.classList.add("coming-next");
        } else if (i === (index - 2 + balanceCards.length) % balanceCards.length) {
          card.classList.add("coming-after-next");
        } else {
          card.classList.add("transition-right");
        }
      }
    });
    
    // Update dots
    balanceDots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
    
    // Allow next animation after transition completes
    setTimeout(() => {
      isAnimating = false;
    }, 500);
    
    // Restart auto-rotation
    restartAutoRotate();
  }

  // Add click event listeners to dots
  balanceDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number.parseInt(dot.getAttribute("data-index"));
      showCard(index);
    });
  });

  // Function to start auto-rotation
  function startAutoRotate() {
    if (autoRotateInterval) clearInterval(autoRotateInterval);
    
    autoRotateInterval = setInterval(() => {
      if (!isAnimating && !isDragging && !isPaused) {
        const nextIndex = (currentCardIndex + 1) % balanceCards.length;
        showCard(nextIndex, "left");
      }
    }, 5000); // Rotate every 5 seconds
  }

  // Function to restart auto-rotation
  function restartAutoRotate() {
    clearInterval(autoRotateInterval);
    startAutoRotate();
  }

  // Function to pause auto-rotation
  function pauseAutoRotate() {
    isPaused = true;
    clearTimeout(touchTimeout);
    touchTimeout = setTimeout(() => {
      isPaused = false;
    }, 5000); // Resume after 5 seconds of inactivity
  }

  // Touch and mouse event handlers for card dragging
  balanceCards.forEach((card) => {
    // Touch events
    card.addEventListener("touchstart", dragStart, { passive: false });
    card.addEventListener("touchmove", dragMove, { passive: false });
    card.addEventListener("touchend", dragEnd);
    
    // Mouse events
    card.addEventListener("mousedown", dragStart);
    card.addEventListener("click", handleCardClick);
  });

  document.addEventListener("mousemove", dragMove);
  document.addEventListener("mouseup", dragEnd);

  function handleCardClick(e) {
    // If we were dragging, prevent the click
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Otherwise, make this card active
    const cardIndex = Array.from(balanceCards).indexOf(e.currentTarget);
    if (cardIndex !== currentCardIndex) {
      showCard(cardIndex);
    }
  }

  function dragStart(e) {
    if (isAnimating) return;
    
    pauseAutoRotate();
    
    if (e.type === "touchstart") {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchStartTime = Date.now();
    } else {
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault(); // Prevent text selection
    }
    
    // Only start dragging on the active card
    const card = e.currentTarget;
    if (card.classList.contains("active")) {
      isDragging = true;
      card.classList.add("dragging");
      
      // Get initial position
      const style = window.getComputedStyle(card);
      // Declare WebKitCSSMatrix to avoid undefined variable error
      const matrix = new (window.WebKitCSSMatrix || window.DOMMatrix)(style.transform);
      initialX = matrix.m41 || 0; // translateX value
      initialY = matrix.m42 || 0; // translateY value
      
      xOffset = initialX;
      yOffset = initialY;
    }
  }

  function dragMove(e) {
    if (!isDragging) return;
    
    let currentX, currentY;
    
    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling while dragging
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }
    
    // Calculate how far we've moved
    const xDiff = currentX - startX;
    const yDiff = currentY - startY;
    
    // Update position
    xOffset = initialX + xDiff;
    yOffset = initialY + yDiff;
    
    // Find the active card and update its position
    const activeCard = document.querySelector(".balance-card.active");
    if (activeCard) {
      // Limit horizontal movement more than vertical
      const limitedXOffset = Math.max(-cardWidth * 0.5, Math.min(cardWidth * 0.5, xOffset));
      const limitedYOffset = Math.max(-30, Math.min(30, yOffset));
      
      activeCard.style.transform = `translateX(${limitedXOffset}px) translateY(${limitedYOffset}px) scale(1)`;
      
      // Update opacity of other cards based on drag direction
      const dragPercentage = limitedXOffset / (cardWidth * 0.5); // -1 to 1
      
      // Get next and previous indices
      const nextIndex = (currentCardIndex + 1) % balanceCards.length;
      const prevIndex = (currentCardIndex - 1 + balanceCards.length) % balanceCards.length;
      
      // Update next card (when dragging left)
      if (dragPercentage < 0) {
        const nextCard = balanceCards[nextIndex];
        const opacity = Math.min(1, Math.abs(dragPercentage) * 1.5);
        nextCard.style.opacity = 0.6 + opacity * 0.4;
        nextCard.style.transform = `translateX(0) translateY(0) scale(${0.95 + Math.abs(dragPercentage) * 0.05})`;
        nextCard.style.zIndex = 5;
      }
      
      // Update previous card (when dragging right)
      if (dragPercentage > 0) {
        const prevCard = balanceCards[prevIndex];
        const opacity = Math.min(1, Math.abs(dragPercentage) * 1.5);
        prevCard.style.opacity = 0.6 + opacity * 0.4;
        prevCard.style.transform = `translateX(0) translateY(0) scale(${0.95 + Math.abs(dragPercentage) * 0.05})`;
        prevCard.style.zIndex = 5;
      }
    }
  }

  function dragEnd(e) {
    if (!isDragging) return;
    
    const activeCard = document.querySelector(".balance-card.active");
    if (activeCard) {
      activeCard.classList.remove("dragging");
      
      // Get current position
      const style = window.getComputedStyle(activeCard);
      const matrix = new (window.WebKitCSSMatrix || window.DOMMatrix)(style.transform);
      const currentX = matrix.m41 || 0;
      
      // Calculate swipe speed
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      const swipeSpeed = Math.abs(currentX - initialX) / touchDuration;
      
      // Determine if we should change cards
      const swipeThreshold = cardWidth * 0.2; // 20% of card width
      const speedThreshold = 0.5; // pixels per millisecond
      
      if (Math.abs(currentX) > swipeThreshold || swipeSpeed > speedThreshold) {
        // Determine direction
        if (currentX < 0) {
          // Swiped left - show next card
          const nextIndex = (currentCardIndex + 1) % balanceCards.length;
          showCard(nextIndex, "left");
        } else {
          // Swiped right - show previous card
          const prevIndex = (currentCardIndex - 1 + balanceCards.length) % balanceCards.length;
          showCard(prevIndex, "right");
        }
      } else {
        // Not enough to change cards - reset position
        activeCard.style.transform = "";
        
        // Reset other cards
        balanceCards.forEach(card => {
          if (!card.classList.contains("active")) {
            card.style.opacity = "";
            card.style.transform = "";
            card.style.zIndex = "";
          }
        });
      }
    }
    
    isDragging = false;
    isPaused = false;
  }

  // Add event listeners for container to pause/resume auto-rotation
  const balanceCardsContainer = document.querySelector(".balance-cards-container");
  if (balanceCardsContainer) {
    balanceCardsContainer.addEventListener("mouseenter", () => {
      pauseAutoRotate();
    });
    
    balanceCardsContainer.addEventListener("mouseleave", () => {
      isPaused = false;
    });
  }

  // Add a function to handle card flipping animation
  function flipCard(index) {
    if (isAnimating) return;
    isAnimating = true;
    
    const currentCard = balanceCards[currentCardIndex];
    const targetCard = balanceCards[index];
    
    // Add exit animation to current card
    currentCard.classList.add("card-exit");
    
    // After exit animation completes, update active card and start entrance animation
    setTimeout(() => {
      // Remove all animation classes
      balanceCards.forEach(card => {
        card.classList.remove("active", "card-exit", "card-entrance");
      });
      
      // Update current index
      currentCardIndex = index;
      
      // Add active class to new card
      targetCard.classList.add("active", "card-entrance");
      
      // Update dots
      balanceDots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
      
      // Allow next animation after entrance completes
      setTimeout(() => {
        isAnimating = false;
      }, 500);
    }, 250);
    
    // Restart auto-rotation
    restartAutoRotate();
  }

  // Add double-tap/double-click to flip card
  let lastTapTime = 0;
  balanceCards.forEach((card, index) => {
    card.addEventListener("dblclick", () => {
      flipCard(index);
    });
    
    card.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;
      
      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        e.preventDefault();
        flipCard(index);
      }
      
      lastTapTime = currentTime;
    });
  });

  // Add keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (isAnimating) return;
    
    if (e.key === "ArrowLeft") {
      const prevIndex = (currentCardIndex - 1 + balanceCards.length) % balanceCards.length;
      showCard(prevIndex, "right");
    } else if (e.key === "ArrowRight") {
      const nextIndex = (currentCardIndex + 1) % balanceCards.length;
      showCard(nextIndex, "left");
    }
  });

  // Add swipe gesture detection for mobile
  let touchstartX = 0;
  let touchendX = 0;
  
  const balanceContainer = document.querySelector('.balance-cards-container');
  
  balanceContainer.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  balanceContainer.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  }, { passive: true });
  
  function handleSwipeGesture() {
    if (isAnimating || isDragging) return;
    
    const swipeDistance = touchendX - touchstartX;
    const swipeThreshold = window.innerWidth * 0.1; // 10% of screen width
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance < 0) {
        // Swipe left - next card
        const nextIndex = (currentCardIndex + 1) % balanceCards.length;
        showCard(nextIndex, 'left');
      } else {
        // Swipe right - previous card
        const prevIndex = (currentCardIndex - 1 + balanceCards.length) % balanceCards.length;
        showCard(prevIndex, 'right');
      }
    }
  }

  // Balance visibility toggle
  const toggleBalanceBtn = document.getElementById('toggleBalance');
  const headerButtons = document.querySelector('.header-buttons');
  
  // Check if balance was previously hidden
  const headerEyeBtn = document.createElement('button');
  headerEyeBtn.className = 'header-eye-btn';
  headerEyeBtn.id = 'headerEyeBtn';
  headerEyeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  `;
  headerEyeBtn.style.display = 'none';
  headerButtons.insertBefore(headerEyeBtn, headerButtons.firstChild);
  
  // Function to update balance visibility
  function updateBalanceVisibility(isHidden) {
    if (isHidden) {
      document.querySelector('.balance-cards-container').style.display = 'none';
      headerEyeBtn.style.display = 'flex';
    } else {
      document.querySelector('.balance-cards-container').style.display = 'block';
      headerEyeBtn.style.display = 'none';
    }
    
    // Store preference
    localStorage.setItem('balanceHidden', isHidden);
  }
  
  // Check if balance was previously hidden
  const isBalanceHidden = localStorage.getItem('balanceHidden') === 'true';
  updateBalanceVisibility(isBalanceHidden);
  
  // Toggle button in balance card
  if (toggleBalanceBtn) {
    toggleBalanceBtn.addEventListener('click', () => {
      updateBalanceVisibility(true);
      createRipple(toggleBalanceBtn);
      showToast('Balance hidden', 'info');
    });
  }
  
  // Header eye button to show balance
  if (headerEyeBtn) {
    headerEyeBtn.addEventListener('click', () => {
      updateBalanceVisibility(false);
      if (typeof createRipple === 'function') {
        createRipple(headerEyeBtn);
      }
      showToast('Balance visible', 'info');
    });
  }
  
  // Function to animate balance change
  function animateBalanceChange(type, fromValue, toValue) {
    let balanceElement;
    
    switch(type) {
      case 'task':
        balanceElement = document.getElementById("taskBalanceAmount");
        break;
      case 'affiliate':
        balanceElement = document.getElementById("affiliateBalanceAmount");
        break;
      case 'total':
        balanceElement = document.getElementById("totalBalanceAmount");
        break;
      default:
        balanceElement = document.getElementById("totalBalanceAmount");
    }
    
    if (!balanceElement) return;
    
    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds
    
    // Add highlight effect
    balanceElement.style.textShadow = "0 0 15px rgba(255, 255, 255, 0.8)";
    
    function updateBalance() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      if (elapsed >= duration) {
        balanceElement.textContent = toValue.toLocaleString();
        
        // Remove highlight effect after animation
        setTimeout(() => {
          balanceElement.style.textShadow = "";
        }, 500);
        
        return;
      }
      
      const progress = elapsed / duration;
      // Use easeOutQuart easing function for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = fromValue + (toValue - fromValue) * easedProgress;
      
      balanceElement.textContent = Math.floor(currentValue).toLocaleString();
      requestAnimationFrame(updateBalance);
    }
    
    updateBalance();
  }
  // Function to get CSRF token
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Enhanced toast function with types
  function showToast(message, type = "info") {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    });
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const toastContent = document.createElement("div");
    toastContent.className = "toast-content";
    
    // Add icon based on type
    let icon = '';
    switch(type) {
      case 'success':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        break;
      case 'warning':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        break;
      case 'error':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        break;
      default:
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    const iconElement = document.createElement("span");
    iconElement.className = "toast-icon";
    iconElement.innerHTML = icon;
    
    const messageElement = document.createElement("span");
    messageElement.className = "toast-message";
    messageElement.textContent = message;
    
    toastContent.appendChild(iconElement);
    toastContent.appendChild(messageElement);
    toast.appendChild(toastContent);
    
    document.body.appendChild(toast);
    
    // Trigger reflow for animation
    toast.offsetHeight;
    
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  // Function to create ripple effect
  function createRipple(button, e) {
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    button.appendChild(ripple);
    
    let x, y;
    
    if (e) {
      const rect = button.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      x = button.offsetWidth / 2;
      y = button.offsetHeight / 2;
    }
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  function getUserId() {
    return new URLSearchParams(window.location.search).get("user_id");
  }
  
  // Add CSS for new animations and effects
  const style = document.createElement('style');
  style.textContent = `
    .theme-transition {
      transition: background-color 0.5s ease, color 0.5s ease;
    }
    
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .balance-complete {
      animation: balanceComplete 0.5s ease;
    }
    
    @keyframes balanceComplete {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .task-complete-animation {
      animation: taskComplete 0.5s ease;
    }
    
    @keyframes taskComplete {
      0% { transform: translateX(0); opacity: 1; }
      50% { transform: translateX(10px); opacity: 0.5; }
      100% { transform: translateX(0); opacity: 1; }
    }
    
    .ripple {
      position: absolute;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .toast-success {
      border-left: 4px solid #4caf50;
    }
    
    .toast-warning {
      border-left: 4px solid #ff9800;
    }
    
    .toast-error {
      border-left: 4px solid #f44336;
    }
    
    .toast-info {
      border-left: 4px solid #2196f3;
    }
    
    /* Enhanced balance card styles */
    .balance-card {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: var(--card-radius);
      padding: 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: var(--shadow-medium);
      overflow: hidden;
      background: var(--background-light);
      transform: translateZ(0);
      opacity: 0.8;
      cursor: grab;
    }

    .balance-card:active {
      cursor: grabbing;
    }

    /* Initial positions for cards */
    .balance-card.task-balance {
      border: 2px solid var(--primary-color);
      z-index: 3;
      transform: translateX(0) translateY(0) scale(1);
    }

    .balance-card.affiliate-balance {
      border: 2px solid #9c27b0;
      z-index: 2;
      transform: translateX(0) translateY(0) scale(0.95);
      opacity: 0.7;
    }

    .balance-card.total-balance {
      border: 2px solid #2ecc71;
      z-index: 1;
      transform: translateX(0) translateY(0) scale(0.9);
      opacity: 0.6;
    }

    /* Active card styles */
    .balance-card.active {
      transform: translateX(0) translateY(-10px) scale(1) !important;
      z-index: 10 !important;
      opacity: 1 !important;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3) !important;
      animation: cardPulse 2s infinite ease-in-out;
    }

    /* Card animation classes */
    .balance-card.transition-left {
      transform: translateX(-120%) translateY(0) scale(0.9);
      opacity: 0;
      z-index: 1;
    }

    .balance-card.transition-right {
      transform: translateX(120%) translateY(0) scale(0.9);
      opacity: 0;
      z-index: 1;
    }

    .balance-card.coming-next {
      transform: translateX(0) translateY(0) scale(0.95);
      opacity: 0.7;
      z-index: 2;
    }

    .balance-card.coming-after-next {
      transform: translateX(0) translateY(0) scale(0.9);
      opacity: 0.6;
      z-index: 1;
    }
    
    /* Add animation for card flipping */
    @keyframes cardEntrance {
      from {
        transform: translateY(20px) scale(0.8);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    @keyframes cardExit {
      from {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      to {
        transform: translateY(-20px) scale(0.8);
        opacity: 0;
      }
    }

    .card-entrance {
      animation: cardEntrance 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .card-exit {
      animation: cardExit 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    
    /* Add a subtle pulse animation to the active card */
    @keyframes cardPulse {
      0% {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
      }
      50% {
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
      }
      100% {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
      }
    }
    
    /* Add styles for dragging state */
    .balance-card.dragging {
      transition: none !important;
      cursor: grabbing;
    }
  `;
  document.head.appendChild(style);

  // Make WhatsApp button draggable
  const whatsappFloat = document.getElementById("whatsappFloat")
  if (whatsappFloat) {
    let isDragging = false
    let longPressTimer = null
    let offsetX, offsetY
    let hasMoved = false
    
    // Initial position from localStorage or default
    const savedPosition = localStorage.getItem("whatsappPosition")
    if (savedPosition) {
      const { left, top } = JSON.parse(savedPosition)
      whatsappFloat.style.left = left + "px"
      whatsappFloat.style.top = top + "px"
      whatsappFloat.style.right = "auto"
      whatsappFloat.style.bottom = "auto"
    }
    
    // Replace the icon with the real WhatsApp icon
    whatsappFloat.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175.216 175.552" fill="#ffffff">
        <path d="M 89.4 0.2 C 41.3 0.2 2.3 39.2 2.3 87.3 C 2.3 102.7 6.7 117.4 14.9 129.9 L 2.3 173.2 L 46.6 160.8 C 58.6 168.3 72.6 172.3 87.3 172.3 L 87.4 172.3 C 135.5 172.3 174.9 133.3 174.9 85.2 C 174.9 62.1 165.7 40.4 149.4 24.1 C 133.1 7.8 111.6 0.2 89.4 0.2 Z M 87.4 157.7 C 74.3 157.7 61.5 153.8 50.6 146.7 L 48 145.1 L 21.2 152.5 L 28.7 126.4 L 26.9 123.6 C 19.1 112.2 14.9 98.7 14.9 84.9 C 14.9 47.2 47.5 16.9 87.5 16.9 C 105.7 16.9 122.8 23.2 135.8 36.2 C 148.8 49.2 156.5 66.3 156.5 84.5 C 156.4 124.5 127.4 157.7 87.4 157.7 Z M 127.2 103.9 C 125 102.8 114.4 97.6 112.4 96.8 C 110.4 96.1 109 95.7 107.5 97.9 C 106.1 100.1 102 104.9 100.7 106.4 C 99.5 107.8 98.2 108 96 106.9 C 93.8 105.8 86.9 103.5 78.8 96.3 C 72.5 90.6 68.3 83.6 67 81.4 C 65.8 79.2 66.9 78 68 76.9 C 69 75.9 70.2 74.3 71.3 73 C 72.4 71.7 72.8 70.8 73.5 69.3 C 74.2 67.8 73.9 66.5 73.3 65.4 C 72.8 64.3 68.6 53.7 66.8 49.3 C 65.1 45 63.3 45.6 62 45.5 C 60.8 45.4 59.3 45.4 57.9 45.4 C 56.5 45.4 54.1 45.9 52.1 48.1 C 50.1 50.3 44.5 55.5 44.5 66.1 C 44.5 76.7 52.1 86.9 53.2 88.4 C 54.3 89.9 68.2 111.8 89.9 121.1 C 95.5 123.7 99.8 125.2 103.2 126.3 C 108.7 128.1 113.7 127.8 117.7 127.2 C 122.2 126.6 130.7 122 132.5 116.9 C 134.3 111.8 134.3 107.4 133.8 106.4 C 133.3 105.4 131.8 104.9 129.6 103.8 L 127.2 103.9 Z"/>
      </svg>
    `;
    
    // Touch events for mobile
    whatsappFloat.addEventListener("touchstart", handleTouchStart)
    whatsappFloat.addEventListener("touchmove", handleTouchMove)
    whatsappFloat.addEventListener("touchend", handleTouchEnd)
    
    // Mouse events for desktop
    whatsappFloat.addEventListener("mousedown", handleMouseDown)
    
    function handleTouchStart(e) {
      // Start a timer to detect long press
      longPressTimer = setTimeout(() => {
        startDragTouch(e);
      }, 300); // 300ms is a good threshold for long press
      
      hasMoved = false;
      e.preventDefault(); // Prevent default to avoid text selection
    }
    
    function handleTouchMove(e) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      if (isDragging) {
        dragTouch(e);
        hasMoved = true;
      }
    }
    
    function handleTouchEnd(e) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      if (isDragging) {
        endDrag();
      } else if (!hasMoved) {
        // This was a tap, not a drag - open the link
        window.open("https://wa.me/+2349015010957?text=Hello%20I%20need%20help%20with%20Fluxx%20Earn", "_blank");
      }
    }
    
    function handleMouseDown(e) {
      // For mouse, we'll use the same long-press approach
      longPressTimer = setTimeout(() => {
        startDrag(e);
      }, 300);
      
      hasMoved = false;
      
      // Add mouse move and up listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      e.preventDefault(); // Prevent default to avoid text selection
    }
    
    function handleMouseMove(e) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      if (isDragging) {
        drag(e);
        hasMoved = true;
      }
    }
    
    function handleMouseUp(e) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        
        if (!hasMoved) {
          // This was a click, not a drag - open the link
          window.open("https://wa.me/+2349015010957?text=Hello%20I%20need%20help%20with%20Fluxx%20Earn", "_blank");
        }
      }
      
      if (isDragging) {
        endDrag();
      }
      
      // Remove the event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    function startDrag(e) {
      isDragging = true;
      whatsappFloat.classList.add("dragging");
      const rect = whatsappFloat.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    }

    function startDragTouch(e) {
      isDragging = true;
      whatsappFloat.classList.add("dragging");
      const touch = e.touches[0];
      const rect = whatsappFloat.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    }

    function drag(e) {
      if (!isDragging) return;
      
      // Calculate new position
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;

      // Apply new position
      whatsappFloat.style.left = x + "px";
      whatsappFloat.style.top = y + "px";
      whatsappFloat.style.right = "auto";
      whatsappFloat.style.bottom = "auto";
    }

    function dragTouch(e) {
      if (!isDragging || e.targetTouches.length !== 1) return;

      const touch = e.targetTouches[0];

      // Calculate new position
      const x = touch.clientX - offsetX;
      const y = touch.clientY - offsetY;

      // Apply new position
      whatsappFloat.style.left = x + "px";
      whatsappFloat.style.top = y + "px";
      whatsappFloat.style.right = "auto";
      whatsappFloat.style.bottom = "auto";
      
      // Prevent default to avoid scrolling while dragging
      e.preventDefault();
    }

    function endDrag() {
      if (isDragging) {
        whatsappFloat.classList.remove("dragging");
        
        // Save position to localStorage
        const rect = whatsappFloat.getBoundingClientRect();
        localStorage.setItem(
          "whatsappPosition",
          JSON.stringify({
            left: rect.left,
            top: rect.top,
          })
        );
      }
      
      isDragging = false;
    }
  }
});