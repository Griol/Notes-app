import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Container, Grid, Card, CardContent, CardActions, Typography, 
  Button, TextField, Box, Chip, IconButton, Paper, InputAdornment,
  Menu, MenuItem, ListItemIcon, ListItemText, Tabs, Tab, Divider,
  Tooltip, Stack, Badge, FormControl, Select, List, ListItem,
  ListItemButton, ListItemAvatar, Avatar
} from '@mui/material';
import { 
  Add, Search, Folder as FolderIcon, AssignmentTurnedIn, Edit, Delete, MoreVert,
  Sort, Article, Label, CalendarToday, Description, FilterList,
  DriveFileMove, ChevronRight, ExpandLess, ExpandMore
} from '@mui/icons-material';
import { getNotes, deleteNote, getFolder, getTags, getFolders, deleteFolder } from '../api/notesApi';
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
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderMenuAnchor, setFolderMenuAnchor] = useState(null);
  const [openFolders, setOpenFolders] = useState({});

  // Determine page title based on URL
  const pageTitle = 
    folderId ? folder?.name || 'Папки' : 
    searchTerm ? `Поиск: ${searchTerm}` : 
    tagFilter ? `Тег: ${tagFilter}` : 'Все заметки';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load tags for filtering
        const tagsResponse = await getTags();
        setAvailableTags(tagsResponse.data);
        
        // Load folders with their structure
        const foldersResponse = await getFolders();
        setFolders(foldersResponse.data);
        
        // If we're viewing a folder, find it in the folders structure
        if (folderId) {
          const findFolder = (folders, id) => {
            for (const folder of folders) {
              if (folder.id.toString() === id.toString()) {
                return folder;
              }
              if (folder.children) {
                const found = findFolder(folder.children, id);
                if (found) return found;
              }
            }
            return null;
          };
          
          const foundFolder = findFolder(foldersResponse.data, folderId);
          if (foundFolder) {
            setSelectedFolder(foundFolder);
            // Automatically open parent folders
            const openParentFolders = (folder) => {
              if (folder.parent) {
                setOpenFolders(prev => ({
                  ...prev,
                  [folder.parent]: true
                }));
                const parentFolder = findFolder(foldersResponse.data, folder.parent);
                if (parentFolder) {
                  openParentFolders(parentFolder);
                }
              }
            };
            openParentFolders(foundFolder);
          }
        }
        
        // Fetch notes with filters
        fetchNotes();
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить заметки');
        setLoading(false);
      }
    };
    
    fetchData();
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
      
      // Sort notes based on current sort settings
      let sortedNotes = [...response.data];
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
      setError('Не удалось загрузить заметки');
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
        setError('Не удалось удалить заметку');
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

  const handleFolderClick = (folder) => {
    navigate(`/folder/${folder.id}`);
    setSelectedFolder(folder);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleFolderMenuOpen = (event, folder) => {
    event.stopPropagation();
    setSelectedFolder(folder);
    setFolderMenuAnchor(event.currentTarget);
  };

  const handleFolderMenuClose = () => {
    setFolderMenuAnchor(null);
  };

  const handleAddFolder = () => {
    navigate('/folder/new');
  };

  const handleEditFolder = () => {
    if (selectedFolder) {
      navigate(`/folder/edit/${selectedFolder.id}`);
    }
    handleFolderMenuClose();
  };

  const handleDeleteFolder = async () => {
    if (selectedFolder) {
      try {
        console.log('Attempting to delete folder in NotesPage:', selectedFolder.id);
        await deleteFolder(selectedFolder.id);
        console.log('Folder deleted successfully in NotesPage. Refreshing data.');
        // Refresh folders and notes
        const foldersResponse = await getFolders();
        setFolders(foldersResponse.data);
        fetchNotes();
      } catch (err) {
        console.error('Error deleting folder in NotesPage:', err);
        setError('Не удалось удалить папку');
      }
    }
    handleFolderMenuClose();
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

  const renderFolderList = () => {
    const renderFolder = (folder, level = 0) => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isOpen = openFolders[folder.id] || false;
      const isSelected = selectedFolder?.id === folder.id;

      return (
        <React.Fragment key={folder.id}>
          <ListItemButton
            onClick={() => handleFolderClick(folder)}
            selected={isSelected}
            sx={{
              pl: level ? 2 + level * 2 : 2,
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
              }
            }}
          >
            <ListItemIcon>
              <FolderIcon color={isSelected ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary={folder.name}
              primaryTypographyProps={{
                color: isSelected ? 'primary' : 'inherit',
                fontWeight: isSelected ? 500 : 400
              }}
            />
            {hasChildren && (
              <IconButton
                size="small"
                onClick={(e) => toggleFolderOpen(folder.id, e)}
                sx={{ mr: 1 }}
              >
                {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={(e) => handleFolderMenuOpen(e, folder)}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </ListItemButton>
          
          {hasChildren && isOpen && (
            <Box sx={{ pl: 2 }}>
              {folder.children.map(childFolder => renderFolder(childFolder, level + 1))}
            </Box>
          )}
        </React.Fragment>
      );
    };

    // Filter root folders (those without parents)
    const rootFolders = folders.filter(folder => !folder.parent);

    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Папки</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={handleAddFolder}
            sx={{ textTransform: 'none' }}
          >
            Новая папка
          </Button>
        </Box>
        <List>
          {rootFolders.map(folder => renderFolder(folder))}
        </List>
      </Box>
    );
  };

  const renderNoteList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Заметки</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={handleCreateNote}
          sx={{ textTransform: 'none' }}
        >
          Новая заметка
        </Button>
      </Box>
      <List>
        {notes.map((note) => (
          <ListItemButton
            key={note.id}
            onClick={() => handleEditNote(note.id)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <ListItemIcon>
              <Description color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={note.title || 'Untitled Note'}
              secondary={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" component="span">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </Typography>
                  {note.folder && (
                    <>
                      <Typography variant="body2" color="text.secondary" component="span">•</Typography>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        <FolderIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                        <Typography variant="body2" color="text.secondary">
                          {note.folder.name}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              }
            />
            <IconButton
              size="small"
              onClick={(e) => handleNoteMenuOpen(e, note)}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
      </List>
    </Box>
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
            label={`Всё · ${notes.length}`}
          />

          <Tab 
            icon={<FolderIcon fontSize="small" />}
            iconPosition="start"
            label="Папки"
          />

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
            Сортировка
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={handleCreateNote}
            sx={{ textTransform: 'none' }}
          >
            Новая заметка
          </Button>
        </Box>
      </Box>
      
      <Paper 
        component="form" 
        onSubmit={handleSearch}
        sx={{ p: 1.5, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}
      >
        <TextField
          placeholder="Поиск заметок..."
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
                return <Typography color="text.secondary">Фильтрация по тегу</Typography>;
              }
              const tagName = availableTags.find(t => t.id.toString() === selected)?.name || selected;
              return <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Label fontSize="small" sx={{ mr: 0.5 }} />
                {tagName}
              </Box>;
            }}
          >
            <MenuItem value="">
              <em>Без фильтра</em>
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
          Поиск
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
        <Typography>Загрузка заметок...</Typography>
      ) : (
        <>
          {renderFolderList()}
          <Divider sx={{ my: 3 }} />
          {renderNoteList()}
        </>
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
          <ListItemText primary="Редактировать" />
        </MenuItem>
        <MenuItem onClick={handleMoveNote}>
          <ListItemIcon>
            <DriveFileMove fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Переместить в папку" />
        </MenuItem>
        <MenuItem onClick={handleDeleteNote}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Удалить" />
        </MenuItem>
      </Menu>
      
      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
      >
        <MenuItem onClick={() => handleSort('title')}>
          <ListItemText primary="Название" />
          {sortBy === 'title' && (
            <Typography variant="caption" color="primary">
              {sortDirection === 'asc' ? '(A-Z)' : '(Z-A)'}
            </Typography>
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('updated_at')}>
          <ListItemText primary="Недавно измененное" />
          {sortBy === 'updated_at' && (
            <Typography variant="caption" color="primary">
              {sortDirection === 'asc' ? '(Старейшее)' : '(Новейшее)'}
            </Typography>
          )}
        </MenuItem>
        <MenuItem onClick={() => handleSort('created_at')}>
          <ListItemText primary="По добавленнюю" />
          {sortBy === 'created_at' && (
            <Typography variant="caption" color="primary">
              {sortDirection === 'asc' ? '(Старейшее)' : '(Новейшее)'}
            </Typography>
          )}
        </MenuItem>
      </Menu>
      
      {/* Folder Menu */}
      <Menu
        anchorEl={folderMenuAnchor}
        open={Boolean(folderMenuAnchor)}
        onClose={handleFolderMenuClose}
      >
        <MenuItem onClick={handleEditFolder}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Редактировать" />
        </MenuItem>
        <MenuItem onClick={handleDeleteFolder}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Удалить" />
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