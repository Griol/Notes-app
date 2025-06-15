import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Box, Chip, Autocomplete, Paper, Typography, 
  FormControl, InputLabel, Select, MenuItem, FormHelperText, IconButton
} from '@mui/material';
import { getNote, createNote, updateNote, getTags, getFolders } from '../api/notesApi';
import { Folder as FolderIcon, LocalOffer as TagIcon } from '@mui/icons-material';
import Popover from '@mui/material/Popover';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import './tiptap.css';
import { SketchPicker } from 'react-color';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

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
  const [colorAnchor, setColorAnchor] = useState(null);
  const [tableAnchor, setTableAnchor] = useState(null);
  const [shouldShowTableMenu, setShouldShowTableMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: '0px', left: '0px' });
  const [isMenuReady, setIsMenuReady] = useState(false);

  const theme = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        listItem: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
        content: 'paragraph',
      }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      console.log("Editor content on update:", editor.getHTML());
      setNote(prev => ({ ...prev, content: editor.getHTML() }));
    },
  });

  const floatingMenuRef = useRef(null);
  const toolbarRef = useRef(null);

  useLayoutEffect(() => {
    if (!editor) return;

    let timeoutId;

    const handleEditorUpdate = () => {
      const isActiveInTable = editor.isActive('table');
      setShouldShowTableMenu(isActiveInTable);

      if (isActiveInTable && floatingMenuRef.current && toolbarRef.current) {
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const floatingMenuRect = floatingMenuRef.current.getBoundingClientRect();

        // Only calculate and show menu if dimensions are valid
        if (floatingMenuRect.height > 0 && toolbarRect.width > 0) {
          const offsetAboveToolbar = 10; 
          const topPos = `-${floatingMenuRect.height + offsetAboveToolbar}px`;
          const leftPos = `${(toolbarRect.width / 2) - (floatingMenuRect.width / 2)}px`;

          setMenuPosition({ top: topPos, left: leftPos });

          // Delay setting isMenuReady to true to allow browser to render and stabilize dimensions
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setIsMenuReady(true);
          }, 50);
        } else {
          setIsMenuReady(false);
        }
      } else if (!isActiveInTable) {
        setMenuPosition({ top: '0px', left: '0px' }); 
        setIsMenuReady(false);
      }
    };

    editor.on('update', handleEditorUpdate);
    editor.on('selectionUpdate', handleEditorUpdate);

    // Initial check when editor is ready
    handleEditorUpdate();

    return () => {
      editor.off('update', handleEditorUpdate);
      editor.off('selectionUpdate', handleEditorUpdate);
      clearTimeout(timeoutId); // Cleanup timeout on unmount
    };
  }, [editor]);

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
          editor.commands.setContent(response.data.content);
          setLoading(false);
        } catch (err) {
          setError('Failed to load note');
          setLoading(false);
        }
      };
      
      loadNote();
    }
  }, [id, editor]);

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

  const handleColorClick = (event) => {
    setColorAnchor(event.currentTarget);
  };
  const handleColorClose = () => {
    setColorAnchor(null);
  };
  const handleTableClick = (event) => {
    setTableAnchor(event.currentTarget);
  };
  const handleTableClose = () => {
    setTableAnchor(null);
  };

  const handleColorChange = (color) => {
    editor.chain().focus().setColor(color.hex).run();
    handleColorClose();
  };

  const handleTableSizeSelect = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    handleTableClose();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 0, background: 'transparent', position: 'relative', pb: 8 }}>
      <form onSubmit={handleSubmit} autoComplete="off">
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
        <Box
          sx={{
            minHeight: 200,
            background: 'transparent',
            color: '#fff',
            border: 'none',
            fontSize: 18,
            fontWeight: 400,
            mt: 2,
            px: 0,
            py: 1,
            borderRadius: 2,
            '& .ProseMirror': {
              outline: 'none',
              background: 'transparent',
              color: '#fff',
              minHeight: 200,
              fontSize: 18,
              fontWeight: 400,
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
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
      </form>
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
      <Box ref={toolbarRef} sx={{
        position: 'relative',
        left: 0,
        bottom: 0,
        width: '100%',
        background: 'rgba(30,30,46,0.98)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        py: 1,
        borderTop: '1px solid #333',
      }}>
        <Tooltip title="Bold" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}><FormatBoldIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Italic" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}><FormatItalicIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Underline" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'}><FormatUnderlinedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Text color" arrow><span><IconButton size="small" onClick={handleColorClick}><FormatColorTextIcon fontSize="small" sx={{ color: editor.getAttributes('textStyle').color || '#fff' }} /></IconButton></span></Tooltip>
        <Popover
          open={Boolean(colorAnchor)}
          anchorEl={colorAnchor}
          onClose={handleColorClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <SketchPicker
            color={editor.getAttributes('textStyle').color || '#fff'}
            onChangeComplete={handleColorChange}
            disableAlpha
            presetColors={['#fff', '#000', '#f87171', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6']}
          />
        </Popover>
        <Tooltip title="Bullet list" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}><FormatListBulletedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Task list" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().toggleTaskList().run()} color={editor.isActive('taskList') ? 'primary' : 'default'}><CheckBoxIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Ordered list" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}><FormatListNumberedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Align left" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('left').run()} color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}><FormatAlignLeftIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Align center" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('center').run()} color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}><FormatAlignCenterIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Align right" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('right').run()} color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}><FormatAlignRightIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Undo" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().undo().run()}><UndoIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Redo" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().redo().run()}><RedoIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Insert table" arrow><span><IconButton size="small" onClick={handleTableClick}><TableChartIcon fontSize="small" /></IconButton></span></Tooltip>
        <Popover
          open={Boolean(tableAnchor)}
          anchorEl={tableAnchor}
          onClose={handleTableClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Table size</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 24px)', gap: 0.5 }}>
              {[...Array(6)].map((_, row) =>
                [...Array(6)].map((_, col) => (
                  <Box
                    key={`${row}-${col}`}
                    sx={{
                      width: 22,
                      height: 22,
                      bgcolor: '#232336',
                      border: '1px solid #444',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#6366f1' },
                    }}
                    onClick={() => handleTableSizeSelect(row + 1, col + 1)}
                  />
                ))
              )}
            </Box>
          </Box>
        </Popover>
      </Box>
      {shouldShowTableMenu && (
        <Box
          ref={floatingMenuRef}
          sx={{
            position: 'absolute',
            background: 'rgba(30,30,46,0.98)',
            border: '1px solid #333',
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            gap: 0.5,
            zIndex: 1000,
            boxShadow: 3,
            top: menuPosition.top,
            left: menuPosition.left,
            width: '350px',
            height: '40px',
          }}
        >
          <Tooltip title="Delete table" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().deleteTable().run()}>🗑️</IconButton></span></Tooltip>
          <Tooltip title="Add row before" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().addRowBefore().run()}>⬆️</IconButton></span></Tooltip>
          <Tooltip title="Add row after" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().addRowAfter().run()}>⬇️</IconButton></span></Tooltip>
          <Tooltip title="Delete row" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().deleteRow().run()}>✖️ Row</IconButton></span></Tooltip>
          <Tooltip title="Add column before" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().addColumnBefore().run()}>⬅️</IconButton></span></Tooltip>
          <Tooltip title="Add column after" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().addColumnAfter().run()}>➡️</IconButton></span></Tooltip>
          <Tooltip title="Delete column" arrow><span><IconButton size="small" onClick={() => editor.chain().focus().deleteColumn().run()}>✖️ Col</IconButton></span></Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default NoteEditor;