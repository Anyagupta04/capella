/* ==========================================================================
   CAPELLA INTERACTIVE PROTOTYPE SCRIPT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Global URL parameter helper
  const urlParams = new URLSearchParams(window.location.search);
  const actionParam = urlParams.get('action');
  // Highlight active nav link based on current page
  highlightActiveNav();
  /* ==========================================================================
     PAGE-SPECIFIC INITIALIZATION
     ========================================================================== */
  
  // 1. Passenger Dashboard (ride.html)
  if (document.getElementById('rideBookingForm') || document.getElementById('chatForm')) {
    initRideSimulation(actionParam);
  }
  // 2. Driver Hub (drivers.html)
  if (document.getElementById('hoursSlider')) {
    initDriverCalculator();
    initDriverSignupForm();
  }
  // 3. Business Model (business.html)
  if (document.getElementById('bar1')) {
    initBusinessChart();
  }
});
/* ==========================================================================
   NAVBAR HIGHLIGHTER
   ========================================================================== */
function highlightActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    // Remove active class first
    link.classList.remove('active');
    
    // Check if link href matches path
    const href = link.getAttribute('href');
    if (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}
/* ==========================================================================
   RIDE / PASSENGER DASHBOARD SIMULATION (ride.html)
   ========================================================================== */
function initRideSimulation(actionParam) {
  // DOM Elements
  const bookingPanel = document.getElementById('bookingPanel');
  const activeRidePanel = document.getElementById('activeRidePanel');
  const rideBookingForm = document.getElementById('rideBookingForm');
  const confirmBookingBtn = document.getElementById('confirmBookingBtn');
  const terminateRideBtn = document.getElementById('terminateRideBtn');
  
  const destinationSelect = document.getElementById('destination');
  const subtotalFareText = document.getElementById('subtotalFare');
  
  const rideStatusText = document.getElementById('rideStatusText');
  const rideStatusDot = document.getElementById('rideStatusDot');
  const driverDetails = document.getElementById('driverDetails');
  const etaText = document.getElementById('etaText');
  
  // Map Elements
  const carMarker = document.getElementById('carMarker');
  const routePath = document.getElementById('routePath');
  
  // Chat Elements
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatBox = document.getElementById('chatBox');
  
  // SOS Elements
  const triggerSosBtn = document.getElementById('triggerSosBtn');
  const navSosBtn = document.getElementById('nav-sos-btn');
  const cancelSosBtn = document.getElementById('cancelSosBtn');
  const sosOverlay = document.getElementById('sosOverlay');
  const sosCountdownText = document.getElementById('sosCountdown');
  // Simulation variables
  let routeAnimationId = null;
  let sosTimerId = null;
  let activeRideState = 'idle'; // idle, matching, enroute, active, arrived
  
  // Pre-configured buddy replies
  const buddyReplies = [
    "Got it, Anya! I'm actively watching your coordinates on my dispatch display. The path looks direct.",
    "Everything looks stable from our end. Let me know if you want me to stay on standby or if you need to talk.",
    "No worries, Anya. Take your time! I'm right here in your pocket during the whole commute.",
    "Your driver Sarah has an excellent safety record (4.95★). Rest easy, I am monitoring the transit route in real-time.",
    "I see you are getting closer to downtown. We'll verify your checkout code as soon as you stop!"
  ];
  let replyIndex = 0;
  // 1. Destination fare update listener
  destinationSelect.addEventListener('change', () => {
    if (destinationSelect.value === '680') {
      subtotalFareText.textContent = '₹250';
    } else {
      subtotalFareText.textContent = '₹130';
    }
  });
  // 2. Handle Ride Booking Request
  rideBookingForm.addEventListener('submit', () => {
    confirmBookingBtn.disabled = true;
    confirmBookingBtn.textContent = 'Searching Guard Captain...';
    activeRideState = 'matching';
    rideStatusText.textContent = 'Matching Driver...';
    rideStatusDot.style.background = 'var(--color-warning)';
    rideStatusDot.style.boxShadow = '0 0 8px var(--color-warning)';
    // Mock network delay to find a verified driver
    setTimeout(() => {
      bookingPanel.style.display = 'none';
      activeRidePanel.style.display = 'block';
      driverDetails.style.opacity = '1';
      
      // Start "En Route" state
      activeRideState = 'enroute';
      rideStatusText.textContent = 'Driver En Route';
      rideStatusDot.style.background = 'var(--color-success)';
      rideStatusDot.style.boxShadow = '0 0 8px var(--color-success)';
      etaText.textContent = '3 mins';
      // Initialize car position at start of route (0%)
      carMarker.style.visibility = 'visible';
      moveCarOnRoute(0);
      // Transition to active ride trip after 3 seconds
      setTimeout(() => {
        if (activeRideState === 'enroute') {
          activeRideState = 'active';
          rideStatusText.textContent = 'Ride Active';
          etaText.textContent = '9 mins';
          
          // Animate the car along the route path
          animateCarPath(30000); // 30 seconds trip simulation
          
          // Trigger a buddy message
          addChatMessage('Evelyn (Smart Buddy)', 'Sarah has picked you up. I have initiated live Route Guard tracking. How are you feeling?', 'msg-received');
        }
      }, 3000);
    }, 2000);
  });
  // 3. Terminate/Cancel Ride
  terminateRideBtn.addEventListener('click', () => {
    cancelRideSimulation();
  });
  function cancelRideSimulation() {
    activeRideState = 'idle';
    if (routeAnimationId) {
      cancelAnimationFrame(routeAnimationId);
      routeAnimationId = null;
    }
    
    // Reset layout UI
    bookingPanel.style.display = 'block';
    activeRidePanel.style.display = 'none';
    confirmBookingBtn.disabled = false;
    confirmBookingBtn.textContent = 'Search Verified Driver';
    
    rideStatusText.textContent = 'Driver Matching...';
    rideStatusDot.style.background = 'var(--color-success)';
    rideStatusDot.style.boxShadow = '0 0 8px var(--color-success)';
    driverDetails.style.opacity = '0.5';
    etaText.textContent = '-- mins';
    carMarker.style.visibility = 'hidden';
    
    addChatMessage('System Notification', 'Ride booking was cancelled and connection reset.', 'msg-received');
  }
  // 4. SVG Car Movement Logic
  function moveCarOnRoute(percentage) {
    const totalLength = routePath.getTotalLength();
    const currentLength = (percentage / 100) * totalLength;
    const point = routePath.getPointAtLength(currentLength);
    
    carMarker.setAttribute('transform', `translate(${point.x}, ${point.y})`);
  }
  function animateCarPath(duration) {
    const startTime = performance.now();
    
    function update(time) {
      if (activeRideState !== 'active') return;
      
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const percentage = progress * 100;
      
      moveCarOnRoute(percentage);
      // Decrement ETA based on progress
      const remainingMinutes = Math.max(1, Math.ceil(9 * (1 - progress)));
      etaText.textContent = `${remainingMinutes} mins`;
      
      if (progress < 1) {
        routeAnimationId = requestAnimationFrame(update);
      } else {
        // Arrived at destination!
        activeRideState = 'arrived';
        rideStatusText.textContent = 'Arrived Safely';
        etaText.textContent = 'Arrived';
        addChatMessage('Evelyn (Smart Buddy)', 'I see you have arrived at your destination! Confirm check-out by sliding the app code. Stay safe!', 'msg-received');
      }
    }
    
    routeAnimationId = requestAnimationFrame(update);
  }
  // 5. SOS Alert Systems
  const triggerSos = () => {
    sosOverlay.style.display = 'flex';
    sosCountdownText.textContent = '5';
    let count = 5;
    
    // Clear any previous timer
    if (sosTimerId) clearInterval(sosTimerId);
    addChatMessage('System Warning', 'EMERGENCY SOS SYSTEM ARMED. Audio stream broadcast active.', 'msg-sent');
    sosTimerId = setInterval(() => {
      count--;
      sosCountdownText.textContent = count;
      
      if (count <= 0) {
        clearInterval(sosTimerId);
        sosTimerId = null;
        sosCountdownText.style.fontSize = '2.5rem';
        sosCountdownText.textContent = 'POLICE ALERTED';
        sosCountdownText.style.color = 'var(--color-danger)';
        addChatMessage('Central Dispatch', 'SOS BROADCAST SENT. GPS coordinates locked. Emergency response crew dispatched to your location.', 'msg-received');
      }
    }, 1000);
  };
  if (triggerSosBtn) triggerSosBtn.addEventListener('click', triggerSos);
  if (navSosBtn) navSosBtn.addEventListener('click', triggerSos);
  cancelSosBtn.addEventListener('click', () => {
    if (sosTimerId) {
      clearInterval(sosTimerId);
      sosTimerId = null;
    }
    sosOverlay.style.display = 'none';
    sosCountdownText.style.fontSize = '4rem';
    sosCountdownText.style.color = 'var(--color-text-white)';
    addChatMessage('System', 'SOS signal aborted. Central security logged standby code.', 'msg-received');
  });
  // 6. Companion Smart Buddy Chat Box Interaction
  chatForm.addEventListener('submit', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Add passenger message to chat
    addChatMessage('Anya (You)', text, 'msg-sent');
    chatInput.value = '';
    
    // Automated reply logic
    setTimeout(() => {
      let replyText = "";
      
      // Smart check if the user asks for help or SOS
      if (text.toLowerCase().includes('help') || text.toLowerCase().includes('danger') || text.toLowerCase().includes('sos')) {
        replyText = "Anya! If you feel unsafe, click the RED SOS button on the top right or screen center IMMEDIATELY. I am calling dispatch now!";
      } else {
        replyText = buddyReplies[replyIndex];
        replyIndex = (replyIndex + 1) % buddyReplies.length;
      }
      
      addChatMessage('Evelyn (Smart Buddy)', replyText, 'msg-received');
    }, 1200);
  });
  function addChatMessage(sender, text, className) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${className}`;
    msg.innerHTML = `<strong style="display:block; font-size:0.75rem; margin-bottom:0.15rem; opacity:0.8;">${sender}</strong>${text}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  // 7. Auto trigger action simulation based on URL queries
  if (actionParam === 'sos') {
    setTimeout(triggerSos, 500);
  } else if (actionParam === 'chat') {
    setTimeout(() => {
      chatInput.focus();
      addChatMessage('System Tip', 'Ask the Smart Buddy details about your driver or type "help" to see active security prompts.', 'msg-received');
    }, 500);
  }
}
/* ==========================================================================
   DRIVER REVENUE CALCULATOR & REGISTRATION (drivers.html)
   ========================================================================== */
function initDriverCalculator() {
  const hoursSlider = document.getElementById('hoursSlider');
  const ridesSlider = document.getElementById('ridesSlider');
  const fareSlider = document.getElementById('fareSlider');
  const hoursVal = document.getElementById('hoursVal');
  const ridesVal = document.getElementById('ridesVal');
  const fareVal = document.getElementById('fareVal');
  const weeklyEarningText = document.getElementById('weeklyEarning');
  const monthlyEarningText = document.getElementById('monthlyEarning');
  const annualEarningText = document.getElementById('annualEarning');
  function calculateEarnings() {
    const hours = parseInt(hoursSlider.value);
    
    // rides slider value ranges from 10 to 30, meaning 1.0 to 3.0
    const ridesPerHour = parseFloat(ridesSlider.value) / 10;
    const averageFare = parseInt(fareSlider.value);
    // Dynamic Labels
    hoursVal.textContent = `${hours} hrs`;
    ridesVal.textContent = `${ridesPerHour.toFixed(1)} rides`;
    fareVal.textContent = `₹${averageFare}`;
    // Calculation: gross = hours * rides * fare, capella fee is 10%, payout is 90%
    const weeklyGross = hours * ridesPerHour * averageFare;
    const weeklyNet = weeklyGross * 0.9;
    const monthlyNet = weeklyNet * 4.33;
    const annualNet = weeklyNet * 52;
    // Update displays formatted to currency
    weeklyEarningText.textContent = `₹${weeklyNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    monthlyEarningText.textContent = `₹${monthlyNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    annualEarningText.textContent = `₹${annualNet.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  // Bind input change listeners
  hoursSlider.addEventListener('input', calculateEarnings);
  ridesSlider.addEventListener('input', calculateEarnings);
  fareSlider.addEventListener('input', calculateEarnings);
  // Initialize
  calculateEarnings();
}
function initDriverSignupForm() {
  const form = document.getElementById('driverSignupForm');
  const submitBtn = document.getElementById('submitApplicationBtn');
  form.addEventListener('submit', () => {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Credentials...';
    
    setTimeout(() => {
      // Create a floating feedback modal
      const modal = document.createElement('div');
      modal.setAttribute('style', 'position: fixed; top: 0; left: 0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:9999;');
      modal.innerHTML = `
        <div class="card" style="max-width:450px; width:90%; padding:2.5rem; text-align:center;">
          <div style="width:60px; height:60px; border-radius:50%; background:rgba(16,185,129,0.15); color:var(--color-success); display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; border:1px solid rgba(16,185,129,0.3);">
            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style="font-size:1.5rem; margin-bottom:0.75rem;">Application Submitted!</h2>
          <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:2rem;">Thank you for applying. A Capella regional safety commander will reach out at your email to verify vehicle and background docs within 24 hours.</p>
          <button class="btn btn-primary" id="closeDriverModalBtn" style="width:100%;">Return to Hub</button>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('closeDriverModalBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Partner Application';
      });
    }, 1500);
  });
}
/* ==========================================================================
   BUSINESS MODEL & STRATEGY ANIMATIONS (business.html)
   ========================================================================== */
function initBusinessChart() {
  const bars = [
    { el: document.getElementById('bar1'), h: '20%' },
    { el: document.getElementById('bar2'), h: '45%' },
    { el: document.getElementById('bar3'), h: '65%' },
    { el: document.getElementById('bar4'), h: '85%' },
    { el: document.getElementById('bar5'), h: '100%' }
  ];
  // Animate heights on load with a sequential delay
  bars.forEach((bar, index) => {
    setTimeout(() => {
      if (bar.el) {
        bar.el.style.height = bar.h;
      }
    }, index * 200);
  });
}

