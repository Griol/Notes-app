import React, { useEffect, useState } from 'react';
import { getDailyFlashcardStats } from '../api/notesApi';
import { Box, Tooltip } from '@mui/material';

const tileStyle = (count) => ({
  width: 18,
  height: 18,
  margin: 2,
  background: count > 0 ? '#4caf50' : '#e0e0e0',
  display: 'inline-block',
  borderRadius: 3,
  position: 'relative',
  cursor: count > 0 ? 'pointer' : 'default',
  transition: 'background 0.2s',
});

const FlashcardStatsGrid = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    getDailyFlashcardStats().then(res => setStats(res.data));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', maxWidth: 400 }}>
      {stats.map(day => (
        <Tooltip
          key={day.date}
          title={`${day.solved_count} решений ${new Date(day.date).toLocaleDateString('ru-RU')}`}
          arrow
        >
          <Box sx={tileStyle(day.solved_count)} />
        </Tooltip>
      ))}
    </Box>
  );
};

export default FlashcardStatsGrid; 