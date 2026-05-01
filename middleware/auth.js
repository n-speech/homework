const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Отсутствует токен авторизации' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.log('Auth error:', error?.message);
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
