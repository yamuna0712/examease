const API_BASE = '/api';

let dbStatusListener = null;

export const setDbStatusListener = (callback) => {
  dbStatusListener = callback;
};

export const notifyDbStatus = (isConnected, message = '') => {
  if (dbStatusListener) {
    dbStatusListener({ isConnected, message });
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('examease_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // If response is 503 Service Unavailable (DB down)
    if (response.status === 503) {
      const errData = await response.json().catch(() => ({}));
      notifyDbStatus(false, errData.error || 'MongoDB is not connected.');
      const error = new Error(errData.error || 'Database unavailable');
      error.status = 503;
      error.code = errData.code || 'DB_UNAVAILABLE';
      error.details = errData.details;
      throw error;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      throw error;
    }

    // Success response indicates DB is working
    notifyDbStatus(true);
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Backend server completely unreachable
      notifyDbStatus(false, 'Cannot reach backend server. Please verify backend is running on port 5000.');
    }
    throw error;
  }
};

// Check backend and DB status
export const checkHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    const isDbUp = Boolean(data?.database?.connected);
    notifyDbStatus(isDbUp, data?.database?.message);
    return data;
  } catch (err) {
    notifyDbStatus(false, 'Backend server is not reachable on http://localhost:5000');
    return null;
  }
};
