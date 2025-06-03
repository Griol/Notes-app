import React, { useState } from 'react';
import { createFlashcardStat } from '../api/notesApi';
import {
  Card, CardContent, CardActions, Typography, Button, Stack, Box
} from '@mui/material';

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
    setTimeout(onEnd, 500);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 350 }}>
      <Card variant="outlined" sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {card.question}
          </Typography>
          <Box sx={{ my: 3, minHeight: 40 }}>
            {showAnswer ? (
              <Typography color="success.main" fontWeight={600}>{card.answer}</Typography>
            ) : (
              <Button variant="outlined" onClick={handleShowAnswer}>Показать ответ</Button>
            )}
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center', gap: 2 }}>
          {ratingOptions.map(opt => (
            <Button
              key={opt.value}
              onClick={() => handleRate(opt.value)}
              disabled={rated}
              variant={opt.value === 'know' ? 'contained' : 'outlined'}
              color={opt.value === 'know' ? 'success' : opt.value === 'repeat' ? 'warning' : 'error'}
            >
              {opt.label}
            </Button>
          ))}
        </CardActions>
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onEnd}>Закрыть</Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default FlashcardStudy; 