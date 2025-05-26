import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Box, Chip, Autocomplete, Paper, Typography, 
  FormControl, InputLabel, Select, MenuItem, FormHelperText, IconButton
} from '@mui/material';
import { getNote, createNote, updateNote, getTags, getFolders } from '../api/notesApi';
import { Folder as FolderIcon, LocalOffer as TagIcon } from '@mui/icons-material';
import Popover from '@mui/material/Popover';
import TextareaAutosize from '@mui/material/TextareaAutosize';

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
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folderAnchor, setFolderAnchor] = useState(null);
  const [tagsAnchor, setTagsAnchor] = useState(null);

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

    // Load all folders
    const loadFolders = async () => {
      try {
        const response = await getFolders();
        setFolders(response.data);
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

  const handleFolderChange = (e) => {
    setNote(prev => ({ ...prev, folder: e.target.value === '' ? null : e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await updateNote(id, note);
      } else {
        await createNote(note);
      }
      navigate(-1);
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
      setLoading(false);
    }
  };

  const getFolderPath = (folder, folders) => {
    const path = [];
    let currentFolder = folder;
    
    while (currentFolder) {
      path.unshift(currentFolder.name);
      currentFolder = folders.find(f => f.id === currentFolder.parent);
    }
    
    return path.join(' / ');
  };

  const renderFolderOptions = (folders) => {
    // Sort folders to show parent folders first
    const sortedFolders = [...folders].sort((a, b) => {
      // First sort by path length (parent folders first)
      const aPath = getFolderPath(a, folders).split(' / ').length;
      const bPath = getFolderPath(b, folders).split(' / ').length;
      if (aPath !== bPath) return aPath - bPath;
      // Then sort by full path
      return getFolderPath(a, folders).localeCompare(getFolderPath(b, folders));
    });

    return sortedFolders.map((folder) => {
      const folderPath = getFolderPath(folder, folders);
      return (
        <MenuItem key={folder.id} value={folder.id}>
          {folderPath}
        </MenuItem>
      );
    });
  };

  const handleFolderButtonClick = (event) => {
    setFolderAnchor(event.currentTarget);
  };
  const handleFolderClose = () => {
    setFolderAnchor(null);
  };
  const handleTagsButtonClick = (event) => {
    setTagsAnchor(event.currentTarget);
  };
  const handleTagsClose = () => {
    setTagsAnchor(null);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 0, background: 'transparent' }}>
      <TextField
        variant="standard"
        fullWidth
        name="title"
        value={note.title}
        onChange={handleChange}
        placeholder="Title"
        InputProps={{
          disableUnderline: true,
          style: { fontSize: 32, fontWeight: 700, background: 'transparent', border: 'none', color: '#fff' }
        }}
        sx={{ mb: 2, pl: 0, pr: 0, background: 'transparent' }}
        autoFocus
      />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton size="small" onClick={handleFolderButtonClick} aria-label="Select folder">
          <FolderIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleTagsButtonClick} aria-label="Select tags">
          <TagIcon fontSize="small" />
        </IconButton>
        {note.folder && (
          <Typography variant="body2" sx={{ ml: 1 }} color="text.secondary">
            {(() => {
              const folderObj = folders.find(f => f.id === note.folder);
              return folderObj ? getFolderPath(folderObj, folders) : '';
            })()}
          </Typography>
        )}
        {note.tag_names.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
            {note.tag_names.map(tag => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        )}
      </Box>
      <TextareaAutosize
        minRows={10}
        value={note.content}
        onChange={e => setNote(prev => ({ ...prev, content: e.target.value }))}
        placeholder="content"
        style={{
          width: '100%',
          fontSize: 18,
          fontWeight: 400,
          background: 'transparent',
          border: 'none',
          color: '#fff',
          outline: 'none',
          resize: 'none',
          marginTop: 16,
          padding: 0
        }}
      />
      <Popover
        open={Boolean(folderAnchor)}
        anchorEl={folderAnchor}
        onClose={handleFolderClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Folder</Typography>
          <FormControl fullWidth>
            <Select
              size="small"
              value={note.folder || ''}
              onChange={e => {
                handleFolderChange(e);
                handleFolderClose();
              }}
              displayEmpty
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {renderFolderOptions(folders)}
            </Select>
          </FormControl>
        </Box>
      </Popover>
      <Popover
        open={Boolean(tagsAnchor)}
        anchorEl={tagsAnchor}
        onClose={handleTagsClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={allTags}
            value={note.tag_names}
            onChange={(event, newValue) => {
              setNote(prev => ({ ...prev, tag_names: newValue }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Add tags"
                placeholder="Add tags"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  size="small"
                />
              ))
            }
          />
        </Box>
      </Popover>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !note.title || !note.content}
        >
          {loading ? 'Saving...' : id ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};

export default NoteEditor; 