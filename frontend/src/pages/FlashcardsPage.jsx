import React, { useState, useEffect } from 'react';
import { getFlashcards, createFlashcard, deleteFlashcard } from '../api/notesApi';
import FlashcardEditor from '../components/FlashcardEditor';
import FlashcardStudy from '../components/FlashcardStudy';
import FlashcardStatsGrid from '../components/FlashcardStatsGrid';

const FlashcardsPage = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    const res = await getFlashcards();
    setFlashcards(res.data);
  };

  const handleCreate = async (data) => {
    await createFlashcard(data);
    setShowEditor(false);
    fetchFlashcards();
  };

  const handleDelete = async (id) => {
    await deleteFlashcard(id);
    fetchFlashcards();
  };

  const handleStudy = (card) => {
    setSelectedCard(card);
    setStudyMode(true);
  };

  const handleStudyEnd = () => {
    setStudyMode(false);
    setSelectedCard(null);
    fetchFlashcards();
  };

  return (
    <div>
      <h2>Флеш-карты</h2>
      <button onClick={() => setShowEditor(true)}>Создать новую флеш-карту</button>
      {showEditor && (
        <FlashcardEditor onSave={handleCreate} onCancel={() => setShowEditor(false)} />
      )}
      {!studyMode && (
        <div style={{ marginTop: 20 }}>
          <ul>
            {flashcards.map(card => (
              <li key={card.id}>
                <b>{card.question}</b>
                <button onClick={() => handleStudy(card)}>Учить</button>
                <button onClick={() => handleDelete(card.id)}>Удалить</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {studyMode && selectedCard && (
        <FlashcardStudy card={selectedCard} onEnd={handleStudyEnd} />
      )}
      <div style={{ marginTop: 40 }}>
        <h3>Статистика</h3>
        <FlashcardStatsGrid />
      </div>
    </div>
  );
};

export default FlashcardsPage; 