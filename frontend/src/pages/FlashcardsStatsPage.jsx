import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import FlashcardStatsGridYear from '../components/FlashcardStatsGridYear';

const FlashcardsStatsPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Статистика решений за последний год
        </Typography>
        <FlashcardStatsGridYear />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          {/* Здесь можно добавить дополнительные метрики, если нужно */}
        </Box>
      </Paper>
    </Container>
  );
};

export default FlashcardsStatsPage; 