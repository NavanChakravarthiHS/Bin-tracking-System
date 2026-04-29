const API_URL = 'http://localhost:5000';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('collectorToken');
  
  // If no token, redirect to login
  if (!token) {
    window.location.href = '/collector-login.html';
    return;
  }

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
      document.getElementById('mobileDisplay').textContent = 
        `Mobile: ${data.collector.mobile}`;
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
});

// Logout function
function logout() {
  // Clear tokens
  localStorage.removeItem('collectorToken');
  localStorage.removeItem('collectorMobile');
  
  // Redirect to login
  window.location.href = '/collector-login.html';
}
