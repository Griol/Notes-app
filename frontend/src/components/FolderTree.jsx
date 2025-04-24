import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  List, ListItem, ListItemIcon, ListItemText, 
  Collapse, IconButton, Menu, MenuItem, Typography 
} from '@mui/material';
import { 
  FolderOutlined, FolderOpenOutlined, 
  ExpandMore, ExpandLess, MoreVert, Add, Delete, Edit 
} from '@mui/icons-material';

const FolderTree = ({ folders, onFolderSelect, onAddFolder, onEditFolder, onDeleteFolder }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const handleToggle = (folderId) => {
    setOpen(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleFolderClick = (folder) => {
    if (onFolderSelect) {
      onFolderSelect(folder);
    }
    navigate(`/folder/${folder.id}`);
  };

  const handleContextMenu = (event, folder) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
    setSelectedFolder(folder);
  };

  const handleMenuClose = () => {
    setContextMenu(null);
  };

  const handleAddFolder = () => {
    onAddFolder(selectedFolder);
    handleMenuClose();
  };

  const handleEditFolder = () => {
    onEditFolder(selectedFolder);
    handleMenuClose();
  };

  const handleDeleteFolder = () => {
    onDeleteFolder(selectedFolder);
    handleMenuClose();
  };

  const renderFolderItem = (folder) => {
    const isOpen = open[folder.id] || false;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <React.Fragment key={folder.id}>
        <ListItem 
          sx={{ 
            cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
          }}
          onClick={() => handleFolderClick(folder)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
        >
          {hasChildren ? (
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              handleToggle(folder.id);
            }}>
              {isOpen ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          ) : (
            <IconButton size="small" disabled sx={{ visibility: 'hidden' }}>
              <ExpandMore />
            </IconButton>
          )}
          
          <ListItemIcon sx={{ minWidth: 36 }}>
            {isOpen ? <FolderOpenOutlined /> : <FolderOutlined />}
          </ListItemIcon>
          
          <ListItemText primary={folder.name} />
          
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, folder);
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 4 }}>
              {folder.children.map(childFolder => renderFolderItem(childFolder))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      <Typography variant="h6" sx={{ pb: 1, pt: 2 }}>
        Folders
      </Typography>
      
      <List>
        {folders && folders.length > 0 ? (
          folders.map(folder => renderFolderItem(folder))
        ) : (
          <ListItem>
            <ListItemText primary="No folders found" />
          </ListItem>
        )}
      </List>
      
      <Menu
        open={contextMenu !== null}
        onClose={handleMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleAddFolder}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>New Subfolder</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditFolder}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteFolder}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default FolderTree; 