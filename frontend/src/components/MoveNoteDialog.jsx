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
  Box,
  IconButton
} from '@mui/material';
import { getFolders, getNote, patchNote } from '../api/notesApi';
import { Folder as FolderIcon, ExpandLess, ExpandMore } from '@mui/icons-material';

const MoveNoteDialog = ({ open, onClose, note, onSuccess }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(note?.folder || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openFolders, setOpenFolders] = useState({});

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

  const toggleFolderOpen = (folderId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const renderFolderMenuItem = (folder, level = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isOpen = openFolders[folder.id] || false;

    return (
      <React.Fragment key={folder.id}>
        <MenuItem 
          value={folder.id}
          sx={{ pl: level ? 2 + level * 2 : 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <FolderIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography sx={{ flexGrow: 1 }}>{folder.name}</Typography>
            {hasChildren && (
              <IconButton
                size="small"
                onClick={(e) => toggleFolderOpen(folder.id, e)}
                sx={{ ml: 1 }}
              >
                {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </MenuItem>
        {hasChildren && isOpen && (
          folder.children.map(childFolder => renderFolderMenuItem(childFolder, level + 1))
        )}
      </React.Fragment>
    );
  };

  const handleMove = async () => {
    setLoading(true);
    try {
      const updatedData = {
        folder: selectedFolder === '' ? null : selectedFolder
      };
      
      await patchNote(note.id, updatedData);
      
      setLoading(false);
      onSuccess && onSuccess(selectedFolder);
      onClose();
    } catch (err) {
      console.error('Error moving note:', err);
      if (err.response && err.response.data) {
        const errorMessages = Object.entries(err.response.data)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        setError(`Failed to move note: ${errorMessages}`);
      } else {
        setError(`Failed to move note: ${err.message}`);
      }
      setLoading(false);
    }
  };

  // Filter root folders (those without parents)
  const rootFolders = folders.filter(folder => !folder.parent);

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
              {rootFolders.map(folder => renderFolderMenuItem(folder))}
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