import React, { useState, useEffect } from 'react';
import { getTags, getFolders } from '../api/notesApi';

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
    <form onSubmit={handleSubmit} style={{ margin: '20px 0' }}>
      <div>
        <label>Вопрос:</label>
        <input value={question} onChange={e => setQuestion(e.target.value)} required />
      </div>
      <div>
        <label>Ответ:</label>
        <input value={answer} onChange={e => setAnswer(e.target.value)} required />
      </div>
      <div>
        <label>Теги:</label>
        <select multiple value={selectedTags} onChange={e => setSelectedTags(Array.from(e.target.selectedOptions, o => o.value))}>
          {tags.map(tag => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Папка:</label>
        <select value={folder} onChange={e => setFolder(e.target.value)}>
          <option value=''>Без папки</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <button type="submit">Сохранить</button>
      <button type="button" onClick={onCancel}>Отмена</button>
    </form>
  );
};

export default FlashcardEditor; 