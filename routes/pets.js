const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('./auth');

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { data: pets, error } = await supabase
      .from('pets')
      .select('*, vaccines(*)')
      .eq('user_id', req.userId)
      .order('created_at');
    if (error) throw error;
    res.json(pets);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, type, breed, birth_date, sex, notes } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name и type обязательны' });
    const { data, error } = await supabase
      .from('pets')
      .insert({ user_id: req.userId, name, type, breed, birth_date, sex, notes })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ ...data, vaccines: [] });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, type, breed, birth_date, sex, notes } = req.body;
    const { data, error } = await supabase
      .from('pets')
      .update({ name, type, breed, birth_date, sex, notes })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Питомец не найден' });
    res.json(data);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
