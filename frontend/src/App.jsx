import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import AppLayout from './components/AppLayout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import NotesPage from './pages/NotesPage';
import NoteEditor from './components/NoteEditor';
import TagsPage from './pages/TagsPage';
import FolderManager from './components/FolderManager';
import ProfilePage from './pages/ProfilePage';
import FlashcardsPage from './pages/FlashcardsPage';
import FlashcardsStatsPage from './pages/FlashcardsStatsPage';

// Auth guard component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#a855f7',
    },
    background: {
      default: '#1e1e2e',
      paper: '#27273a',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a27',
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e2e',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: '#27273a',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout>
                <NotesPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/notes" element={
            <PrivateRoute>
              <AppLayout>
                <NotesPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/note/new" element={
            <PrivateRoute>
              <AppLayout>
                <NoteEditor />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/note/:id" element={
            <PrivateRoute>
              <AppLayout>
                <NoteEditor />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/folder/:id" element={
            <PrivateRoute>
              <AppLayout>
                <NotesPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/folder/new" element={
            <PrivateRoute>
              <AppLayout>
                <FolderManager mode="create" />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/folder/edit/:id" element={
            <PrivateRoute>
              <AppLayout>
                <FolderManager mode="edit" />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/tags" element={
            <PrivateRoute>
              <AppLayout>
                <TagsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/flashcards" element={
            <PrivateRoute>
              <AppLayout>
                <FlashcardsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/flashcards-stats" element={
            <PrivateRoute>
              <AppLayout>
                <FlashcardsStatsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 