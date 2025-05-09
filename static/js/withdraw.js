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
          value: "#ffffff",
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

  // Form elements
  const form = document.getElementById("withdrawalForm")
  const bankSelect = document.getElementById("bank")
  const accountInput = document.getElementById("accountNumber")
  const amountInput = document.getElementById("amount")
  const emailInput = document.getElementById("emailAddress")
  const accountHolder = document.getElementById("accountHolder")
  const accountNameDisplay = document.getElementById("accountName")
  const verifyAccountBtn = document.getElementById("verifyAccountBtn")

  const balanceElement = document.getElementById("balanceAmount");
  const affiliateBalanceOption = document.getElementById("affiliateBalanceOption");
  const taskBalanceOption = document.getElementById("taskBalanceOption");
  const affiliateBalanceRadio = document.getElementById("affiliateBalance");
  const taskBalanceRadio = document.getElementById("taskBalance");
  const taskBalanceNotice = document.getElementById("taskBalanceNotice");
  const taskWithdrawalMessage = document.getElementById("taskWithdrawalMessage");
  const selectedBalanceType = document.getElementById("selectedBalanceType");
  const pinInputs = document.querySelectorAll(".pin-input")
  const pinComplete = document.getElementById("pinComplete")

  
  const affiliateBalance = parseFloat(document.getElementById("affiliateBalanceValue").textContent.replace(/,/g, ""));
  const taskBalance = parseFloat(document.getElementById("taskBalanceValue").textContent.replace(/,/g, ""));
  
  let currentBalance = affiliateBalance;
  balanceElement.textContent = affiliateBalance.toLocaleString();
  
  // Check if task balance withdrawals are allowed today
  const isTaskWithdrawalDay = true;
  
  // Function to calculate days until the 30th
  // function getDaysUntil30th() {
  //   const today = new Date();
  //   const currentMonth = today.getMonth();
  //   const currentYear = today.getFullYear();
    
  //   // Create a date for the 30th of current month
  //   let targetDate = new Date(currentYear, currentMonth, 30);
    
  //   // If today is past the 30th, get next month's 30th
  //   if (today.getDate() > 30 || (today.getDate() === 30 && today.getHours() >= 18)) {
  //     targetDate = new Date(currentYear, currentMonth + 1, 30);
  //   }
    
  //   // Calculate difference in days
  //   const diffTime = targetDate - today;
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
  //   return diffDays;
  // }
  
  // Handle balance source selection
  affiliateBalanceRadio.addEventListener("change", function() {
    if (this.checked) {
      currentBalance = affiliateBalance;
      balanceElement.textContent = affiliateBalance.toLocaleString();
      selectedBalanceType.value = "affiliate";
      taskBalanceNotice.style.display = "none";
      document.querySelector('.min-withdrawal-notice .notice-text').textContent = 
            'Minimum withdrawal amount is ₦800 for Affilates and ₦400 for Taskers.';
      validateAmount();
    }
  });
  
  taskBalanceRadio.addEventListener("change", function() {
    if (this.checked) {
      if (!isTaskWithdrawalDay) {
        // If not withdrawal day, show notice but don't allow selection
        this.checked = false;
        affiliateBalanceRadio.checked = true;
        taskBalanceNotice.style.display = "flex";
        return;
      }
      
      currentBalance = taskBalance;
      balanceElement.textContent = taskBalance.toLocaleString();
      selectedBalanceType.value = "task";
      taskBalanceNotice.style.display = "flex";
      document.querySelector('.min-withdrawal-notice .notice-text').textContent = 
            'Minimum withdrawal amount is ₦800 for Affilates and ₦400 for Taskers.';
      validateAmount();
    }
  });
  
  // Bank codes mapping
  const bankCodes = {
    "al-barakah-mfb": "090133",
    "9payment": "120001",
    "ab-mfb": "090270",
    "abbey-mb": "070010",
    "above-only-mfb": "090260",
    "abu-mfb": "090197",
    access: "044",
    diamond: "063",
    "access-mobile": "323",
    "access-money": "100013",
    "access-yellow": "100052",
    "accion-mfb": "090134",
    "addosser-mfb": "090160",
    "adeyemi-mfb": "090268",
    "ag-mb": "100028",
    "al-hayat-mfb": "090277",
    "alekun-mfb": "090259",
    "alert-mfb": "090297",
    "allworkers-mfb": "090131",
    "alpha-kapital-mfb": "090169",
    "amju-unique-mfb": "090180",
    "amml-mfb": "090116",
    "apeks-mfb": "090143",
    "arise-mfb": "090282",
    "aso-savings": "090001",
    "astrapolaris-mfb": "090172",
    "auchi-mfb": "090264",
    "baines-mfb": "090188",
    "balogun-mfb": "090326",
    "bayero-mfb": "090316",
    "bc-kash-mfb": "090127",
    "bipc-mfb": "090336",
    "boc-trust-mfb": "090176",
    "bosak-mfb": "090176",
    "bowen-mfb": "090148",
    "brent-mb": "070015",
    "brethren-mfb": "090293",
    "bridgeway-mfb": "090393",
    "brightway-mfb": "090308",
    cellulant: "100005",
    "cems-mfb": "090154",
    "chams-mobile": "100015",
    "chikum-mfb": "090141",
    "cit-mfb": "090144",
    citibankng: "023",
    "consumer-mfb": "090130",
    "contec-global": "100032",
    cmfb: "060001",
    "covenant-mfb": "070006",
    "credit-afrique-mfb": "090159",
    "daylight-mfb": "090167",
    "e-barcs-mfb": "090156",
    "eagle-flight-mfb": "090294",
    eartholeum: "100021",
    eco: "050",
    "ecobank-express-account": "100008",
    "ecobank-mobile": "100010",
    "edfin-mfb": "090310",
    "ekondo-mfb": "090097",
    "emeral-mfb": "090273",
    "empire-trust-mfb": "090114",
    enterprise: "000019",
    "esan-mfb": "090189",
    "eso-e-mfb": "090166",
    "e-tranzact": "100006",
    "evangel-mfb": "090304",
    "evergreen-mfb": "090332",
    "eyowo-mfb": "090328",
    "fast-mfb": "090179",
    "first-mobile": "100014",
    "fbn-mortgages-ltd": "090107",
    "fbnquest-meb": "060002",
    "fcmb-easy-account": "100031",
    fcmb: "214",
    "fct-mfb": "090290",
    "fed-uni-duste-mfb": "090318",
    "federalPoly-nasarawa-mfb": "090298",
    fets: "100001",
    "ffs-mfb": "090153",
    fidelity: "070",
    "Fidelity-mobile": "100019",
    "fidfund-mfb": "090126",
    "finatrust-mfb": "090111",
    "firmus-mfb": "090366",
    firstbank: "011",
    "first-gen-mb": "070014",
    "first-multiple-mfb": "090163",
    "first-option-mfb": "090285",
    "first-royal-mfb": "090164",
    "first-trust-mob": "070002",
    "firstMonie-wallet": "100014",
    flutterwave: "110002",
    "fortis-mfb": "070016",
    "fortis-mobile": "100016",
    fsdh: "400001",
    "fullrange-mfb": "090145",
    "futo-mfb": "090158",
    "gashua-mfb": "090168",
    "gateway-mb": "070009",
    "globus-bank": "103",
    "glory-mfb": "090278",
    "go-money": "100022",
    "goodnews-mfb": "090385",
    "gowans-mfb": "090122",
    "greenbank-mfb": "090178",
    "greenville-mfb": "090269",
    "greenwich-mb": "060003",
    "grooming-mfb": "090195",
    "gt-mobile": "100009",
    "gtb-mobile": "100009",
    gtb: "058",
    "hackman-mfb": "090147",
    "haggai-mb": "070017",
    "hala-mfb": "090291",
    "hasal-mfb": "090121",
    hedonmark: "100017",
    heritage: "030",
    "ibile-mfb": "090118",
    "ikenne-mfb": "090324",
    "ikire-mfb": "090275",
    "imo-state-mfb": "090258",
    "imperial-homes-mob": "100024",
    "infinity-mfb": "090157",
    "infinity-mb": "070013",
    "innovectives-kesh": "100029",
    intellfin: "100027",
    "irl-mfb": "090149",
    jaiz: "301",
    "jubliee-life": "090003",
    "kadick-integration": "100026",
    "kadpoly-mfb": "090320",
    "kcmb-mfb": "090191",
    kegow: "100030",
    keystone: "082",
    "kontagora-mfb": "090299",
    "kuda-mfb": "090267",
    "la-fayette-mfb": "090155",
    "lagos-building": "070012",
    "lapo-mfb": "090177",
    "lavender-mfb": "090271",
    "letshego-mfb": "090261",
    "lovonus-mfb": "090265",
    m36: "100035",
    "mainland-mfb": "090323",
    "mainstreet-mfb": "090171",
    "malachy-mfb": "090174",
    "manny-mfb": "090383",
    "mautech-mfb": "090367",
    "mayfair-mfb": "090321",
    "mayFresh-mortgage": "070019",
    "megapraise-mfb": "090280",
    "meridian-mfb": "090380",
    "microcred-mfb": "090136",
    "midland-mfb": "090194",
    "mint-finex-mfb": "090281",
    mkudi: "100011",
    "money-trust-mfb": "090129",
    "money-box": "100020",
    "mutual-benefits-mfb": "090190",
    "mutual-trust-mfb": "090151",
    "nagarta-mfb": "090152",
    "navy-mfb": "090263",
    "ndiorah-mfb": "090128",
    "new-dawn-mfb": "090205",
    "new-prudential": "090108",
    "nip-vb": "999999",
    "nirsal-mfb": "090194",
    "nnew-women-mfb": "090283",
    "nova-meb": "060003",
    "npf-mfb": "070001",
    "oche-mfb": "090333",
    "ohafia-mfb": "090119",
    "okpoga-mfb": "090161",
    "olabisi-onabanjo-mfb": "090272",
    "omiye-mfb": "090295",
    "omoluabi-mob": "070007",
    "one-finance": "100026",
    paga: "100002",
    "page-mfb": "090139",
    palmpay: "100033",
    parallex: "526",
    parkway: "311",
    "parkway-readycash": "100003",
    "parrallex-mfb": "090004",
    "patrick-gold-mfb": "090317",
    "pay-attitude-online": "110001",
    paycom: "305",
    "pecanTrust-mfb": "090137",
    "pennywise-mfb": "090196",
    "personal-trust-mfb": "090135",
    "petra-mfb": "090165",
    "pillar-mfb": "090289",
    "platinum-mb": "070004",
    polaris: "076",
    "polyuwanna-mfb": "090296",
    "prestige-mfb": "090274",
    providus: "101",
    "purplemoney-mfb": "090303",
    "quickfund-mfb": "090261",
    "rahama-mfb": "090170",
    "rand-meb": "502",
    "refuge-mb": "070011",
    "regent-mfb": "090125",
    "reliance-mfb": "090173",
    "renmoney-mfb": "090198",
    "rephidim-mfb": "090322",
    "richway-mfb": "090132",
    "royal-exchange-mfb": "090138",
    "rubies-mfb": "090175",
    "safe-haven-mfb": "090286",
    safetrust: "090006",
    "sagamu-mfb": "090140",
    "seed-capital-mfb": "090112",
    sparkle: "090325",
    "stanbic-ibtc-ease-wallet": "100007",
    stanbic: "221",
    "stanbic-mobile": "100007",
    "standard-chartered": "068",
    "stanford-mfb": "090162",
    "stellas-mfb": "090262",
    sterling: "232",
    "sterling-mobile": "100023",
    "sulsap-mfb": "090305",
    suntrust: "100",
    tagpay: "100023",
    taj: "302",
    "tcf-mfb": "090115",
    "teasy-mobile": "100004",
    titan: "102",
    "trident-mfb": "090146",
    "trust-mfb": "090327",
    "trustbond-mb": "070011",
    "trustfund-mfb": "090276",
    "u-and-c-mfb": "090315",
    "unaab-mfb": "090331",
    "uniben-mfb": "090266",
    "unical-mfb": "090193",
    unionbank: "032",
    uba: "033",
    unity: "215",
    "unn-mfb": "090251",
    "verite-mfb": "090123",
    "vfd-mfb": "566",
    "virtue-mfb": "090150",
    "visa-mfb": "090110",
    "vt-networks": "100012",
    wema: "035",
    "wetland-mfb": "090120",
    "xslnce-mfb": "090124",
    "yes-mfb": "090142",
    zenith: "057",
    "zenith-mobile": "100018",
    "zinternet-kongapay": "100025",
  }
  
  function calculateAmountAfterFee(amount) {
    const feePercentage = 0.06; // 6%
    const fee = amount * feePercentage;
    return amount - fee;
  }

  let verifiedAccount = null
  let isProcessing = false

  let pinValue = ""

  // Auto-focus next input when a digit is entered
  pinInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      // Only allow digits
      e.target.value = e.target.value.replace(/[^0-9]/g, "")

      if (e.target.value) {
        // Move to next input
        if (index < pinInputs.length - 1) {
          pinInputs[index + 1].focus()
        }
      }

      // Update the hidden field with complete PIN
      updatePinValue()
    })

    // Handle backspace
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        pinInputs[index - 1].focus()
        pinInputs[index - 1].value = ""
        updatePinValue()
      }
    })

    // Handle paste
    input.addEventListener("paste", (e) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text").trim()
      if (/^\d+$/.test(pastedData) && pastedData.length <= pinInputs.length) {
        for (let i = 0; i < pastedData.length; i++) {
          if (index + i < pinInputs.length) {
            pinInputs[index + i].value = pastedData[i]
          }
        }
        updatePinValue()
        if (index + pastedData.length < pinInputs.length) {
          pinInputs[index + pastedData.length].focus()
        }
      }
    })
  })

  function updatePinValue() {
    pinValue = Array.from(pinInputs)
      .map((input) => input.value)
      .join("")
    pinComplete.value = pinValue
  }

  /// Only allow digits in the amount input
  amountInput.addEventListener("input", function (e) {
    // Only keep digits
    this.value = this.value.replace(/[^\d]/g, "")

    // Validate amount against balance
    validateAmount()
  })

  // Format when field loses focus

  // Validate amount against balance
  function validateAmount() {
    const errorContainer = document.getElementById("amount-error")
    if (errorContainer) errorContainer.remove()

    const amount = Number.parseFloat(amountInput.value.replace(/,/g, "")) || 0
    const minAmount = selectedBalanceType.value === "task" ? 400 : 800;

    // Remove any existing classes
    amountInput.classList.remove("input-error", "input-success")

    if (amount < minAmount) {
      amountInput.classList.add("input-error")
      if (!document.getElementById("amount-error")) {
          const error = createErrorMessage(`Amount must be at least ₦${minAmount}`)
          amountInput.parentNode.after(error)
      }
      return false
  } else if (amount > currentBalance) {
      amountInput.classList.add("input-error")
      if (!document.getElementById("amount-error")) {
        const error = createErrorMessage(`Amount exceeds your ${selectedBalanceType.value} balance of ₦${currentBalance.toLocaleString()}`);
        amountInput.parentNode.after(error);
      }
      return false
    } else {
      amountInput.classList.add("input-success")
      return true
    }
  }

  // Create error message element
  function createErrorMessage(message, id = "amount-error") {
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.id = id
    errorDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <p>${message}</p>
    `
    return errorDiv
  }

  // Verify account number when user finishes typing
  let verifyTimeout
  accountInput.addEventListener("input", (e) => {
    clearTimeout(verifyTimeout)
    accountHolder.style.display = "none"
    verifiedAccount = null

    // Remove any existing error
    const errorContainer = document.getElementById("account-error")
    if (errorContainer) errorContainer.remove()

    // Remove any existing classes
    accountInput.classList.remove("input-error", "input-success")

    if (e.target.value.length === 10 && bankSelect.value) {
      verifyTimeout = setTimeout(() => verifyAccount(), 500)
    } else if (e.target.value.length > 0 && e.target.value.length !== 10) {
      accountInput.classList.add("input-error")
      if (!document.getElementById("account-error")) {
        const error = createErrorMessage("Account number must be 10 digits", "account-error")
        accountInput.parentNode.after(error)
      }
    }
  })

  bankSelect.addEventListener("change", () => {
    accountHolder.style.display = "none"
    verifiedAccount = null

    // Remove any existing classes
    bankSelect.classList.remove("input-error", "input-success")

    if (bankSelect.value) {
      bankSelect.classList.add("input-success")
      if (accountInput.value.length === 10) {
        verifyAccount()
      }
    } else {
      bankSelect.classList.add("input-error")
    }
  })

  // Manual verification button
  verifyAccountBtn.addEventListener("click", () => {
    if (accountInput.value.length === 10 && bankSelect.value) {
      verifyAccount()
    } else {
      // Remove any existing error
      const errorContainer = document.getElementById("account-error")
      if (errorContainer) errorContainer.remove()

      // Add error class
      accountInput.classList.add("input-error")

      // Show error message
      if (!document.getElementById("account-error")) {
        const error = createErrorMessage(
          "Please select a bank and enter a valid 10-digit account number",
          "account-error",
        )
        accountInput.parentNode.after(error)
      }

      showModal("error", "Verification Error", "Please select a bank and enter a valid 10-digit account number.")
    }
  })

  async function verifyAccount() {
    const bankSlug = bankSelect.value
    const bankCode = bankCodes[bankSlug]
    const accountNumber = accountInput.value

    if (!bankCode || !accountNumber) {
      return
    }

    // Show loading state
    showModal("loading", "Verifying Account", "Please wait while we verify your account details...")
    verifyAccountBtn.classList.add("verifying")

    try {
      const response = await fetch("/api/verify-account/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: accountNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        verifiedAccount = data.data
        accountNameDisplay.textContent = data.data.account_name
        accountHolder.style.display = "block"

        // Add success class
        accountInput.classList.add("input-success")

        showModal(
          "success",
          "Account Verified",
          `Account Name: ${data.data.account_name}<br>Bank: ${data.data.bank_name}`,
        )
      } else {
        verifiedAccount = null
        accountHolder.style.display = "none"

        // Add error class
        accountInput.classList.add("input-error")

        // Show error message
        if (!document.getElementById("account-error")) {
          const error = createErrorMessage(
            data.error || "Could not verify account. Please check your details and try again.",
            "account-error",
          )
          accountInput.parentNode.after(error)
        }

        showModal(
          "error",
          "Verification Failed",
          data.error || "Could not verify account. Please check your details and try again.",
        )
      }
    } catch (error) {
      console.error("Error:", error)
      verifiedAccount = null
      accountHolder.style.display = "none"

      // Add error class
      accountInput.classList.add("input-error")

      showModal("error", "Error", "Failed to verify account. Please check your connection and try again.")
    } finally {
      verifyAccountBtn.classList.remove("verifying")
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate email
  emailInput.addEventListener("input", (e) => {
    // Remove any existing error
    const errorContainer = document.getElementById("email-error")
    if (errorContainer) errorContainer.remove()

    // Remove any existing classes
    emailInput.classList.remove("input-error", "input-success")

    if (e.target.value.length > 0) {
      if (isValidEmail(e.target.value)) {
        emailInput.classList.add("input-success")
      } else {
        emailInput.classList.add("input-error")
        if (!document.getElementById("email-error")) {
          const error = createErrorMessage("Please enter a valid email address", "email-error")
          emailInput.parentNode.after(error)
        }
      }
    }
  })

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    if (isProcessing) {
      return // Prevent multiple submissions
    }

    // Validate form
    let isValid = true

    // Validate PIN
    if (pinComplete.value.length !== 6) {
      isValid = false
      pinInputs.forEach((input) => input.classList.add("input-error"))
      if (!document.getElementById("pin-error")) {
        const error = createErrorMessage("Please enter your 6-digit PIN", "pin-error")
        document.querySelector(".pin-input-container").after(error)
      }
    } else {
      pinInputs.forEach((input) => input.classList.remove("input-error"))
      const pinError = document.getElementById("pin-error")
      if (pinError) pinError.remove()
    }

    // Validate bank
    if (!bankSelect.value) {
      bankSelect.classList.add("input-error")
      isValid = false

      if (!document.getElementById("bank-error")) {
        const error = createErrorMessage("Please select a bank", "bank-error")
        bankSelect.parentNode.after(error)
      }
    }

    // Validate account
    if (!verifiedAccount) {
      accountInput.classList.add("input-error")
      isValid = false

      if (!document.getElementById("account-error")) {
        const error = createErrorMessage("Please verify your account details", "account-error")
        accountInput.parentNode.after(error)
      }
    }

    // Validate email
    if (!isValidEmail(emailInput.value)) {
      emailInput.classList.add("input-error")
      isValid = false

      if (!document.getElementById("email-error")) {
        const error = createErrorMessage("Please enter a valid email address", "email-error")
        emailInput.parentNode.after(error)
      }
    }

    // Validate amount
    if (!validateAmount()) {
      isValid = false
    }

    if (!isValid) {
      showModal("error", "Form Error", "Please correct the errors in the form before submitting.")
      return
    }

    try {
      // First verify PIN
      const pinVerifyResponse = await fetch("/verify-pin/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          user_id: new URLSearchParams(window.location.search).get("user_id"),
          pin: pinComplete.value,
        }),
      })

      const pinVerifyData = await pinVerifyResponse.json()

      if (!pinVerifyData.success) {
        showModal("error", "PIN Verification Failed", pinVerifyData.error || "Incorrect PIN. Please try again.")
        pinInputs.forEach((input) => {
          input.value = ""
          input.classList.add("input-error")
        })
        pinInputs[0].focus()
        updatePinValue()
        return
      }

      // PIN verified successfully, proceed with withdrawal

      // Get amount value (remove commas)
      const amount = Number.parseFloat(amountInput.value.replace(/,/g, ""))
      
      const enteredAmount = Number.parseFloat(amountInput.value.replace(/,/g, ""));
    
      // Calculate amount after fee deduction (6%)
      const amountAfterFee = calculateAmountAfterFee(enteredAmount);

      // Validate minimum amount
      const minAmount = selectedBalanceType.value === "task" ? 400 : 800;
      if (enteredAmount < minAmount) {
        showModal("error", "Invalid Amount", `The minimum withdrawal amount is ₦${minAmount}.`);
        return;
      }

      // Validate against balance
      if (enteredAmount > currentBalance) {
        showModal(
          "error",
          "Insufficient Balance",
          `Your balance (₦${currentBalance.toLocaleString()}) is insufficient for this withdrawal.`
        );
        return;
      }

      const bankSlug = bankSelect.value
      const bankCode = bankCodes[bankSlug]
      const selectedBankOption = bankSelect.options[bankSelect.selectedIndex];
      const bankDisplayText = selectedBankOption.textContent;
      const balanceType = selectedBalanceType.value

      // Show loading state
      showModal("loading", "Processing Withdrawal", "Please wait while we process your withdrawal request...")
      isProcessing = true

      try {
        const response = await fetch("/api/process-withdrawal/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({
            user_id: new URLSearchParams(window.location.search).get("user_id"),
            amount: amountAfterFee,
            bank: bankDisplayText,
            account_number: accountInput.value,
            account_name: verifiedAccount.account_name,
            email: emailInput.value,
            balance_type: balanceType
          }),
        })

        const data = await response.json()

        if (data.success) {
          showModal(
            "success",
            "Withdrawal Initiated",
            `Your withdrawal of ₦${amount.toLocaleString()} has been initiated successfully.<br><br>Reference: ${data.reference}<br><br>You will receive a confirmation shortly.`,
          )

          if (selectedBalanceType.value === "affiliate") {
            const newAffiliateBalance = affiliateBalance - enteredAmount;
            document.getElementById("affiliateBalanceValue").textContent = newAffiliateBalance.toLocaleString();
            if (affiliateBalanceRadio.checked) {
              balanceElement.textContent = newAffiliateBalance.toLocaleString();
            }
          } else {
            const newTaskBalance = taskBalance - enteredAmount;
            document.getElementById("taskBalanceValue").textContent = newTaskBalance.toLocaleString();
            if (taskBalanceRadio.checked) {
              balanceElement.textContent = newTaskBalance.toLocaleString();
            }
          }
          // Reset form
          form.reset()
          verifiedAccount = null
          accountHolder.style.display = "none"

          // Remove success classes
          const successInputs = document.querySelectorAll(".input-success")
          successInputs.forEach((input) => input.classList.remove("input-success"))

          // Reload page after 3 seconds to refresh withdrawal history
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        } else {
          showModal("error", "Withdrawal Failed", data.error || "Failed to process withdrawal. Please try again later.")
        }
      } catch (error) {
        console.error("Error:", error)
        showModal("error", "Error", "Failed to process withdrawal. Please check your connection and try again.")
      } finally {
        isProcessing = false
      }
    } catch (error) {
      console.error("Error verifying PIN:", error)
      showModal("error", "Error", "Failed to verify PIN. Please check your connection and try again.")
    }
  })

  // Modal functionality
  const modal = document.getElementById("popup")
  const modalTitle = modal.querySelector(".modal-title")
  const modalMessage = modal.querySelector(".modal-message")
  const modalCloseBtn = modal.querySelector(".modal-close")
  const modalOkBtn = modal.querySelector(".modal-btn-primary")

  function showModal(type, title, message) {
    modal.className = "modal " + type
    modalTitle.textContent = title
    modalMessage.innerHTML = message
    modal.style.display = "flex"

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        if (modal.style.display === "flex") {
          modal.style.display = "none"
        }
      }, 5000)
    }
  }

  // Close modal when clicking the close button or OK button
  modalCloseBtn.addEventListener("click", () => {
    modal.style.display = "none"
  })

  modalOkBtn.addEventListener("click", () => {
    modal.style.display = "none"
  })

  // Close modal when clicking outside the modal content
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
    }
  })

  // Function to animate balance change
  function animateBalanceChange(fromValue, toValue) {
    const balanceElement = document.getElementById("balanceAmount")
    if (!balanceElement) return

    const startTime = Date.now()
    const duration = 1500 // 1.5 seconds

    // Add highlight effect
    balanceElement.style.textShadow = "0 0 15px rgba(255, 255, 255, 0.8)"

    function updateBalance() {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime

      if (elapsed >= duration) {
        balanceElement.textContent = toValue.toLocaleString()

        // Remove highlight effect after animation
        setTimeout(() => {
          balanceElement.style.textShadow = ""
        }, 500)

        return
      }

      const progress = elapsed / duration
      // Use easeOutQuart easing function for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 4)
      const currentValue = fromValue + (toValue - fromValue) * easedProgress

      balanceElement.textContent = Math.floor(currentValue).toLocaleString()
      requestAnimationFrame(updateBalance)
    }

    updateBalance()
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

    // Set profile picture if available
    const profilePic = document.getElementById("profilePic")
    if (profilePic && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user
      if (user.photo_url) {
        profilePic.src = user.photo_url
      }
    }
  }
})

