import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, TextField, Button, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider,
  Alert, CircularProgress, Grid
} from '@mui/material';
import { Add, Delete, Label, Search } from '@mui/icons-material';
import { getTags, createTag, deleteTag, getNotes } from '../api/notesApi';

const TagsPage = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openTagDialog, setOpenTagDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagNotes, setTagNotes] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await getTags();
      setTags(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to load tags');
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag({ name: newTagName });
      setNewTagName('');
      fetchTags();
    } catch (err) {
      console.error('Error creating tag:', err);
      setError('Failed to create tag');
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await deleteTag(tagId);
      setConfirmDelete(null);
      fetchTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError('Failed to delete tag');
    }
  };

  const handleTagClick = async (tag) => {
    setSelectedTag(tag);
    setLoading(true);
    try {
      const response = await getNotes({ tags: tag.name });
      setTagNotes(response.data);
      setOpenTagDialog(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tag notes:', err);
      setError('Failed to load tag notes');
      setLoading(false);
    }
  };

  const filteredTags = searchTerm 
    ? tags.filter(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : tags;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tags
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleCreateTag} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            label="New Tag Name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mr: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<Add />}
            disabled={!newTagName.trim()}
          >
            Add Tag
          </Button>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search Tags"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            placeholder="Filter tags..."
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredTags.length > 0 ? (
          <Grid container spacing={1}>
            {filteredTags.map(tag => (
              <Grid item key={tag.id}>
                <Chip
                  label={tag.name}
                  icon={<Label />}
                  onClick={() => handleTagClick(tag)}
                  onDelete={() => setConfirmDelete(tag)}
                  sx={{ m: 0.5 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography align="center" color="text.secondary">
            No tags found
          </Typography>
        )}
      </Paper>

      {/* Tag Details Dialog */}
      <Dialog open={openTagDialog} onClose={() => setOpenTagDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Label sx={{ mr: 1 }} />
            <Typography variant="h6">
              {selectedTag?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Notes with this tag:
          </Typography>
          {tagNotes.length > 0 ? (
            <List>
              {tagNotes.map(note => (
                <React.Fragment key={note.id}>
                  <ListItem button onClick={() => {
                    navigate(`/note/${note.id}`);
                    setOpenTagDialog(false);
                  }}>
                    <ListItemText
                      primary={note.title}
                      secondary={new Date(note.updated_at).toLocaleDateString()}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" align="center">
              No notes found with this tag
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTagDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the tag "{confirmDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button 
            color="error" 
            onClick={() => handleDeleteTag(confirmDelete.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TagsPage; 