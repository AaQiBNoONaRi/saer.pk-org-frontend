/**
 * HR Management API Service
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// ===================== Dashboard =====================
export const getDashboardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/hr/dashboard/stats`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
};

// ===================== Employees =====================
export const createEmployee = async (employeeData) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(employeeData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create employee');
    }
    return response.json();
};

export const getEmployees = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    if (filters.department) params.append('department', filters.department);

    const response = await fetch(`${API_BASE_URL}/hr/employees?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
};

export const getEmployee = async (empId) => {
    const response = await fetch(`${API_BASE_URL}/hr/employees/${empId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch employee');
    return response.json();
};

export const updateEmployee = async (empId, data) => {
    const response = await fetch(`${API_BASE_URL}/hr/employees/${empId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
};

// ===================== Attendance =====================
// employeeMongoId = the employee's MongoDB _id (not humanoid emp_id like EMP001)
export const getEmployeeCommissions = async (employeeMongoId) => {
    const response = await fetch(`${API_BASE_URL}/commission-records?earner_id=${employeeMongoId}&limit=200`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch employee commissions');
    return response.json();
};
export const checkIn = async (empId, checkInTime = null) => {
    const response = await fetch(`${API_BASE_URL}/hr/attendance/check-in`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            emp_id: empId,
            check_in_time: checkInTime
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to check in');
    }
    return response.json();
};

export const checkOut = async (empId, checkOutTime = null, reason = null) => {
    const response = await fetch(`${API_BASE_URL}/hr/attendance/check-out`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            emp_id: empId,
            check_out_time: checkOutTime,
            reason: reason
        })
    });

    // Handle both success (200) and approval required (202)
    if (response.ok) {
        return response.json();
    }

    // Handle errors
    const error = await response.json();
    throw new Error(error.detail || 'Failed to check out');
};

export const getAttendance = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.emp_id) params.append('emp_id', filters.emp_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/hr/attendance?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch attendance');
    return response.json();
};

export const getTodayAttendance = async (empId) => {
    const response = await fetch(`${API_BASE_URL}/hr/attendance/today/${empId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch today attendance');
    return response.json();
};

// ===================== Movements =====================
export const startMovement = async (empId, reason, destination = null, startTime = null) => {
    const response = await fetch(`${API_BASE_URL}/hr/movements/start`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            emp_id: empId,
            reason,
            destination,
            start_time: startTime
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start movement');
    }
    return response.json();
};

export const endMovement = async (movementId, endTime = null) => {
    const response = await fetch(`${API_BASE_URL}/hr/movements/end`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            movement_id: movementId,
            end_time: endTime
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to end movement');
    }
    return response.json();
};

export const getMovements = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.emp_id) params.append('emp_id', filters.emp_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/hr/movements?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch movements');
    return response.json();
};

// ===================== Leave Requests =====================
export const createLeaveRequest = async (data) => {
    const response = await fetch(`${API_BASE_URL}/hr/leave-requests`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create leave request');
    return response.json();
};

export const getLeaveRequests = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.emp_id) params.append('emp_id', filters.emp_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.request_type) params.append('request_type', filters.request_type);

    const response = await fetch(`${API_BASE_URL}/hr/leave-requests?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch leave requests');
    return response.json();
};

export const approveLeaveRequest = async (requestId, approvedBy, notes = null) => {
    const response = await fetch(`${API_BASE_URL}/hr/leave-requests/${requestId}/approve`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            approved_by: approvedBy,
            approval_notes: notes
        })
    });
    if (!response.ok) throw new Error('Failed to approve leave request');
    return response.json();
};

export const rejectLeaveRequest = async (requestId, approvedBy, notes = null) => {
    const response = await fetch(`${API_BASE_URL}/hr/leave-requests/${requestId}/reject`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            approved_by: approvedBy,
            approval_notes: notes
        })
    });
    if (!response.ok) throw new Error('Failed to reject leave request');
    return response.json();
};

// ===================== Punctuality =====================
export const getPunctuality = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.emp_id) params.append('emp_id', filters.emp_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await fetch(`${API_BASE_URL}/hr/punctuality?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch punctuality records');
    return response.json();
};

// ===================== Fines =====================
export const createFine = async (data) => {
    const response = await fetch(`${API_BASE_URL}/hr/fines`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create fine');
    return response.json();
};

export const getFines = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.emp_id) params.append('emp_id', filters.emp_id);
    if (filters.month) params.append('month', filters.month);

    const response = await fetch(`${API_BASE_URL}/hr/fines?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch fines');
    return response.json();
};

// ===================== Salaries =====================
export const autoGenerateDueSalaries = async () => {
    const response = await fetch(`${API_BASE_URL}/hr/salaries/auto-generate`, {
        method: 'POST',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to auto-generate salaries');
    return response.json();
};

export const getSalaries = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.emp_id) params.append('emp_id', filters.emp_id);
    if (filters.month) params.append('month', filters.month);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/hr/salaries?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch salaries');
    return response.json();
};

export const getSalaryStatistics = async (month = null) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);

    const response = await fetch(`${API_BASE_URL}/hr/salaries/statistics?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch salary statistics');
    return response.json();
};

export const markSalaryPaid = async (salaryId, paymentDate = null, paymentMethod = null, paymentReference = null) => {
    const params = new URLSearchParams();
    if (paymentDate) params.append('payment_date', paymentDate);
    if (paymentMethod) params.append('payment_method', paymentMethod);
    if (paymentReference) params.append('payment_reference', paymentReference);

    const response = await fetch(`${API_BASE_URL}/hr/salaries/${salaryId}/mark-paid?${params}`, {
        method: 'POST',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to mark salary as paid');
    return response.json();
};

export const updateSalary = async (salaryId, data) => {
    const response = await fetch(`${API_BASE_URL}/hr/salaries/${salaryId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update salary');
    return response.json();
};

// ===================== Ledger =====================
export const getEmployeeLedger = async (empId, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`${API_BASE_URL}/hr/employees/${empId}/ledger?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch employee ledger');
    return response.json();
};

// ===================== Punctuality =====================
export const getPunctualityAnalytics = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.emp_id) params.append('emp_id', filters.emp_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await fetch(`${API_BASE_URL}/hr/punctuality/analytics?${params}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch punctuality analytics');
    return response.json();
};

