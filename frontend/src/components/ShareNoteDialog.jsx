import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import { shareNote, getNoteShares, removeShare } from '../api/notesApi';

const ShareNoteDialog = ({ open, onClose, note, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(true);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (open && note) {
      loadShares();
    }
  }, [open, note]);

  const loadShares = async () => {
    try {
      const response = await getNoteShares(note.id);
      setShares(response.data);
    } catch (err) {
      console.error('Error loading shares:', err);
      setError('Failed to load shares');
    }
  };

  const handleShare = async () => {
    if (!email) {
      setError('Пожалуйста, введите логин пользователя');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const shareData = {
        shared_with: email,
        can_edit: canEdit
      };
      
      console.log('Sharing note with data:', shareData);
      await shareNote(note.id, shareData);
      
      setEmail('');
      setCanEdit(true);
      await loadShares();
      onSuccess && onSuccess();
    } catch (err) {
      console.error('Error sharing note:', err);
      const errorData = err.response?.data;
      
      if (err.response?.status === 400) {
        if (errorData?.shared_with) {
          // Если ошибка связана с полем shared_with
          if (Array.isArray(errorData.shared_with)) {
            const errorMessage = errorData.shared_with[0];
            if (errorMessage.includes('not found')) {
              setError('Пользователь с таким логином не найден');
            } else {
              setError(errorMessage);
            }
          } else if (typeof errorData.shared_with === 'string') {
            setError(errorData.shared_with);
          } else {
            setError('Неверный формат логина');
          }
        } else if (errorData?.detail) {
          setError(errorData.detail);
        } else if (typeof errorData === 'string') {
          setError(errorData);
        } else {
          setError('Не удалось поделиться заметкой');
        }
      } else if (err.response?.status === 404) {
        setError('Пользователь с таким логином не найден');
      } else {
        setError('Произошла ошибка при попытке поделиться заметкой');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId) => {
    setLoading(true);
    try {
      await removeShare(note.id, shareId);
      await loadShares();
      onSuccess && onSuccess();
    } catch (err) {
      console.error('Error removing share:', err);
      setError('Не удалось удалить доступ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShareIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Поделиться заметкой
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Логин пользователя"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите логин"
            margin="normal"
            error={!!error}
            helperText={error}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
              />
            }
            label="Разрешить редактирование"
          />
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Текущие доступы:
        </Typography>
        
        {loading ? (
          <Typography>Загрузка...</Typography>
        ) : shares.length > 0 ? (
          <List>
            {shares.map(share => (
              <ListItem key={share.id}>
                <ListItemText
                  primary={share.shared_with}
                  secondary={share.can_edit ? 'Может редактировать' : 'Только просмотр'}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveShare(share.id)}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" align="center">
            Нет активных доступов
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={!email || loading}
        >
          {loading ? 'Отправка...' : 'Поделиться'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareNoteDialog; 