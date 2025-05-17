import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Container, Grid, Card, CardContent, CardActions, Typography, 
  Button, TextField, Box, Chip, IconButton, Paper, InputAdornment,
  Menu, MenuItem, ListItemIcon, ListItemText, Tabs, Tab, Divider,
  Tooltip, Stack, Badge, FormControl, Select
} from '@mui/material';
import { 
  Add, Search, Folder as FolderIcon, Edit, Delete, MoreVert,
  Sort, Article, Label, CalendarToday, Description, FilterList,
  DriveFileMove
} from '@mui/icons-material';
import { getNotes, deleteNote, getFolder, getTags } from '../api/notesApi';
import MoveNoteDialog from '../components/MoveNoteDialog';

const NotesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: folderId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  
  const [notes, setNotes] = useState([]);
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [tagFilter, setTagFilter] = useState(searchParams.get('tags') || '');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteMenuAnchor, setNoteMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewType, setViewType] = useState('all');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  // Determine page title based on URL
  const pageTitle = 
    folderId ? folder?.name || 'Folder' : 
    searchTerm ? `Search: ${searchTerm}` : 
    tagFilter ? `Tag: ${tagFilter}` : 'All Notes';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load tags for filtering
        const tagsResponse = await getTags();
        setAvailableTags(Array.isArray(tagsResponse.data) ? tagsResponse.data : []);
        
        // If we're viewing a folder, load the folder details
        if (folderId) {
          const folderResponse = await getFolder(folderId);
          setFolder(folderResponse.data);
        }
        
        // Fetch notes with filters
        fetchNotes();
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load notes');
        setLoading(false);
      }
    };
    
    fetchData();

    // Добавляем обработчик события обновления заметок
    const handleNotesUpdated = () => {
      fetchNotes();
    };

    window.addEventListener('notesUpdated', handleNotesUpdated);

    // Очищаем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('notesUpdated', handleNotesUpdated);
    };
  }, [folderId, location.search]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {
        folder: folderId || null
      };
      
      // Add search filter if we have a search term
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Add tag filter if we have tag(s)
      if (tagFilter) {
        params.tags = tagFilter;
      }
      
      const response = await getNotes(params);
      
      // Получаем заметки из results, если они есть
      const notesData = response.data.results || [];
      
      // Sort notes based on current sort settings
      let sortedNotes = [...notesData];
      sortedNotes.sort((a, b) => {
        // Handle date fields
        if (['created_at', 'updated_at'].includes(sortBy)) {
          const dateA = new Date(a[sortBy]);
          const dateB = new Date(b[sortBy]);
          return sortDirection === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        }
        
        // Handle text fields
        if (sortDirection === 'asc') {
          return a[sortBy].localeCompare(b[sortBy]);
        } else {
          return b[sortBy].localeCompare(a[sortBy]);
        }
      });
      
      setNotes(sortedNotes);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    if (tagFilter) {
      params.set('tags', tagFilter);
    }
    
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  };

  const handleTagFilterChange = (e) => {
    setTagFilter(e.target.value);
  };

  const handleCreateNote = () => {
    // Navigate to note creation page, passing folder ID if we have one
    const queryParams = folderId ? `?folder=${folderId}` : '';
    navigate(`/note/new${queryParams}`);
  };

  const handleEditNote = (noteId) => {
    navigate(`/note/${noteId}`);
  };

  const handleNoteMenuOpen = (event, note) => {
    event.stopPropagation();
    setSelectedNote(note);
    setNoteMenuAnchor(event.currentTarget);
  };

  const handleNoteMenuClose = () => {
    setNoteMenuAnchor(null);
  };

  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handleDeleteNote = async () => {
    if (selectedNote) {
      try {
        await deleteNote(selectedNote.id);
        // Refresh the notes list
        fetchNotes();
        handleNoteMenuClose();
      } catch (err) {
        setError('Failed to delete note');
      }
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortBy(field);
      setSortDirection('desc');
    }
    
    handleSortMenuClose();
    // Re-fetch and sort notes
    fetchNotes();
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    
    // Set view type based on tab
    const viewTypes = ['all', 'documents', 'folders', 'sources', 'tags', 'daily'];
    setViewType(viewTypes[newValue]);
  };

  const handleMoveNote = () => {
    handleNoteMenuClose();
    setMoveDialogOpen(true);
  };

  const handleMoveSuccess = () => {
    // Refresh notes after successful move
    fetchNotes();
  };

  const renderNoteCard = (note) => (
    <Card
      key={note.id}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        }
      }}
      onClick={() => handleEditNote(note.id)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Description fontSize="small" color="secondary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" component="h2" fontWeight={500} noWrap>
              {note.title || 'Untitled Note'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => handleNoteMenuOpen(e, note)}
            sx={{ mt: -0.5, mr: -0.5 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
        
        {note.folder && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <FolderIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.9rem' }} />
            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
              {note.folder.name}
            </Typography>
          </Box>
        )}
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            fontSize: '0.85rem',
            lineHeight: 1.5
          }}
        >
          {note.content || 'No content'}
        </Typography>
      </CardContent>
      
      <Box sx={{ px: 2, mb: 1.5 }}>
        {note.tags && note.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {note.tags.map(tag => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                icon={<Label fontSize="small" />}
                sx={{ 
                  height: 22, 
                  fontSize: '0.75rem',
                  '& .MuiChip-icon': { fontSize: '0.75rem' } 
                }}
              />
            ))}
          </Stack>
        )}
      </Box>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
        <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
          {new Date(note.updated_at).toLocaleDateString()}
        </Typography>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ pt: 1, pb: 4 }}>
      <Box sx={{ display: 'flex', mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            '.MuiTab-root': { 
              minWidth: 'auto',
              px: 1.5,
              fontSize: '0.85rem',
              textTransform: 'none',
            }
          }}
        >
          <Tab 
            icon={<Article fontSize="small" />}
            iconPosition="start"
            label={`All · ${notes.length}`}
          />
          <Tab 
            icon={<Description fontSize="small" />}
            iconPosition="start"
            label="Documents"
          />
          <Tab 
            icon={<FolderIcon fontSize="small" />}
            iconPosition="start"
            label="Folders"
          />
          <Tab label="Sources" />
          <Tab 
            icon={<Label fontSize="small" />}
            iconPosition="start"
            label="Tags"
          />
          <Tab label="Daily Notes" />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<Sort />}
            onClick={handleSortMenuOpen}
            sx={{ textTransform: 'none' }}
          >
            Sort
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={handleCreateNote}
            sx={{ textTransform: 'none' }}
          >
            New Note
          </Button>
        </Box>
      </Box>
      
      <Paper 
        component="form" 
        onSubmit={handleSearch}
        sx={{ p: 1.5, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}
      >
        <TextField
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            displayEmpty
            value={tagFilter}
            onChange={handleTagFilterChange}
            startAdornment={
              <InputAdornment position="start">
                <FilterList fontSize="small" />
              </InputAdornment>
            }
            renderValue={(selected) => {
              if (!selected) {
                return <Typography color="text.secondary">Filter by tag</Typography>;
              }
              const tagName = availableTags.find(t => t.id.toString() === selected)?.name || selected;
              return <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Label fontSize="small" sx={{ mr: 0.5 }} />
                {tagName}
              </Box>;
            }}
          >
            <MenuItem value="">
              <em>No filter</em>
            </MenuItem>
            {availableTags.map(tag => (
              <MenuItem key={tag.id} value={tag.id.toString()}>
                <ListItemIcon>
                  <Label fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={tag.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button 
          type="submit" 
          variant="contained"
          size="small"
        >
          Search
        </Button>
      </Paper>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Typography variant="h5" component="h1" gutterBottom>
        {pageTitle}
      </Typography>
      
      {loading ? (
        <Typography>Loading notes...</Typography>
      ) : (
        <Grid container spacing={2}>
          {notes.length > 0 ? (
            notes.map(note => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={note.id}>
                {renderNoteCard(note)}
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No notes found. Create a new note to get started.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Note Menu */}
      <Menu
        anchorEl={noteMenuAnchor}
        open={Boolean(noteMenuAnchor)}
        onClose={handleNoteMenuClose}
      >
        <MenuItem onClick={() => {
          handleNoteMenuClose();
          handleEditNote(selectedNote?.id);
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleMoveNote}>
          <ListItemIcon>
            <DriveFileMove fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Move to Folder" />
        </MenuItem>
        <MenuItem onClick={handleDeleteNote}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
      
      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
      >
        <MenuItem onClick={() => handleSort('title')}>
          <ListItemText primary="Title" />
          {sortBy === 'title' && (
            <Typography variant="caption" color="primary">
              {sortDirection === 'asc' ? '(A-Z)' : '(Z-A)'}
            </Typography>
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('updated_at')}>
          <ListItemText primary="Last Updated" />
          {sortBy === 'updated_at' && (
            <Typography variant="caption" color="primary">
              {sortDirection === 'asc' ? '(Oldest)' : '(Newest)'}
            </Typography>
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('created_at')}>
          <ListItemText primary="Created Date" />
          {sortBy === 'created_at' && (
            <Typography variant="caption" color="primary">
              {sortDirection === 'asc' ? '(Oldest)' : '(Newest)'}
            </Typography>
          )}
        </MenuItem>
      </Menu>
      
      {/* Move Note Dialog */}
      {selectedNote && (
        <MoveNoteDialog
          open={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
          note={selectedNote}
          onSuccess={handleMoveSuccess}
        />
      )}
    </Container>
  );
};

export default NotesPage; 