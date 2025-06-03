import React, { useState, useEffect } from 'react';
import { getTags, getFolders } from '../api/notesApi';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Box, Chip, Stack
} from '@mui/material';

const FlashcardEditor = ({ onSave, onCancel }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState('');

  useEffect(() => {
    getTags().then(res => setTags(res.data));
    getFolders().then(res => setFolders(res.data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      question,
      answer,
      tag_ids: selectedTags,
      folder: folder || null
    });
    setQuestion('');
    setAnswer('');
    setSelectedTags([]);
    setFolder('');
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Создать флеш-карту</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Вопрос"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Ответ"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="tags-label">Теги</InputLabel>
              <Select
                labelId="tags-label"
                multiple
                value={selectedTags}
                onChange={e => setSelectedTags(e.target.value)}
                input={<OutlinedInput label="Теги" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((tagId) => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? <Chip key={tag.id} label={tag.name} size="small" /> : null;
                    })}
                  </Box>
                )}
              >
                {tags.map(tag => (
                  <MenuItem key={tag.id} value={tag.id}>{tag.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="folder-label">Папка</InputLabel>
              <Select
                labelId="folder-label"
                value={folder}
                onChange={e => setFolder(e.target.value)}
                input={<OutlinedInput label="Папка" />}
              >
                <MenuItem value=''>Без папки</MenuItem>
                {folders.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="submit" variant="contained">Сохранить</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FlashcardEditor; 