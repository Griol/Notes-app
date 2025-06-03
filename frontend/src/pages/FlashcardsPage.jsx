import React, { useState, useEffect } from 'react';
import { getFlashcards, createFlashcard, deleteFlashcard } from '../api/notesApi';
import FlashcardEditor from '../components/FlashcardEditor';
import FlashcardStudy from '../components/FlashcardStudy';
import FlashcardStatsGrid from '../components/FlashcardStatsGrid';
import {
  Container, Card, CardContent, CardActions, Typography, Button, Grid, Box, Stack, Chip
} from '@mui/material';

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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Флеш-карты</Typography>
      <Button variant="contained" color="primary" onClick={() => setShowEditor(true)} sx={{ mb: 2 }}>
        Создать новую флеш-карту
      </Button>
      {showEditor && (
        <FlashcardEditor onSave={handleCreate} onCancel={() => setShowEditor(false)} />
      )}
      {!studyMode && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {flashcards.map(card => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
                    {card.question}
                  </Typography>
                  {card.tags && card.tags.length > 0 && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      {card.tags.map(tag => (
                        <Chip key={tag.id} label={tag.name} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleStudy(card)} variant="contained">Учить</Button>
                  <Button size="small" onClick={() => handleDelete(card.id)} color="error">Удалить</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {studyMode && selectedCard && (
        <FlashcardStudy card={selectedCard} onEnd={handleStudyEnd} />
      )}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" gutterBottom>Статистика</Typography>
        <FlashcardStatsGrid />
      </Box>
    </Container>
  );
};

export default FlashcardsPage; 