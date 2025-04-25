import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Typography,
  Box
} from '@mui/material';
import { getFolders, getNote, patchNote } from '../api/notesApi';

const MoveNoteDialog = ({ open, onClose, note, onSuccess }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(note?.folder || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setSelectedFolder(note?.folder || '');
      setError(null);
      loadFolders();
    }
  }, [open, note]);

  const loadFolders = async () => {
    try {
      const response = await getFolders();
      setFolders(response.data);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders');
    }
  };

  const handleChange = (e) => {
    setSelectedFolder(e.target.value);
  };

  const handleMove = async () => {
    setLoading(true);
    try {
      // Отправляем только необходимые поля для обновления
      // При частичном обновлении используем PATCH
      const updatedData = {
        folder: selectedFolder === '' ? null : selectedFolder
      };
      
      console.log('Отправляем на сервер (PATCH):', updatedData);
      
      // Используем patchNote вместо updateNote
      await patchNote(note.id, updatedData);
      
      setLoading(false);
      onSuccess && onSuccess(selectedFolder);
      onClose();
    } catch (err) {
      console.error('Error moving note:', err);
      
      // Детальная информация об ошибке
      if (err.response && err.response.data) {
        console.error('Server error details:', err.response.data);
        if (typeof err.response.data === 'object') {
          // Форматируем ошибки из объекта
          const errorMessages = Object.entries(err.response.data)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          setError(`Failed to move note: ${errorMessages}`);
        } else {
          setError(`Failed to move note: ${err.response.data}`);
        }
      } else {
        setError(`Failed to move note: ${err.message}`);
      }
      
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move Note to Folder</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="move-folder-label">Folder</InputLabel>
            <Select
              labelId="move-folder-label"
              id="move-folder"
              value={selectedFolder || ''}
              onChange={handleChange}
              label="Folder"
            >
              <MenuItem value="">
                <em>None (Root)</em>
              </MenuItem>
              {folders.map((folder) => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleMove} 
          color="primary" 
          variant="contained"
          disabled={loading}
        >
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveNoteDialog; 