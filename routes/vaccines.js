const express = require('express');
const { Pool } = require('pg');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const pool   = new Pool({ connectionString: process.env.DATABASE_URL });

router.use(requireAuth);

// Хелпер: проверяем что питомец принадлежит пользователю
async function petBelongsToUser(petId, userId) {
  const { rows } = await pool.query(
    `SELECT id FROM pets WHERE id=$1 AND user_id=$2`,
    [petId, userId]
  );
  return rows.length > 0;
}

// POST /api/vaccines — добавить прививку
router.post('/', async (req, res, next) => {
  try {
    const { pet_id, name, date_done, date_next, status, notes } = req.body;

    if (!pet_id || !name) {
      return res.status(400).json({ error: 'Поля pet_id и name обязательны' });
    }

    if (!(await petBelongsToUser(pet_id, req.userId))) {
      return res.status(403).json({ error: 'Нет доступа к этому питомцу' });
    }

    const { rows } = await pool.query(
      `INSERT INTO vaccines (pet_id, name, date_done, date_next, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [pet_id, name, date_done || null, date_next || null, status || 'done', notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/vaccines/:id — обновить прививку
router.put('/:id', async (req, res, next) => {
  try {
    const { name, date_done, date_next, status, notes } = req.body;

    // Проверяем права через JOIN с pets
    const { rows } = await pool.query(
      `UPDATE vaccines v
       SET name=$1, date_done=$2, date_next=$3, status=$4, notes=$5
       FROM pets p
       WHERE v.id=$6 AND v.pet_id=p.id AND p.user_id=$7
       RETURNING v.*`,
      [name, date_done || null, date_next || null, status || 'done', notes || null, req.params.id, req.userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Прививка не найдена' });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/vaccines/:id — удалить прививку
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM vaccines v
       USING pets p
       WHERE v.id=$1 AND v.pet_id=p.id AND p.user_id=$2`,
      [req.params.id, req.userId]
    );

    if (!rowCount) return res.status(404).json({ error: 'Прививка не найдена' });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
