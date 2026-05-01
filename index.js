require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const petsRouter     = require('./routes/pets');
const vaccinesRouter = require('./routes/vaccines');

const app = express();

app.use(cors({ origin: '*' })); // В продакшне укажите конкретный домен
app.use(express.json());

// Health-check
app.get('/health', (req, res) => res.json({ ok: true }));

// Роуты
app.use('/api/pets',     petsRouter);
app.use('/api/vaccines', vaccinesRouter);

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
