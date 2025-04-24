import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Chip, Autocomplete, Paper, Typography } from '@mui/material';
import { getNote, createNote, updateNote, getTags } from '../api/notesApi';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState({
    title: '',
    content: '',
    folder: null,
    tag_names: []
  });
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load all tags for autocomplete
    const loadTags = async () => {
      try {
        const response = await getTags();
        setAllTags(response.data.map(tag => tag.name));
      } catch (err) {
        console.error('Error loading tags:', err);
      }
    };

    loadTags();

    // If editing an existing note, fetch its data
    if (id) {
      const loadNote = async () => {
        setLoading(true);
        try {
          const response = await getNote(id);
          setNote({
            ...response.data,
            tag_names: response.data.tags.map(tag => tag.name),
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Не модифицируем данные - отправляем как есть
    // Сервер ожидает tag_names, которое уже есть в объекте note
    console.log('Sending note data:', note);

    try {
      if (id) {
        const response = await updateNote(id, note);
        console.log('Update response:', response);
      } else {
        const response = await createNote(note);
        console.log('Create response:', response);
      }
      setLoading(false);
      navigate(-1);
    } catch (err) {
      console.error('Error saving note:', err);
      setError(`Failed to save note: ${err.response?.data?.detail || err.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {id ? 'Edit Note' : 'Create New Note'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="title"
          label="Title"
          name="title"
          value={note.title}
          onChange={handleChange}
          autoFocus
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="content"
          label="Content"
          id="content"
          value={note.content}
          onChange={handleChange}
          multiline
          rows={10}
        />
        
        <Autocomplete
          multiple
          id="tags"
          options={allTags}
          value={note.tag_names}
          onChange={handleTagChange}
          freeSolo
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip variant="outlined" label={option} {...getTagProps({ index })} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Tags"
              placeholder="Add tags"
              margin="normal"
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
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {id ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default NoteEditor; 