import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem,
  ListItemIcon, ListItemText, Toolbar, Typography, Divider, Button,
  Menu, MenuItem, Tooltip, useTheme, Collapse, Badge,
  ListItemButton, TextField, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar
} from '@mui/material';
import {
  Menu as MenuIcon, NoteAdd, Folder as FolderIcon,
  ExpandMore, ExpandLess, Label, FolderOpen,
  Add, Description, Search, ChevronLeft, Upload as UploadIcon,
  Today, Extension, School, FormatListBulleted,
  MoreVert, DeleteOutline, Edit as EditIcon, AddCircleOutline,
  AccountCircle, ExitToApp
} from '@mui/icons-material';
import { getFolderStructure, getSidebar, deleteFolder, logoutUser } from '../api/notesApi';

const drawerWidth = 260;

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [folderMenuAnchor, setFolderMenuAnchor] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [openFolders, setOpenFolders] = useState({});
  const [loading, setLoading] = useState(true);
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSidebarData();
  }, [location.pathname]);

  const fetchSidebarData = async () => {
    try {
      // Get folder structure for sidebar
      const structureResponse = await getFolderStructure();
      setFolders(structureResponse.data);
      
      // Get sidebar data (recent notes, etc)
      const sidebarResponse = await getSidebar();
      setRecentNotes(sidebarResponse.data.recent_notes);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleFolderMenuOpen = (event, folder) => {
    event.preventDefault();
    event.stopPropagation();
    setFolderMenuAnchor(event.currentTarget);
    setSelectedFolder(folder);
  };

  const handleFolderMenuClose = () => {
    setFolderMenuAnchor(null);
  };

  const handleCreateMenuOpen = (event) => {
    setCreateMenuAnchor(event.currentTarget);
  };

  const handleCreateMenuClose = () => {
    setCreateMenuAnchor(null);
  };

  const handleLogout = () => {
    try {
      logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
    handleProfileMenuClose();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/notes?search=${encodeURIComponent(searchQuery)}`);
      if (mobileOpen) {
        setMobileOpen(false);
      }
    }
  };

  const handleFolderClick = (folder) => {
    navigate(`/folder/${folder.id}`);
    if (mobileOpen) {
      setMobileOpen(false);
    }
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

  const handleAddFolder = () => {
    handleCreateMenuClose();
    navigate('/folder/new');
  };

  const handleAddSubfolder = () => {
    handleFolderMenuClose();
    navigate(`/folder/new?parent=${selectedFolder.id}`);
  };

  const handleEditFolder = () => {
    handleFolderMenuClose();
    navigate(`/folder/edit/${selectedFolder.id}`);
  };

  const handleDeleteFolder = async () => {
    try {
      await deleteFolder(confirmDeleteFolder.id);
      setConfirmDeleteFolder(null);
      fetchSidebarData();
    } catch (err) {
      console.error('Error deleting folder:', err);
      // Show error message
    }
  };

  const handleFolderDelete = () => {
    handleFolderMenuClose();
    setConfirmDeleteFolder(selectedFolder);
  };

  const handleCreateNote = () => {
    handleCreateMenuClose();
    navigate('/note/new');
  };

  const renderFolderTree = (folderList, level = 0) => {
    return folderList.map(folder => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isOpen = openFolders[folder.id] || false;
      
      return (
        <React.Fragment key={folder.id}>
          <ListItemButton
            onClick={() => handleFolderClick(folder)}
            sx={{
              pl: level ? 2 + level * 1.5 : 2,
              py: 0.5,
              borderLeft: location.pathname === `/folder/${folder.id}` ? 
                `3px solid ${theme.palette.primary.main}` : 'none',
              bgcolor: location.pathname === `/folder/${folder.id}` ? 
                'rgba(99, 102, 241, 0.08)' : 'transparent',
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {hasChildren ? (
                isOpen ? <FolderOpen fontSize="small" /> : <FolderIcon fontSize="small" />
              ) : (
                <FolderIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={folder.name}
              primaryTypographyProps={{ 
                noWrap: true,
                fontSize: '0.9rem'
              }}
            />
            {hasChildren && (
              <IconButton
                size="small"
                onClick={(e) => toggleFolderOpen(folder.id, e)}
                sx={{ mr: -1 }}
              >
                {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={(e) => handleFolderMenuOpen(e, folder)}
              sx={{ mr: -1 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </ListItemButton>
          
          {hasChildren && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              {renderFolderTree(folder.children, level + 1)}
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  const drawer = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflowX: 'hidden'
      }}
    >
      <Toolbar 
        sx={{ 
          px: 1, 
          minHeight: '64px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Notes App
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ display: { sm: 'none' } }}>
          <ChevronLeft />
        </IconButton>
      </Toolbar>
      
      <Box 
        component="form" 
        onSubmit={handleSearch}
        sx={{ px: 2, mb: 2 }}
      >
        <TextField
          fullWidth
          placeholder="Search..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '0.9rem',
            }
          }}
        />
      </Box>
      
      <List component="nav" dense sx={{ px: 1 }}>
        <ListItemButton 
          component={RouterLink} 
          to="/notes"
          sx={{
            borderLeft: location.pathname === '/notes' ? 
              `3px solid ${theme.palette.primary.main}` : 'none',
            bgcolor: location.pathname === '/notes' ? 
              'rgba(99, 102, 241, 0.08)' : 'transparent',
          }}
        >
          <ListItemIcon>
            <FormatListBulleted fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="All Notes" />
        </ListItemButton>
        
        <ListItemButton 
          component={RouterLink} 
          to="/tags"
          sx={{
            borderLeft: location.pathname === '/tags' ? 
              `3px solid ${theme.palette.primary.main}` : 'none',
            bgcolor: location.pathname === '/tags' ? 
              'rgba(99, 102, 241, 0.08)' : 'transparent',
          }}
        >
          <ListItemIcon>
            <Label fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Tags" />
        </ListItemButton>
        
        <ListItemButton onClick={() => navigate('/notes')}>
          <ListItemIcon>
            <Today fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Today's Note" />
        </ListItemButton>
        
        <ListItemButton sx={{ mt: 1 }}>
          <ListItemIcon>
            <Extension fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Flashcards" />
          <Badge badgeContent="1" color="primary" sx={{ mr: 1 }} />
        </ListItemButton>
      </List>
      
      <Divider sx={{ my: 1 }} />
      
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Folders
        </Typography>
        <IconButton 
          size="small"
          onClick={handleAddFolder}
          title="Create new folder"
        >
          <Add fontSize="small" />
        </IconButton>
      </Box>
      
      <List dense sx={{ px: 1, flex: '1 1 auto', overflowY: 'auto' }}>
        {folders.length > 0 ? (
          renderFolderTree(folders)
        ) : (
          <ListItem>
            <ListItemText 
              primary="No folders" 
              primaryTypographyProps={{ 
                color: 'text.secondary',
                fontSize: '0.9rem' 
              }} 
            />
          </ListItem>
        )}
      </List>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ p: 1 }}>
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          sx={{ px: 1, mb: 1 }}
        >
          Recent Notes
        </Typography>
        <List dense>
          {recentNotes && recentNotes.length > 0 ? (
            recentNotes.map(note => (
              <ListItemButton 
                key={note.id}
                component={RouterLink}
                to={`/note/${note.id}`}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Description fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={note.title} 
                  primaryTypographyProps={{ 
                    noWrap: true,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            ))
          ) : (
            <ListItem>
              <ListItemText 
                primary="No recent notes" 
                primaryTypographyProps={{ 
                  color: 'text.secondary',
                  fontSize: '0.9rem' 
                }}
              />
            </ListItem>
          )}
        </List>
      </Box>
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          variant="outlined" 
          color="primary"
          startIcon={<School />}
          fullWidth
          size="small"
        >
          AI Learning Tools
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div">
            {location.pathname.includes('/folder/') 
              ? 'Folder' 
              : location.pathname.includes('/note/') 
                ? (location.pathname.includes('/note/new') ? 'New Note' : 'Edit Note')
                : location.pathname.includes('/tags')
                  ? 'Tags'
                  : 'All Notes'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<UploadIcon />}
              sx={{ mr: 1, display: { xs: 'none', md: 'flex' } }}
            >
              Upload
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleCreateMenuOpen}
              sx={{ textTransform: 'none' }}
            >
              Create
            </Button>
            
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
              aria-controls="profile-menu"
              aria-haspopup="true"
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              id="profile-menu"
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem component={RouterLink} to="/profile">
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToApp fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* Adds spacing below the AppBar */}
        {children}
      </Box>
      
      {/* Create Menu */}
      <Menu
        anchorEl={createMenuAnchor}
        open={Boolean(createMenuAnchor)}
        onClose={handleCreateMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={handleAddFolder}>
          <ListItemIcon>
            <FolderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Folder" 
            secondary="Organize documents into folders."
          />
        </MenuItem>
        <MenuItem onClick={handleCreateNote}>
          <ListItemIcon>
            <Description fontSize="small" color="secondary" />
          </ListItemIcon>
          <ListItemText 
            primary="Document" 
            secondary="Organize flashcards and notes into documents."
          />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <UploadIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Upload & Annotate File" 
            secondary="Highlight & reference PDFs, docs, etc."
          />
        </MenuItem>
      </Menu>
      
      {/* Folder Context Menu */}
      <Menu
        anchorEl={folderMenuAnchor}
        open={Boolean(folderMenuAnchor)}
        onClose={handleFolderMenuClose}
      >
        <MenuItem onClick={handleAddSubfolder}>
          <ListItemIcon>
            <AddCircleOutline fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Add Nested Document" />
        </MenuItem>
        <MenuItem onClick={handleEditFolder}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Rename" />
        </MenuItem>
        <MenuItem onClick={handleFolderDelete}>
          <ListItemIcon>
            <DeleteOutline fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
      
      {/* Confirm Delete Folder Dialog */}
      <Dialog
        open={Boolean(confirmDeleteFolder)}
        onClose={() => setConfirmDeleteFolder(null)}
      >
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the folder "{confirmDeleteFolder?.name}"?
            {confirmDeleteFolder?.children?.length > 0 || confirmDeleteFolder?.notes?.length > 0 ? (
              <strong> This folder contains items and cannot be deleted.</strong>
            ) : (
              ""
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteFolder(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={handleDeleteFolder}
            disabled={
              confirmDeleteFolder?.children?.length > 0 || 
              confirmDeleteFolder?.notes?.length > 0
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppLayout; 