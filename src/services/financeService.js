import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Chart of Accounts ────────────────────────────────────────────────────────
export const coaAPI = {
    getAll: (params = {}) => api.get('/api/finance/coa', { params }),
    create: (data)        => api.post('/api/finance/coa', data),
    update: (id, data)    => api.put(`/api/finance/coa/${id}`, data),
    seed:   (orgId)       => api.post(`/api/finance/coa/seed/${orgId}`),
};

// ─── Journal Entries ──────────────────────────────────────────────────────────
export const journalAPI = {
    getAll:  (params = {}) => api.get('/api/finance/journal', { params }),
    getById: (id)          => api.get(`/api/finance/journal/${id}`),
    create:  (data)        => api.post('/api/finance/journal', data),
    reverse: (id)          => api.delete(`/api/finance/journal/${id}`),
};

// ─── Manual Entry ─────────────────────────────────────────────────────────────
export const manualEntryAPI = {
    create: (data) => api.post('/api/finance/manual-entry', data),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
    dashboard:    (params = {}) => api.get('/api/finance/reports/dashboard',     { params }),
    profitLoss:   (params = {}) => api.get('/api/finance/reports/profit-loss',   { params }),
    balanceSheet: (params = {}) => api.get('/api/finance/reports/balance-sheet', { params }),
    trialBalance: (params = {}) => api.get('/api/finance/reports/trial-balance', { params }),
    ledger:       (params = {}) => api.get('/api/finance/reports/ledger',        { params }),

    downloadExcel: (reportType, params = {}) =>
        api.get(`/api/finance/reports/download/excel/${reportType}`, {
            params,
            responseType: 'blob',
        }),
    downloadPdf: (reportType, params = {}) =>
        api.get(`/api/finance/reports/download/pdf/${reportType}`, {
            params,
            responseType: 'blob',
        }),
};

// ─── Audit Trail ──────────────────────────────────────────────────────────────
export const auditAPI = {
    getAll: (params = {}) => api.get('/api/finance/audit-trail', { params }),
};

// ─── helpers ──────────────────────────────────────────────────────────────────
export function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}
