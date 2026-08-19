const API_URL = 'http://localhost:5000';

// Global variable to store bins
let assignedBins = [];
let currentFilter = 'All';
let searchTerm = '';

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
      document.getElementById('userMobile').textContent = data.collector.mobile;
      
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
        let resolvedStatus;
        if (bin.fillLevel === 0) resolvedStatus = 'Collected';
        else if (bin.fillLevel >= 80) resolvedStatus = 'Full';
        else if (bin.fillLevel >= 50) resolvedStatus = 'Warning';
        else resolvedStatus = 'Normal';
        
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

function onBinSearch(value) {
  searchTerm = value || '';
  renderBins();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('is-open');
}

function navigateCollector(section, event) {
  if (event) event.preventDefault();
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('data-nav') === section);
  });
  if (section === 'alerts') {
    document.getElementById('alerts')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (section === 'assigned') {
    document.getElementById('assigned')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
}

function updateSummaryCards() {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setText('statAssigned', assignedBins.length);
  setText('statNormal', assignedBins.filter((b) => b.status === 'Normal').length);
  setText('statWarning', assignedBins.filter((b) => b.status === 'Warning').length);
  setText('statFull', assignedBins.filter((b) => b.status === 'Full').length);
  setText('statCollected', assignedBins.filter((b) => b.status === 'Collected').length);
}

// Sort bins by priority
function sortByPriority(bins) {
  return bins.sort((a, b) => {
    // Highest priority: fillLevel >= 90
    const aHigh = a.fillLevel >= 90 ? 0 : 1;
    const bHigh = b.fillLevel >= 90 ? 0 : 1;
    if (aHigh !== bHigh) return aHigh - bHigh;
    // Next priority based on status order
    const priorityOrder = { 'Full': 1, 'Warning': 2, 'Normal': 3, 'Collected': 4, 'Empty': 4 };
    const statusDiff = priorityOrder[a.status] - priorityOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    // Within same status, higher fillLevel first
    return b.fillLevel - a.fillLevel;
  });
}

// Get progress bar color based on fill level
function getProgressColorClass(fillLevel, status) {
  if (status === 'Collected' || fillLevel === 0) return 'gray';
  if (fillLevel >= 80) return 'red';
  if (fillLevel >= 60) return 'orange';
  return 'green';
}

function getStatusLabel(status) {
  return status;
}

function getDeviceState(bin) {
  const raw = String(bin.deviceStatus || bin.connectivity || bin.onlineStatus || '').toLowerCase();
  if (raw === 'inactive' || raw === 'offline') return 'offline';
  return 'online';
}

function formatUpdatedAt(bin) {
  const ts = bin.updatedAt || bin.lastCollected;
  if (!ts) return 'Just now';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeAttr(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function viewAssignedBinsOnMap() {
  const withCoords = assignedBins.find((bin) => bin.latitude && bin.longitude);
  if (withCoords) {
    viewOnMap(withCoords.latitude, withCoords.longitude, withCoords.location);
    return;
  }
  const withLocation = assignedBins.find((bin) => bin.location);
  if (withLocation) {
    viewOnMap(null, null, withLocation.location);
    return;
  }
  showToast('No bin locations available.', 'error');
}

function viewBinDetails(binId) {
  const bin = assignedBins.find((b) => b.id === binId);
  if (!bin) return;
  const modal = document.getElementById('detailsModal');
  const body = document.getElementById('detailsBody');
  const title = document.getElementById('detailsTitle');
  const device = getDeviceState(bin);
  title.textContent = bin.id;
  body.innerHTML = `
    <div class="detail-grid">
      <div><span>Location</span><strong>${bin.location || '—'}</strong></div>
      <div><span>Fill level</span><strong>${bin.fillLevel}%</strong></div>
      <div><span>Status</span><strong>${getStatusLabel(bin.status)}</strong></div>
      <div><span>Device</span><strong>${device === 'online' ? 'Online' : 'Offline'}</strong></div>
      <div><span>Latitude</span><strong>${bin.latitude ?? '—'}</strong></div>
      <div><span>Longitude</span><strong>${bin.longitude ?? '—'}</strong></div>
      <div><span>Last updated</span><strong>${formatUpdatedAt(bin)}</strong></div>
      <div><span>Last collected</span><strong>${bin.lastCollected ? formatUpdatedAt({ updatedAt: bin.lastCollected }) : '—'}</strong></div>
    </div>
    <div class="detail-actions">
      <button type="button" class="btn-action btn-map" onclick="viewOnMap(${bin.latitude || 'null'}, ${bin.longitude || 'null'}, '${escapeAttr(bin.location)}')">View on Map</button>
      <button type="button" class="btn-action btn-collect" onclick="markAsCollected('${escapeAttr(bin.id)}'); closeBinDetails();">Mark as Collected</button>
    </div>
  `;
  modal.hidden = false;
}

function closeBinDetails() {
  const modal = document.getElementById('detailsModal');
  if (modal) modal.hidden = true;
}

// Create bin card HTML
function createBinCard(bin) {
  const progressColor = getProgressColorClass(bin.fillLevel, bin.status);
  const fillHeight = Math.max(0, Math.min(100, Number(bin.fillLevel) || 0));
  const statusLabel = getStatusLabel(bin.status);
  const statusClass = bin.status.toLowerCase();
  return `
    <div class="bin-card ${statusClass}" data-bin-id="${bin.id}">
      <div class="bin-header">
        <h3>${bin.id}</h3>
        <span class="status-badge status-${statusClass}">${statusLabel}</span>
      </div>
      <div class="bin-content">
        <div class="bin-visual bin-visual--${progressColor}">
          <div class="bin-lid"></div>
          <div class="bin-can">
            <div class="bin-fill-liquid" style="height: ${fillHeight}%"></div>
            <span class="bin-pct">${fillHeight}%</span>
          </div>
        </div>
        <div class="bin-details">
          <div class="fact">
            <span>Location</span>
            <div class="bin-location">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <strong>${bin.location}</strong>
            </div>
          </div>
          <div class="fact">
            <span>Status</span>
            <strong class="status-text status-text--${statusClass}"><i></i>${statusLabel}</strong>
          </div>
          <div class="fact">
            <span>Last Updated</span>
            <strong>${formatUpdatedAt(bin)}</strong>
          </div>
        </div>
      </div>
      <div class="bin-actions">
        <button onclick="viewOnMap(${bin.latitude || 'null'}, ${bin.longitude || 'null'}, '${escapeAttr(bin.location)}')" class="btn-action btn-map">
          View on Map
        </button>
        <button onclick="viewBinDetails('${escapeAttr(bin.id)}')" class="btn-action btn-details">
          View Details
        </button>
        <button onclick="markAsCollected('${bin.id}')" class="btn-action btn-collect">
          Mark as Collected
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
  if (!bin) return;
  
  // Update fill level locally so the UI responds instantly
  bin.fillLevel = 0;
  bin.distance = 100;
  bin.status = 'Normal';// Call backend API
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
    bin.fillLevel = 100; // Force it to re-evaluate from backend
    showToast('Failed to update status. Please try again.', 'error');
  }
}

// Render bins to the DOM
function renderBins() {
  // Get priority bins (Full and Warning only)
  const priorityBins = assignedBins.filter(b =>
    b.fillLevel >= 90 || b.status === 'Full' || b.status === 'Warning'
  );
  
  // Sort all bins by priority
  let allBins = sortByPriority([...assignedBins]);
  
  // Apply filter if not "All"
  if (currentFilter !== 'All') {
    allBins = allBins.filter(b => b.status === currentFilter);
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    allBins = allBins.filter((b) =>
      String(b.id).toLowerCase().includes(q) ||
      String(b.location || '').toLowerCase().includes(q)
    );
  }

  updateSummaryCards();
  
  // Render priority section (only show if filter is All or matches priority statuses)
  const priorityContainer = document.getElementById('priorityBins');
  const prioritySection = document.querySelector('.priority-section');
  
  if (currentFilter === 'All' || currentFilter === 'Full' || currentFilter === 'Warning') {
    const filteredPriority = (currentFilter === 'All' 
      ? priorityBins 
      : priorityBins.filter(b => b.status === currentFilter)
    ).filter((b) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return String(b.id).toLowerCase().includes(q) || String(b.location || '').toLowerCase().includes(q);
    });
    
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
