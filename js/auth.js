const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);


const Auth = {
  user: null,

  async init() {
    const { data } = await sb.auth.getSession();
    this.user = data.session?.user || null;
    sb.auth.onAuthStateChange((_e, session) => {
      this.user = session?.user || null;
    });
    return this.user;
  },

  async login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    return data;
  },

  async register(email, password) {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    await sb.auth.signOut();
    this.user = null;
    window.location.href = 'login.html';
  },

  getUser() { return this.user; }
};
