import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

export const checkWms = async (payload) => {
  return axios.post(`${API_BASE}/wms/check`, payload);
};

export const discoverLayers = async (payload) => {
  return axios.post(`${API_BASE}/wms/discover`, payload);
};

export const fetchFeatureInfo = async (payload) => {
  return axios.post(`${API_BASE}/wms/feature-info`, payload);
};

export const addLayer = async (payload) => {
  return axios.post(`${API_BASE}/layers`, payload);
};

export const fetchLayers = async () => {
  return axios.get(`${API_BASE}/layers`);
};

export const updateLayerVisibility = async (id, payload) => {
  return axios.put(`${API_BASE}/layers/${id}/visibility`, payload);
};

export const deleteLayer = async (id) => {
  return axios.delete(`${API_BASE}/layers/${id}`);
};
