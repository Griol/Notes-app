import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Box,
  Chip,
  Autocomplete,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { getNote, createNote, updateNote, getTags, getFolders } from '../api/notesApi';
import ShareIcon from '@mui/icons-material/Share';
import ShareNoteDialog from './ShareNoteDialog';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState({
    title: '',
    content: '',
    folder: null,
    tag_names: [],
    version: 1
  });
  const [allTags, setAllTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [serverNote, setServerNote] = useState(null);
  const [localChanges, setLocalChanges] = useState(null);

  useEffect(() => {
    // Load all tags for autocomplete
    const loadTags = async () => {
      try {
        const response = await getTags();
        setAllTags(Array.isArray(response.data) ? response.data.map(tag => tag.name) : []);
      } catch (err) {
        console.error('Error loading tags:', err);
      }
    };

    // Load all folders
    const loadFolders = async () => {
      try {
        const response = await getFolders();
        setFolders(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error loading folders:', err);
      }
    };

    loadTags();
    loadFolders();

    // If editing an existing note, fetch its data
    if (id) {
      const loadNote = async () => {
        setLoading(true);
        try {
          const response = await getNote(id);
          setNote({
            ...response.data,
            tag_names: Array.isArray(response.data.tags) ? response.data.tags.map(tag => tag.name) : [],
            version: response.data.version
          });
          setLoading(false);
        } catch (err) {
          setError('Failed to load note');
          setLoading(false);
        }
      };
      
      loadNote();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (event, newValue) => {
    setNote(prev => ({ ...prev, tag_names: newValue }));
  };

  const handleFolderChange = (e) => {
    const folderId = e.target.value === '' ? null : e.target.value;
    setNote(prev => ({ ...prev, folder: folderId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteData = {
        title: note.title,
        content: note.content,
        folder: note.folder,
        tag_names: note.tag_names,
        version: note.version
      };

      console.log('Submitting note data:', noteData);

      if (id) {
        const response = await updateNote(id, noteData);
        console.log('Update response:', response);
      } else {
        const response = await createNote(noteData);
        console.log('Create response:', response);
      }
      setLoading(false);
      // Обновляем список заметок перед возвратом на предыдущую страницу
      window.dispatchEvent(new CustomEvent('notesUpdated'));
      navigate(-1);
    } catch (err) {
      console.error('Error saving note:', err);
      
      // Проверяем, является ли ошибка конфликтом версий
      if (err.response?.status === 400 && err.response?.data?.version) {
        // Сохраняем локальные изменения
        setLocalChanges({ ...note });
        
        // Получаем актуальную версию с сервера
        try {
          const response = await getNote(id);
          setServerNote(response.data);
          setConflictDialogOpen(true);
        } catch (fetchErr) {
          console.error('Error fetching server version:', fetchErr);
          setError('Failed to resolve conflict');
        }
      } else {
        setError(`Failed to save note: ${err.response?.data?.detail || err.message}`);
      }
      setLoading(false);
    }
  };

  const handleResolveConflict = async (useServerVersion) => {
    if (useServerVersion) {
      // Используем версию с сервера
      setNote({
        ...serverNote,
        tag_names: serverNote.tags.map(tag => tag.name),
        version: serverNote.version
      });
    } else {
      // Используем локальные изменения, но с новой версией
      const updatedNote = {
        ...localChanges,
        version: serverNote.version
      };
      setNote(updatedNote);
      
      // Пробуем сохранить снова
      try {
        await updateNote(id, updatedNote);
        navigate(-1);
      } catch (err) {
        setError('Failed to save changes after conflict resolution');
      }
    }
    setConflictDialogOpen(false);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          {id ? 'Edit Note' : 'Create New Note'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              variant="standard"
              value={note.title}
              onChange={handleChange}
              name="title"
              id="note-title"
              placeholder="Note title"
              sx={{ flexGrow: 1 }}
            />
            <Tooltip title="Share note">
              <IconButton onClick={() => setShareDialogOpen(true)}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              type="submit"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
          
          <TextField
            multiline
            fullWidth
            value={note.content}
            onChange={handleChange}
            name="content"
            id="note-content"
            placeholder="Start writing..."
            variant="outlined"
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                height: '100%',
                '& textarea': {
                  height: '100% !important',
                },
              },
            }}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="folder-label">Папка</InputLabel>
            <Select
              labelId="folder-label"
              id="note-folder"
              name="folder"
              value={note.folder || ''}
              onChange={handleFolderChange}
              label="Папка"
            >
              <MenuItem value="">
                <em>Нет</em>
              </MenuItem>
              {Array.isArray(folders) && folders.map((folder) => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Выберите папку для заметки</FormHelperText>
          </FormControl>
          
          <Autocomplete
            multiple
            id="note-tags"
            name="tags"
            options={allTags}
            value={note.tag_names}
            onChange={handleTagChange}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip 
                  key={index}
                  variant="outlined" 
                  label={option} 
                  {...getTagProps({ index })} 
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Теги"
                placeholder="Добавить теги"
                margin="normal"
                id="note-tags-input"
                name="tags-input"
              />
            )}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              onClick={() => navigate(-1)} 
              variant="outlined"
            >
              Cancel
            </Button>
          </Box>
        </Box>

        <ShareNoteDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          note={note}
          onSuccess={() => setShareDialogOpen(false)}
        />
      </Paper>

      {/* Диалог разрешения конфликтов */}
      <Dialog open={conflictDialogOpen} onClose={() => setConflictDialogOpen(false)}>
        <DialogTitle>Conflict Detected</DialogTitle>
        <DialogContent>
          <Typography>
            This note has been modified by another user. How would you like to resolve this conflict?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Server Version:</Typography>
            <Typography variant="body2" color="text.secondary">
              Title: {serverNote?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date(serverNote?.updated_at).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Your Version:</Typography>
            <Typography variant="body2" color="text.secondary">
              Title: {localChanges?.title}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleResolveConflict(true)}>
            Use Server Version
          </Button>
          <Button onClick={() => handleResolveConflict(false)} color="primary">
            Keep My Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NoteEditor; 