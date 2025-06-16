import React, { useState, useEffect } from 'react';
import FlashcardStatsGridYear from '../components/FlashcardStatsGridYear';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Logout as LogoutIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { getUserProfile, updateUserProfile, logoutUser } from '../api/notesApi';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    language: 'en'
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await getUserProfile();
      setProfile(prev => ({
        ...prev,
        username: response.data.username,
        email: response.data.email,
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      setError('Не удалось загрузить профиль');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    // Clear any previous messages when user starts typing
    setError(null);
    setSuccess(null);
  };

  const handleSettingChange = (setting) => (event) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  const handleLanguageChange = (event) => {
    setSettings(prev => ({
      ...prev,
      language: event.target.value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); // Reload original data
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validate passwords if changing password
    if (profile.new_password || profile.confirm_password || profile.current_password) {
      if (!profile.current_password) {
        setError('Для смены пароля требуется текущий пароль');
        setSaving(false);
        return;
      }
      if (profile.new_password !== profile.confirm_password) {
        setError('Пароли не совпадают');
        setSaving(false);
        return;
      }
      if (profile.new_password.length < 8) {
        setError('Новый пароль должен быть не менее 8 символов');
        setSaving(false);
        return;
      }
    }

    try {
      const updateData = {
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name
      };

      // Only include password fields if they're being changed
      if (profile.new_password) {
        updateData.current_password = profile.current_password;
        updateData.new_password = profile.new_password;
      }

      await updateUserProfile(updateData);
      setSuccess('Профиль успешно обновлен');
      setIsEditing(false);
      
      // Clear password fields
      setProfile(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (err) {
      console.error('Ошибка обновления профиля:', err);
      if (err.response?.data) {
        const errorMessages = Object.entries(err.response.data)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError('Ошибка обновления профиля');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError('Ошибка выхода');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 4, pb: 8 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2.5rem',
              mr: 3
            }}
          >
            {profile.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {profile.username}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {profile.email}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
            onClick={isEditing ? handleSubmit : handleEdit}
          >
            {isEditing ? 'Сохранить' : 'Редактировать профиль'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Персональная информация
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Логин"
                  secondary={
                    isEditing ? (
                      <TextField
                        fullWidth
                        name="username"
                        value={profile.username}
                        onChange={handleChange}
                        size="small"
                        margin="dense"
                      />
                    ) : (
                      profile.username
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Почта"
                  secondary={
                    isEditing ? (
                      <TextField
                        fullWidth
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        size="small"
                        margin="dense"
                      />
                    ) : (
                      profile.email
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="ФИО"
                  secondary={
                    isEditing ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          name="first_name"
                          value={profile.first_name}
                          onChange={handleChange}
                          placeholder="Имя"
                          size="small"
                          margin="dense"
                        />
                        <TextField
                          name="last_name"
                          value={profile.last_name}
                          onChange={handleChange}
                          placeholder="Фамилия"
                          size="small"
                          margin="dense"
                        />
                      </Box>
                    ) : (
                      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Not set'
                    )
                  }
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {isEditing && (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Изменить пароль
                  </Typography>
                </Divider>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Текущий пароль"
                  name="current_password"
                  type={showPassword.current ? 'text' : 'password'}
                  value={profile.current_password}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('current')}
                          edge="end"
                        >
                          {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Новый пароль"
                  name="new_password"
                  type={showPassword.new ? 'text' : 'password'}
                  value={profile.new_password}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                        >
                          {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Повторите новый пароль"
                  name="confirm_password"
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={profile.confirm_password}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                        >
                          {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setLogoutDialogOpen(true)}
          >
            Выход
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Подтвердите выход</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены что хотите выйти?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Выход
          </Button>
        </DialogActions>
      </Dialog>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Статистика решений за последний год
        </Typography>
        <FlashcardStatsGridYear />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          {/* Здесь можно добавить дополнительные метрики, если нужно */}
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage; 