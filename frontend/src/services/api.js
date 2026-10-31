import axios from 'axios';

const API_BASE = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach JWT token automatically if present in localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('opsloop_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const loginApi = async (email, password, roleHint) => {
  const res = await api.post('/auth/login', { email, password, roleHint });
  return res.data;
};

export const registerApi = async (payload) => {
  const res = await api.post('/auth/register', payload);
  return res.data;
};

export const getCurrentUserApi = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Clinic Owner API
export const getClinicDashboard = async (slug = 'sanjeevani-clinic') => {
  const res = await api.get(`/clinic/${slug}/dashboard`);
  return res.data;
};

export const updateClinicStatus = async (slug, status) => {
  const res = await api.put(`/clinic/${slug}/status`, { status });
  return res.data;
};

export const updateEmergencyBroadcast = async (slug, notice, isActive) => {
  const res = await api.put(`/clinic/${slug}/emergency-broadcast`, { notice, isActive });
  return res.data;
};

export const createWalkInAppointment = async (payload) => {
  const res = await api.post('/clinic/appointments/walk-in', payload);
  return res.data;
};

export const updateAppointmentStatus = async (id, status) => {
  const res = await api.put(`/clinic/appointments/${id}/status`, { status });
  return res.data;
};

export const toggleDoctorDuty = async (id) => {
  const res = await api.put(`/clinic/doctors/${id}/duty`);
  return res.data;
};

export const setDoctorDelay = async (id, delayMinutes) => {
  const res = await api.put(`/clinic/doctors/${id}/delay`, { delayMinutes });
  return res.data;
};

// Customer QR Portal API
export const getCustomerClinicInfo = async (slug = 'sanjeevani-clinic') => {
  const res = await api.get(`/customer/clinic/${slug}`);
  return res.data;
};

export const bookCustomerSlot = async (payload) => {
  const res = await api.post('/customer/book', payload);
  return res.data;
};

export const sendCustomerEnquiry = async (payload) => {
  const res = await api.post('/customer/enquiry', payload);
  return res.data;
};

export const triageSymptomsWithAi = async (payload) => {
  const res = await api.post('/customer/triage-symptoms', payload);
  return res.data;
};

export const getCustomerAppointment = async (id) => {
  const res = await api.get(`/customer/appointment/${id}`);
  return res.data;
};

export const sendNetworkFailureAlert = async (payload) => {
  const res = await api.post('/customer/network-failure-alert', payload);
  return res.data;
};

export const confirmNetworkAlertApi = async (alertId) => {
  const res = await api.post(`/clinic/network-alerts/${alertId}/confirm`);
  return res.data;
};

export const updateNetworkAlertStatusApi = async (alertId, status) => {
  const res = await api.put(`/clinic/network-alerts/${alertId}/status`, { status });
  return res.data;
};

// Graduate API
export const getGraduateTasks = async (graduateId) => {
  const res = await api.get(`/graduate/${graduateId}/tasks`);
  return res.data;
};

export const resolveGraduateTask = async (taskId, payload) => {
  const res = await api.put(`/graduate/tasks/${taskId}/resolve`, payload);
  return res.data;
};

// Doctor Dashboard APIs
export const getDoctorProfileApi = async () => {
  const res = await api.get('/doctor/profile');
  return res.data;
};

export const updateDoctorSlotsApi = async (payload) => {
  const res = await api.put('/doctor/slots', payload);
  return res.data;
};

export const getDoctorAppointmentsApi = async () => {
  const res = await api.get('/doctor/appointments');
  return res.data;
};

export const acceptDoctorAppointmentApi = async (id, payload = {}) => {
  const res = await api.put(`/doctor/appointments/${id}/accept`, payload);
  return res.data;
};

export const updateDoctorAppointmentStatusApi = async (id, payload) => {
  const res = await api.put(`/doctor/appointments/${id}/status`, payload);
  return res.data;
};

// Slot Locking & 20-min Reservation APIs
export const holdSlotApi = async (payload) => {
  const res = await api.post('/customer/hold-slot', payload);
  return res.data;
};

export const releaseSlotApi = async (payload) => {
  const res = await api.post('/customer/release-slot', payload);
  return res.data;
};

export const getActiveLocksApi = async (params = {}) => {
  const res = await api.get('/customer/active-locks', { params });
  return res.data;
};

export const clinicHoldSlotApi = async (payload) => {
  const res = await api.post('/clinic/slots/hold', payload);
  return res.data;
};

export const clinicReleaseSlotApi = async (payload) => {
  const res = await api.post('/clinic/slots/release', payload);
  return res.data;
};

export const getClinicActiveLocksApi = async (slug, params = {}) => {
  const res = await api.get(`/clinic/${slug}/slots/active-locks`, { params });
  return res.data;
};

