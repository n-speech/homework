const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('./auth');

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const { pet_id, name, date_done, date_next, status, notes } = req.body;
    if (!pet_id || !name) return res.status(400).json({ error: 'pet_id и name обязательны' });
    const { data, error } = await supabase
      .from('vaccines')
      .insert({ pet_id, name, date_done, date_next, status: status || 'done', notes })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, date_done, date_next, status, notes } = req.body;
    const { data, error } = await supabase
      .from('vaccines')
      .update({ name, date_done, date_next, status, notes })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Прививка не найдена' });
    res.json(data);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('vaccines')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
