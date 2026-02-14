import api from './api';

/**
 * Others Management API Service
 * Provides API functions for all 12 Others Management sections
 */

// ============================================================================
// 1. RIYAL RATE API
// ============================================================================
export const riyalRateAPI = {
    getAll: () => api.get('/api/others/riyal-rate'),
    getActive: () => api.get('/api/others/riyal-rate/active'),
    create: (data) => api.post('/api/others/riyal-rate', data),
    update: (id, data) => api.put(`/api/others/riyal-rate/${id}`, data),
    delete: (id) => api.delete(`/api/others/riyal-rate/${id}`),
};

// ============================================================================
// 2. SHIRKA API
// ============================================================================
export const shirkaAPI = {
    getAll: (isActive = null) => {
        const params = isActive !== null ? { is_active: isActive } : {};
        return api.get('/api/others/shirka', { params });
    },
    getById: (id) => api.get(`/api/others/shirka/${id}`),
    create: (data) => api.post('/api/others/shirka', data),
    update: (id, data) => api.put(`/api/others/shirka/${id}`, data),
    delete: (id) => api.delete(`/api/others/shirka/${id}`),
};

// ============================================================================
// 3. SMALL SECTORS API
// ============================================================================
export const smallSectorAPI = {
    getAll: (isActive = null) => {
        const params = isActive !== null ? { is_active: isActive } : {};
        return api.get('/api/others/small-sectors', { params });
    },
    getById: (id) => api.get(`/api/others/small-sectors/${id}`),
    create: (data) => api.post('/api/others/small-sectors', data),
    update: (id, data) => api.put(`/api/others/small-sectors/${id}`, data),
    delete: (id) => api.delete(`/api/others/small-sectors/${id}`),
};

// ============================================================================
// 4. BIG SECTORS API
// ============================================================================
export const bigSectorAPI = {
    getAll: (isActive = null) => {
        const params = isActive !== null ? { is_active: isActive } : {};
        return api.get('/api/others/big-sectors', { params });
    },
    getById: (id) => api.get(`/api/others/big-sectors/${id}`),
    create: (data) => api.post('/api/others/big-sectors', data),
    update: (id, data) => api.put(`/api/others/big-sectors/${id}`, data),
    delete: (id) => api.delete(`/api/others/big-sectors/${id}`),
};

// ============================================================================
// 5. VISA RATES PEX WISE API
// ============================================================================
export const visaRatesPexAPI = {
    getAll: (isActive = null) => {
        const params = isActive !== null ? { is_active: isActive } : {};
        return api.get('/api/others/visa-rates-pex', { params });
    },
    getById: (id) => api.get(`/api/others/visa-rates-pex/${id}`),
    create: (data) => api.post('/api/others/visa-rates-pex', data),
    update: (id, data) => api.put(`/api/others/visa-rates-pex/${id}`, data),
    delete: (id) => api.delete(`/api/others/visa-rates-pex/${id}`),
};

// ============================================================================
// 6. ONLY VISA RATES API
// ============================================================================
export const onlyVisaRateAPI = {
    getAll: (status = null) => {
        const params = status ? { status_filter: status } : {};
        return api.get('/api/others/only-visa-rates', { params });
    },
    getById: (id) => api.get(`/api/others/only-visa-rates/${id}`),
    create: (data) => api.post('/api/others/only-visa-rates', data),
    update: (id, data) => api.put(`/api/others/only-visa-rates/${id}`, data),
    delete: (id) => api.delete(`/api/others/only-visa-rates/${id}`),
};

// ============================================================================
// 7. TRANSPORT PRICES API
// ============================================================================
export const transportPriceAPI = {
    getAll: (status = null) => {
        const params = status ? { status_filter: status } : {};
        return api.get('/api/others/transport-prices', { params });
    },
    getById: (id) => api.get(`/api/others/transport-prices/${id}`),
    create: (data) => api.post('/api/others/transport-prices', data),
    update: (id, data) => api.put(`/api/others/transport-prices/${id}`, data),
    delete: (id) => api.delete(`/api/others/transport-prices/${id}`),
};

// ============================================================================
// 8. FOOD PRICES API
// ============================================================================
export const foodPriceAPI = {
    getAll: (isActive = null) => {
        const params = isActive !== null ? { is_active: isActive } : {};
        return api.get('/api/others/food-prices', { params });
    },
    getById: (id) => api.get(`/api/others/food-prices/${id}`),
    create: (data) => api.post('/api/others/food-prices', data),
    update: (id, data) => api.put(`/api/others/food-prices/${id}`, data),
    delete: (id) => api.delete(`/api/others/food-prices/${id}`),
};

// ============================================================================
// 9. ZIARAT PRICES API
// ============================================================================
export const ziaratPriceAPI = {
    getAll: (status = null) => {
        const params = status ? { status_filter: status } : {};
        return api.get('/api/others/ziarat-prices', { params });
    },
    getById: (id) => api.get(`/api/others/ziarat-prices/${id}`),
    create: (data) => api.post('/api/others/ziarat-prices', data),
    update: (id, data) => api.put(`/api/others/ziarat-prices/${id}`, data),
    delete: (id) => api.delete(`/api/others/ziarat-prices/${id}`),
};

// ============================================================================
// 10. FLIGHT IATA API
// ============================================================================
export const flightIATAAPI = {
    getAll: (isActive = null) => {
        const params = isActive !== null ? { is_active: isActive } : {};
        return api.get('/api/others/flight-iata', { params });
    },
    getById: (id) => api.get(`/api/others/flight-iata/${id}`),
    create: (data) => api.post('/api/others/flight-iata', data),
    update: (id, data) => api.put(`/api/others/flight-iata/${id}`, data),
    delete: (id) => api.delete(`/api/others/flight-iata/${id}`),
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/others/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};

// ============================================================================
// 11. CITY IATA API
// ============================================================================
export const cityIATAAPI = {
    getAll: (isActive = null) => {
        const params = isActive !== null ? { is_active: isActive } : {};
        return api.get('/api/others/city-iata', { params });
    },
    getById: (id) => api.get(`/api/others/city-iata/${id}`),
    create: (data) => api.post('/api/others/city-iata', data),
    update: (id, data) => api.put(`/api/others/city-iata/${id}`, data),
    delete: (id) => api.delete(`/api/others/city-iata/${id}`),
};

// ============================================================================
// 12. BOOKING EXPIRY API
// ============================================================================
export const bookingExpiryAPI = {
    getAll: () => api.get('/api/others/booking-expiry'),
    getActive: () => api.get('/api/others/booking-expiry/active'),
    create: (data) => api.post('/api/others/booking-expiry', data),
    update: (id, data) => api.put(`/api/others/booking-expiry/${id}`, data),
    delete: (id) => api.delete(`/api/others/booking-expiry/${id}`),
};

// Export all APIs
export default {
    riyalRate: riyalRateAPI,
    shirka: shirkaAPI,
    smallSector: smallSectorAPI,
    bigSector: bigSectorAPI,
    visaRatesPex: visaRatesPexAPI,
    onlyVisaRate: onlyVisaRateAPI,
    transportPrice: transportPriceAPI,
    foodPrice: foodPriceAPI,
    ziaratPrice: ziaratPriceAPI,
    flightIATA: flightIATAAPI,
    cityIATA: cityIATAAPI,
    bookingExpiry: bookingExpiryAPI,
};
