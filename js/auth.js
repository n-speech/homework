// Supabase клиент (подключается через CDN в HTML)
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON);

const Auth = {
  // Текущая сессия
  session: null,

  // Инициализация: восстановить сессию при загрузке
  async init() {
    const { data } = await supabase.auth.getSession();
    this.session = data.session;
    supabase.auth.onAuthStateChange((_event, session) => {
      this.session = session;
    });
    return this.session;
  },

  // Регистрация по email + пароль
  async register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  // Вход
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.session = data.session;
    return data;
  },

  // Выход
  async logout() {
    await supabase.auth.signOut();
    this.session = null;
    window.location.href = 'login.html';
  },

  // Получить JWT токен для запросов к бэкенду
  getToken() {
    return this.session?.access_token || null;
  },

  // Получить email текущего пользователя
  getEmail() {
    return this.session?.user?.email || '';
  }
};
