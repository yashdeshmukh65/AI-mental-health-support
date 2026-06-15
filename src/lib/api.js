import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios interceptor to automatically attach Supabase JWT token to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data?.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// API Endpoints
export const submitAssessmentApi = async (category, answers) => {
  const response = await api.post('/assessments/', { category, answers })
  return response.data
}

export const sendChatMessageApi = async (message, history = []) => {
  const response = await api.post('/chat/', { message, history })
  return response.data
}

export const runAnalyticsApi = async () => {
  const response = await api.post('/analytics/')
  return response.data
}

export const getRoutineApi = async () => {
  const response = await api.get('/wellness/routine')
  return response.data
}

export const submitDailyFeedbackApi = async (feedbackText, day = 1) => {
  const response = await api.post('/wellness/daily-feedback', { feedback_text: feedbackText, day })
  return response.data
}

export const submitGameBehaviorApi = async (gameType, telemetry) => {
  const response = await api.post('/wellness/game-behavior', { game_type: gameType, telemetry })
  return response.data
}

export default api;
