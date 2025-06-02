import React, { useState } from 'react';
import { createFlashcardStat } from '../api/notesApi';

const ratingOptions = [
  { value: 'know', label: 'Знаю' },
  { value: 'repeat', label: 'Нужно повторить' },
  { value: 'dont_know', label: 'Не знаю' }
];

const FlashcardStudy = ({ card, onEnd }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [rated, setRated] = useState(false);

  const handleShowAnswer = () => setShowAnswer(true);

  const handleRate = async (result) => {
    await createFlashcardStat({ flashcard: card.id, result });
    setRated(true);
    setTimeout(onEnd, 500); // Плавный переход к следующей/выход
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 24, borderRadius: 8, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontWeight: 'bold', fontSize: 20 }}>{card.question}</div>
      <div style={{ margin: '20px 0' }}>
        {showAnswer ? (
          <span style={{ color: '#2a7', fontWeight: 'bold' }}>{card.answer}</span>
        ) : (
          <button onClick={handleShowAnswer}>Показать ответ</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {ratingOptions.map(opt => (
          <button key={opt.value} onClick={() => handleRate(opt.value)} disabled={rated}>
            {opt.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={onEnd}>Закрыть</button>
      </div>
    </div>
  );
};

export default FlashcardStudy; 