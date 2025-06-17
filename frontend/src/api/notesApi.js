import axios from 'axios';

// Для деплоя на Render, используйте домен вашего бэкенд-сервиса
const API_URL = 'https://notes-app-6yx2.onrender.com/api';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Для разработки отключаем credentials, чтобы избежать проблем с CORS
  withCredentials: false
});

// Intercept requests to add authentication token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Handle token refresh on 401 errors
api.interceptors.response.use(
  response => response,
  async error => {
    console.log('API Error:', error);
    
    if (!error.response) {
      console.error('Network Error or API unavailable:', error);
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Если нет refreshToken, перенаправляем на логин
        if (!refreshToken) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        });
        
        localStorage.setItem('token', response.data.access);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication related API calls
export const registerUser = (userData) => {
  return api.post('/auth/register/', userData);
};

export const loginUser = (credentials) => {
  return api.post('/auth/login/', credentials);
};

export const getUserProfile = () => {
  return api.get('/users/profile/');
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  return Promise.resolve();
};

// Note API calls
export const getNotes = (params = {}) => {
  return api.get('/notes/', { params });
};

export const getNote = (id) => {
  return api.get(`/notes/${id}/`);
};

export const createNote = (noteData) => {
  return api.post('/notes/', noteData);
};

export const updateNote = (id, noteData) => {
  return api.put(`/notes/${id}/`, noteData);
};

export const patchNote = (id, noteData) => {
  return api.patch(`/notes/${id}/`, noteData);
};

export const deleteNote = (id) => {
  return api.delete(`/notes/${id}/`);
};

// Folder API calls
export const getFolders = () => {
  return api.get('/folders/');
};

export const getFolder = (id) => {
  return api.get(`/folders/${id}/`);
};

export const createFolder = (folderData) => {
  return api.post('/folders/', folderData);
};

export const updateFolder = (id, folderData) => {
  return api.put(`/folders/${id}/`, folderData);
};

export const deleteFolder = (id) => {
  return api.delete(`/folders/${id}/`);
};

// Tag API calls
export const getTags = () => {
  return api.get('/tags/');
};

export const getTag = (id) => {
  return api.get(`/tags/${id}/`);
};

export const createTag = (tagData) => {
  return api.post('/tags/', tagData);
};

export const updateTag = (id, tagData) => {
  return api.put(`/tags/${id}/`, tagData);
};

export const deleteTag = (id) => {
  return api.delete(`/tags/${id}/`);
};

// Structure and sidebar API calls
export const getFolderStructure = () => {
  return api.get('/structure/');
};

export const getSidebar = () => {
  return api.get('/sidebar/');
};

// User Profile API calls
export const updateUserProfile = (profileData) => {
  return api.put('/users/profile/', profileData);
};

// Flashcard API calls
export const getFlashcards = (params = {}) => {
  return api.get('/flashcards/', { params });
};

export const getFlashcard = (id) => {
  return api.get(`/flashcards/${id}/`);
};

export const createFlashcard = (flashcardData) => {
  return api.post('/flashcards/', flashcardData);
};

export const updateFlashcard = (id, flashcardData) => {
  return api.put(`/flashcards/${id}/`, flashcardData);
};

export const deleteFlashcard = (id) => {
  return api.delete(`/flashcards/${id}/`);
};

// FlashcardStat API calls (оценка)
export const createFlashcardStat = (statData) => {
  return api.post('/flashcard-stats/', statData);
};

export const getFlashcardStats = (params = {}) => {
  return api.get('/flashcard-stats/', { params });
};

// DailyFlashcardStat API calls (ежедневная статистика)
export const getDailyFlashcardStats = (params = {}) => {
  return api.get('/daily-flashcard-stats/', { params });
}; 