import React, { useEffect, useState } from 'react';
import { getDailyFlashcardStats } from '../api/notesApi';
import { Box, Tooltip, Typography } from '@mui/material';

// Получить массив дат за последний год (от сегодня)
function getYearDays() {
  const days = [];
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(today.getFullYear() - 1);
  start.setDate(start.getDate() + 1); // чтобы было ровно 365 дней
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const months = ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];

const tileStyle = (active) => ({
  width: 13,
  height: 13,
  margin: 0.25,
  background: active ? '#4caf50' : '#e0e0e0',
  display: 'inline-block',
  borderRadius: 1,
  transition: 'background 0.2s',
});

const FlashcardStatsGridYear = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    getDailyFlashcardStats().then(res => {
      // Преобразуем в объект: { 'YYYY-MM-DD': count }
      const map = {};
      res.data.forEach(day => {
        map[day.date] = day.solved_count;
      });
      setStats(map);
    });
  }, []);

  const days = getYearDays();

  // Группируем по неделям (каждая неделя — массив из 7 дней)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Для подписей месяцев (берём первый день месяца)
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const firstDay = week[0];
    if (firstDay && firstDay.getMonth() !== lastMonth) {
      monthLabels.push({
        week: i,
        label: months[firstDay.getMonth()]
      });
      lastMonth = firstDay.getMonth();
    }
  });

  return (
    <Box sx={{ overflowX: 'auto', pb: 2 }}>
      {/* Месяцы */}
      <Box sx={{ display: 'flex', pl: 1.5, mb: 0.5 }}>
        {monthLabels.map(m => (
          <Typography key={m.week} variant="caption" sx={{ minWidth: 7 * 10, textAlign: 'left' }}>{m.label}</Typography>
        ))}
      </Box>
      <Box sx={{ display: 'flex' }}>
        {/* Плитки */}
        <Box sx={{ display: 'flex' }}>
          {weeks.map((week, wi) => (
            <Box key={wi} sx={{ display: 'flex', flexDirection: 'column' }}>
              {week.map((day, di) => {
                const dateStr = day.toISOString().slice(0, 10);
                const count = stats[dateStr] || 0;
                return (
                  <Tooltip
                    key={dateStr}
                    title={`${count} решений ${day.toLocaleDateString('ru-RU')}`}
                    arrow
                  >
                    <Box sx={tileStyle(count > 0)} />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default FlashcardStatsGridYear; 