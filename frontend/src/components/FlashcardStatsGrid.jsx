import React, { useEffect, useState } from 'react';
import { getDailyFlashcardStats } from '../api/notesApi';

const tileStyle = (count) => ({
  width: 18,
  height: 18,
  margin: 2,
  background: count > 0 ? '#4caf50' : '#e0e0e0',
  display: 'inline-block',
  borderRadius: 3,
  position: 'relative',
  cursor: count > 0 ? 'pointer' : 'default',
});

const FlashcardStatsGrid = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    getDailyFlashcardStats().then(res => setStats(res.data));
  }, []);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: 400 }}>
      {stats.map(day => (
        <div
          key={day.date}
          style={tileStyle(day.solved_count)}
          title={`${day.solved_count} решений ${new Date(day.date).toLocaleDateString('ru-RU')}`}
        />
      ))}
    </div>
  );
};

export default FlashcardStatsGrid; 