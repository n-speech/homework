const express = require('express');
const { Pool } = require('pg');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const pool   = new Pool({ connectionString: process.env.DATABASE_URL });

// Все роуты требуют авторизации
router.use(requireAuth);

// GET /api/pets — список питомцев пользователя с прививками
router.get('/', async (req, res, next) => {
  try {
    const { rows: pets } = await pool.query(
      `SELECT * FROM pets WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.userId]
    );

    // Для каждого питомца подгружаем прививки
    const petIds = pets.map(p => p.id);
    let vaccines = [];

    if (petIds.length > 0) {
      const { rows } = await pool.query(
        `SELECT * FROM vaccines WHERE pet_id = ANY($1) ORDER BY date_done ASC`,
        [petIds]
      );
      vaccines = rows;
    }

    // Собираем питомцев вместе с их прививками
    const result = pets.map(pet => ({
      ...pet,
      vaccines: vaccines.filter(v => v.pet_id === pet.id)
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/pets — создать питомца
router.post('/', async (req, res, next) => {
  try {
    const { name, type, breed, birth_date, sex, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Поля name и type обязательны' });
    }

    const { rows } = await pool.query(
      `INSERT INTO pets (user_id, name, type, breed, birth_date, sex, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.userId, name, type, breed || null, birth_date || null, sex || null, notes || null]
    );

    res.status(201).json({ ...rows[0], vaccines: [] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/pets/:id — обновить питомца
router.put('/:id', async (req, res, next) => {
  try {
    const { name, type, breed, birth_date, sex, notes } = req.body;
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE pets
       SET name=$1, type=$2, breed=$3, birth_date=$4, sex=$5, notes=$6
       WHERE id=$7 AND user_id=$8
       RETURNING *`,
      [name, type, breed || null, birth_date || null, sex || null, notes || null, id, req.userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Питомец не найден' });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/pets/:id — удалить питомца (прививки удалятся каскадно)
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM pets WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.userId]
    );

    if (!rowCount) return res.status(404).json({ error: 'Питомец не найден' });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
