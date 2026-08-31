/**
 * MessMate API Client
 * Clean HTTP client for REST endpoints.
 */

window.MessMateAPI = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Settings
  getSettings() { return this.request('/settings'); },
  updateSettings(data) { return this.request('/settings', { method: 'PUT', body: JSON.stringify(data) }); },

  // Dashboard
  getDashboard(date) { 
    return this.request(`/dashboard${date ? `?date=${encodeURIComponent(date)}` : ''}`); 
  },

  // Students
  getStudents(params = {}) {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.status) q.append('status', params.status);
    if (params.meal_plan) q.append('meal_plan', params.meal_plan);
    if (params.payment_filter) q.append('payment_filter', params.payment_filter);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/students${queryString}`);
  },

  getStudent(id) { return this.request(`/students/${id}`); },
  createStudent(data) { return this.request('/students', { method: 'POST', body: JSON.stringify(data) }); },
  updateStudent(id, data) { return this.request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  updateStudentStatus(id, data) { return this.request(`/students/${id}/status`, { method: 'POST', body: JSON.stringify(data) }); },

  // Attendance
  getAttendance(date) { return this.request(`/attendance?date=${encodeURIComponent(date)}`); },
  markAttendance(student_id, date, meal_type, status) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify({ student_id, date, meal_type, status })
    });
  },
  bulkAttendance(date, meal_type = null, status = 'ate') {
    return this.request('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ date, meal_type, status })
    });
  },

  // Billing & Cycles
  getStudentBilling(id) { return this.request(`/billing/student/${id}`); },
  startNextCycle(student_id) { return this.request(`/billing/student/${student_id}/next-cycle`, { method: 'POST', body: JSON.stringify({}) }); },

  // Deductions
  getDeductions(student_id = null) {
    return this.request(`/deductions${student_id ? `?student_id=${student_id}` : ''}`);
  },
  createDeduction(data) {
    return this.request('/deductions', { method: 'POST', body: JSON.stringify(data) });
  },

  // Payments
  getPayments(student_id = null) {
    return this.request(`/payments${student_id ? `?student_id=${student_id}` : ''}`);
  },
  createPayment(data) {
    return this.request('/payments', { method: 'POST', body: JSON.stringify(data) });
  },
  getPaymentReceipt(paymentId) {
    return this.request(`/payments/${paymentId}/receipt`);
  },

  // Menu
  getMenu() { return this.request('/menu'); },
  updateMenu(data) { return this.request('/menu', { method: 'PUT', body: JSON.stringify(data) }); },

  // Leave Requests
  getLeaveRequests(student_id = null) {
    return this.request(`/leave-requests${student_id ? `?student_id=${student_id}` : ''}`);
  },
  createLeaveRequest(data) {
    return this.request('/leave-requests', { method: 'POST', body: JSON.stringify(data) });
  },
  updateLeaveStatus(id, status) {
    return this.request(`/leave-requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },

  // Reports
  getReports(startDate = null, endDate = null) {
    const q = new URLSearchParams();
    if (startDate) q.append('start_date', startDate);
    if (endDate) q.append('end_date', endDate);
    return this.request(`/reports${q.toString() ? `?${q.toString()}` : ''}`);
  },

  // AI Meal Demand Forecast
  getAiPrediction(date = null) {
    return this.request(`/ai/prediction${date ? `?date=${encodeURIComponent(date)}` : ''}`);
  },

  // Reset Demo
  resetDemo() {
    return this.request('/reset-demo', { method: 'POST', body: JSON.stringify({}) });
  }
};
