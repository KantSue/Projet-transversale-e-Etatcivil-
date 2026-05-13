import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = "http://10.210.105.55:8000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Ajouter le token automatiquement à chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;