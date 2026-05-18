const API_URL = 'http://localhost:5000';

// Global variable to store bins
let assignedBins = [];
let currentFilter = 'All';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('collectorToken');
  
  // If no token, redirect to login
  if (!token) {
    window.location.href = '/collector-login.html';
    return;
  }

  // Verify token and load bins
  await verifyAndLoadBins(token);
  
  // Auto-refresh bins every 10 seconds
  setInterval(async () => {
    await loadBins();
  }, 10000);
});

// Verify token and load bins
async function verifyAndLoadBins(token) {
  try {
    // Verify token by fetching collector info
    const response = await fetch(`${API_URL}/collector/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Display mobile number
      document.getElementById('userMobile').textContent = 
        `Mobile: ${data.collector.mobile}`;
      
      // Load bins (using mock data for now)
      await loadBins();
    } else {
      // Token is invalid or expired
      throw new Error('Unauthorized');
    }
  } catch (error) {
    // Clear invalid token and redirect to login
    localStorage.removeItem('collectorToken');
    localStorage.removeItem('collectorMobile');
    window.location.href = '/collector-login.html';
  }
}

// Load bins from API
async function loadBins() {
  const token = localStorage.getItem('collectorToken');
  
  try {
    const response = await fetch(`${API_URL}/collector/bins`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Map and resolve statuses dynamically based on new thresholds
      assignedBins = data.bins.map(bin => {
        const resolvedStatus = (bin.fillLevel > 0 && (bin.status === 'Empty' || bin.status === 'Collected'))
          ? (bin.fillLevel >= 80 ? 'Full' : bin.fillLevel >= 50 ? 'Warning' : 'Normal')
          : (bin.fillLevel === 0 ? 'Collected' : bin.status);
        return { ...bin, status: resolvedStatus };
      });
      renderBins();
    } else {
      console.error('Failed to load bins');
    }
  } catch (error) {
    console.error('Failed to load bins:', error);
    showToast('Failed to load bins. Please refresh.', 'error');
  }
}

// Filter bins by status
function filterBins(status) {
  currentFilter = status;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-filter="${status}"]`).classList.add('active');
  
  // Update section title
  const sectionTitle = document.getElementById('binsSectionTitle');
  if (status === 'All') {
    sectionTitle.textContent = 'All Assigned Bins';
  } else {
    sectionTitle.textContent = `${status} Bins`;
  }
  
  // Re-render bins
  renderBins();
}

// Sort bins by priority: Full -> Warning -> Normal -> Collected
function sortByPriority(bins) {
  const priorityOrder = { 'Full': 0, 'Warning': 1, 'Normal': 2, 'Collected': 3, 'Empty': 3 };
  return bins.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
}

// Get progress bar color based on fill level
function getProgressColorClass(fillLevel) {
  if (fillLevel >= 80) return 'red';
  if (fillLevel >= 50) return 'orange';
  return 'green';
}

// Create bin card HTML
function createBinCard(bin) {
  const progressColor = getProgressColorClass(bin.fillLevel);
  const isCollected = bin.status === 'Collected';
  
  return `
    <div class="bin-card ${bin.status.toLowerCase()}" data-bin-id="${bin.id}" style="animation-delay: ${Math.random() * 0.3}s">
      <div class="bin-header">
        <h3>${bin.id}</h3>
        <span class="status-badge status-${bin.status.toLowerCase()}">${bin.status}</span>
      </div>
      <div class="bin-location">
        <span class="icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </span>
        <span>${bin.location}</span>
      </div>
      <div class="bin-fill">
        <span>Fill Level: ${bin.fillLevel}%</span>
        <div class="progress-bar">
          <div class="progress-fill ${isCollected ? 'progress-fill-empty' : progressColor}" style="width: ${bin.fillLevel}%"></div>
        </div>
      </div>
      <div class="bin-actions">
        <button onclick="viewOnMap(${bin.latitude || 'null'}, ${bin.longitude || 'null'}, '${(bin.location || '').replace(/'/g, "\\'")}')" class="btn-action btn-map">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
            <line x1="9" y1="3" x2="9" y2="18"></line>
            <line x1="15" y1="6" x2="15" y2="21"></line>
          </svg>
          View on Map
        </button>
        <button 
          onclick="markAsCollected('${bin.id}')" 
          class="btn-action btn-collect"
          ${isCollected ? 'disabled' : ''}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ${isCollected ? 'Collected' : 'Mark as Collected'}
        </button>
      </div>
    </div>
  `;
}

// View bin location on Google Maps
function viewOnMap(latitude, longitude, location) {
  if (latitude && longitude && latitude !== null && longitude !== null) {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  } else {
    const encodedLocation = encodeURIComponent(location);
    window.open(`https://www.google.com/maps?q=${encodedLocation}`, '_blank');
  }
}

// Mark bin as collected
async function markAsCollected(binId) {
  const token = localStorage.getItem('collectorToken');
  
  // Find the bin
  const bin = assignedBins.find(b => b.id === binId);
  if (!bin || bin.status === 'Collected') {
    return;
  }
  
  // Update UI immediately for better UX
  const binCard = document.querySelector(`[data-bin-id="${binId}"]`);
  if (binCard) {
    binCard.classList.add('collected');
  }
  
  // Update status in data
  bin.status = 'Collected';
  bin.fillLevel = 0;
  
  // Call backend API
  try {
    const response = await fetch(`${API_URL}/collector/update-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ binId, status: 'Collected', fillLevel: 0 }),
    });
    
    if (response.ok) {
      // Show success message
      showToast(`${binId} marked as collected!`, 'success');
      
      // Re-render to update priority list
      setTimeout(() => {
        renderBins();
      }, 500);
    } else {
      throw new Error('Failed to update');
    }
  } catch (error) {
    console.error('Error updating bin status:', error);
    showToast('Failed to update status. Please try again.', 'error');
    
    // Revert UI changes on error
    bin.status = 'Warning'; // Revert to previous status
    binCard.classList.remove('empty');
  }
}

// Render bins to the DOM
function renderBins() {
  // Get priority bins (Full and Warning only)
  const priorityBins = assignedBins.filter(b => 
    b.status === 'Full' || b.status === 'Warning'
  );
  
  // Sort all bins by priority
  let allBins = sortByPriority([...assignedBins]);
  
  // Apply filter if not "All"
  if (currentFilter !== 'All') {
    allBins = allBins.filter(b => b.status === currentFilter);
  }
  
  // Render priority section (only show if filter is All or matches priority statuses)
  const priorityContainer = document.getElementById('priorityBins');
  const prioritySection = document.querySelector('.priority-section');
  
  if (currentFilter === 'All' || currentFilter === 'Full' || currentFilter === 'Warning') {
    const filteredPriority = currentFilter === 'All' 
      ? priorityBins 
      : priorityBins.filter(b => b.status === currentFilter);
    
    if (filteredPriority.length > 0) {
      priorityContainer.innerHTML = filteredPriority.map(createBinCard).join('');
      prioritySection.style.display = 'block';
    } else {
      priorityContainer.innerHTML = '<p class="empty-message">No priority bins! Great job!</p>';
      prioritySection.style.display = 'block';
    }
  } else {
    // Hide priority section when filtering by Normal or Collected
    prioritySection.style.display = 'none';
  }
  
  // Render all bins section
  const allBinsContainer = document.getElementById('allBins');
  if (allBins.length > 0) {
    allBinsContainer.innerHTML = allBins.map(createBinCard).join('');
  } else {
    allBinsContainer.innerHTML = `<p class="empty-message">No ${currentFilter.toLowerCase()} bins found</p>`;
  }
  
  // Hide loading state
  document.getElementById('loadingState').style.display = 'none';
  
  // Show empty state if no bins
  document.getElementById('emptyState').style.display = 
    assignedBins.length === 0 ? 'block' : 'none';
}
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Logout function
function logout() {
  // Clear tokens
  localStorage.removeItem('collectorToken');
  localStorage.removeItem('collectorMobile');
  
  // Redirect to login
  window.location.href = '/collector-login.html';
}
