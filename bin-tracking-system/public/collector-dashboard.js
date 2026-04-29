const API_URL = 'http://localhost:5000';

// Mock assigned bins data (matching existing bin structure)
const mockAssignedBins = [
  { id: "BIN001", location: "MG Road, Bangalore", status: "Normal", fillLevel: 30, latitude: 12.9716, longitude: 77.5946 },
  { id: "BIN002", location: "Brigade Road, Bangalore", status: "Full", fillLevel: 85, latitude: 12.98, longitude: 77.60 },
  { id: "BIN004", location: "Whitefield, Bangalore", status: "Warning", fillLevel: 72, latitude: 12.9698, longitude: 77.7499 },
  { id: "BIN005", location: "Hebbal, Bangalore", status: "Full", fillLevel: 92, latitude: 13.0358, longitude: 77.6187 },
  { id: "BIN008", location: "HSR Layout, Bangalore", status: "Warning", fillLevel: 78, latitude: 12.9250, longitude: 77.6850 },
];

// Global variable to store bins
let assignedBins = [];

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

// Load bins (mock data for now, can be replaced with API call)
async function loadBins() {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In production, fetch from API:
  // const response = await fetch(`${API_URL}/collector/bins`, {
  //   headers: { 'Authorization': `Bearer ${localStorage.getItem('collectorToken')}` }
  // });
  // assignedBins = await response.json();
  
  // Using mock data
  assignedBins = [...mockAssignedBins];
  
  // Render bins
  renderBins();
}

// Sort bins by priority: Full -> Warning -> Normal -> Collected
function sortByPriority(bins) {
  const priorityOrder = { 'Full': 0, 'Warning': 1, 'Normal': 2, 'Collected': 3 };
  return bins.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
}

// Get progress bar color based on fill level
function getProgressColorClass(fillLevel) {
  if (fillLevel >= 90) return 'red';
  if (fillLevel >= 70) return 'orange';
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
        <span class="icon">📍</span>
        <span>${bin.location}</span>
      </div>
      <div class="bin-fill">
        <span>Fill Level: ${bin.fillLevel}%</span>
        <div class="progress-bar">
          <div class="progress-fill ${progressColor}" style="width: ${bin.fillLevel}%"></div>
        </div>
      </div>
      <div class="bin-actions">
        <button onclick="viewOnMap('${bin.location}')" class="btn-action btn-map">
          🗺️ View on Map
        </button>
        <button 
          onclick="markAsCollected('${bin.id}')" 
          class="btn-action btn-collect"
          ${isCollected ? 'disabled' : ''}
        >
          ${isCollected ? '✓ Collected' : '✓ Mark as Collected'}
        </button>
      </div>
    </div>
  `;
}

// View bin location on Google Maps
function viewOnMap(location) {
  const encodedLocation = encodeURIComponent(location);
  window.open(`https://www.google.com/maps?q=${encodedLocation}`, '_blank');
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
      body: JSON.stringify({ binId, status: 'Normal', fillLevel: 0 }),
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
    binCard.classList.remove('collected');
  }
}

// Render bins to the DOM
function renderBins() {
  // Get priority bins (Full and Warning only)
  const priorityBins = assignedBins.filter(b => 
    b.status === 'Full' || b.status === 'Warning'
  );
  
  // Sort all bins by priority
  const allBins = sortByPriority([...assignedBins]);
  
  // Render priority section
  const priorityContainer = document.getElementById('priorityBins');
  if (priorityBins.length > 0) {
    priorityContainer.innerHTML = priorityBins.map(createBinCard).join('');
  } else {
    priorityContainer.innerHTML = '<p class="empty-message">No priority bins! Great job!</p>';
  }
  
  // Render all bins section
  document.getElementById('allBins').innerHTML = allBins.map(createBinCard).join('');
  
  // Hide loading state
  document.getElementById('loadingState').style.display = 'none';
  
  // Show empty state if no bins
  document.getElementById('emptyState').style.display = 
    assignedBins.length === 0 ? 'block' : 'none';
}

// Show toast notification
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
