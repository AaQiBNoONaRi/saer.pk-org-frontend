import axios from 'axios';

// API base URL - update this to match your backend
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('admin_data');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth API functions
export const authAPI = {
    /**
     * Login admin user
     * @param {string} username
     * @param {string} password
     * @returns {Promise} Response with access_token and admin data
     */
    login: async (username, password) => {
        const response = await api.post('/api/admin/login', {
            username,
            password,
        });

        // Store token and admin data in localStorage
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('admin_data', JSON.stringify(response.data.admin));
        }

        return response.data;
    },

    /**
     * Get current admin info
     * @returns {Promise} Admin data
     */
    getCurrentAdmin: async () => {
        const response = await api.get('/api/admin/me');
        return response.data;
    },

    /**
     * Logout admin user
     */
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('admin_data');
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },

    /**
     * Get stored admin data
     * @returns {object|null}
     */
    getAdminData: () => {
        const data = localStorage.getItem('admin_data');
        return data ? JSON.parse(data) : null;
    },
};

export default api;
