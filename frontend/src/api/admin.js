import axios from 'axios';

const token = localStorage.getItem('token');
const config = {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
};

export const fetchAdminRequests = () => axios.get('/api/admin/requests', config);
export const fetchStations = () => axios.get('/api/admin/stations', config);
export const assignStation = (requestId, stationId) => axios.post('/api/admin/assign', { requestId, stationId }, config);
export const createController = (data) => axios.post('/api/admin/create-controller', data, config);
export const createCCPS = (data) => axios.post('/api/controller/create-CCPS', data, config);
