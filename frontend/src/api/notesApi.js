import axios from 'axios';

// Используем правильный URL для API
const API_URL = 'http://localhost:8000/api';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
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
        if (!refreshToken) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        });
        
        localStorage.setItem('token', response.data.access);
        
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
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
  return api.get('/auth/profile/');
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  return Promise.resolve();
};

// Note API calls
export const getNotes = (params = {}) => {
  console.log('Fetching notes with params:', params);
  return api.get('/notes/', { params })
    .then(response => {
      console.log('Notes API response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Error fetching notes:', error);
      throw error;
    });
};

export const getNote = (id) => {
  return api.get(`/notes/${id}/`);
};

export const createNote = (note) => {
  console.log('Creating note:', note);
  return api.post('/notes/', note)
    .then(response => {
      console.log('Create note response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Error creating note:', error);
      throw error;
    });
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

// User API calls
export const getUserByEmail = (email) => {
  return api.get(`/users/`, { params: { email } })
    .then(response => {
      console.log('Get user by email response:', response.data);
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error('User not found');
    })
    .catch(error => {
      console.error('Get user by email error:', error.response?.data);
      throw error;
    });
};

export const getUserByUsername = (username) => {
  return api.get(`/users/`, { params: { username } })
    .then(response => {
      console.log('Get user by username response:', response.data);
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error('User not found');
    })
    .catch(error => {
      console.error('Get user by username error:', error.response?.data);
      throw error;
    });
};

// Note sharing API calls
export const shareNote = async (noteId, shareData) => {
  try {
    // Отправляем запрос на шаринг с логином
    const requestData = {
      shared_with: shareData.shared_with, // Отправляем логин напрямую
      can_edit: shareData.can_edit
    };

    console.log('Sharing note:', noteId, 'with data:', requestData);
    const response = await api.post(`/notes/${noteId}/share/`, requestData);
    console.log('Share response:', response.data);
    return response;
  } catch (error) {
    console.error('Share error:', error.response?.data);
    throw error;
  }
};

export const getNoteShares = (noteId) => {
  return api.get(`/notes/${noteId}/shares/`)
    .then(response => {
      console.log('Get shares response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Get shares error:', error.response?.data);
      throw error;
    });
};

export const removeShare = (noteId, shareId) => {
  return api.post(`/notes/${noteId}/shares/${shareId}/remove_access/`)
    .then(response => {
      console.log('Remove share response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Remove share error:', error.response?.data);
      throw error;
    });
}; 