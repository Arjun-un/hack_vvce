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

// Graduate API
export const getGraduateTasks = async (graduateId) => {
  const res = await api.get(`/graduate/${graduateId}/tasks`);
  return res.data;
};

export const resolveGraduateTask = async (taskId, payload) => {
  const res = await api.put(`/graduate/tasks/${taskId}/resolve`, payload);
  return res.data;
};
