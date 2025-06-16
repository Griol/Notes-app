import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  TextField, Button, Box, Paper, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { createFolder, getFolder, updateFolder, getFolders } from '../api/notesApi';

const FolderManager = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentIdFromQuery = searchParams.get('parent');
  
  const [folder, setFolder] = useState({
    name: '',
    parent: parentIdFromQuery || null
  });
  const [parentFolders, setParentFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load parent folders for selection
        const foldersResponse = await getFolders();
        setParentFolders(foldersResponse.data);
        
        // If editing, load folder data
        if (mode === 'edit' && id) {
          const folderResponse = await getFolder(id);
          setFolder({
            name: folderResponse.data.name,
            parent: folderResponse.data.parent
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Ошибка загрузки папки');
        setLoading(false);
      }
    };
    
    loadData();
  }, [mode, id, parentIdFromQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFolder(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'edit' && id) {
        await updateFolder(id, folder);
      } else {
        await createFolder(folder);
      }
      navigate(-1);
    } catch (err) {
      setError('Ошибка сохранения папки');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {mode === 'edit' ? 'Редактировать папку' : 'Создать новую папку'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Название папки"
            name="name"
            value={folder.name}
            onChange={handleChange}
            autoFocus
            disabled={loading}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="parent-folder-label">Родительская папка (необязательно)</InputLabel>
            <Select
              labelId="parent-folder-label"
              id="parent"
              name="parent"
              value={folder.parent || ''}
              label="Родительская папка (необязательно)"
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value="">
                <em>None (Root folder)</em>
              </MenuItem>
              {parentFolders
                .filter(f => f.id !== (id ? parseInt(id) : null)) // Prevent selecting self as parent
                .map(folder => (
                  <MenuItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !folder.name}
            >
              {loading ? 'Сохранение...' : mode === 'edit' ? 'Обновить' : 'Создать'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FolderManager; 