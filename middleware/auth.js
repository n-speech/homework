const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Отсутствует токен авторизации' });
  }

  const token = authHeader.split(' ')[1];

  console.log('Token received:', token.substring(0, 50) + '...');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SERVICE_KEY starts with:', process.env.SUPABASE_SERVICE_KEY?.substring(0, 20));

  try {
    const { data, error } = await supabase.auth.getUser(token);
    console.log('Supabase response:', JSON.stringify({ data, error }));
    
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Неверный или истёкший токен' });
    }
    req.userId = data.user.id;
    next();
  } catch (err) {
    console.log('Exception:', err.message);
    return res.status(401).json({ error: 'Ошибка авторизации' });
  }
}

module.exports = { requireAuth };
