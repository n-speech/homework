const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON);

const Auth = {
  session: null,

  async init() {
    const { data } = await supabaseClient.auth.getSession();
    this.session = data.session;
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      this.session = session;
    });
    return this.session;
  },

  async register(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.session = data.session;
    return data;
  },

  async logout() {
    await supabaseClient.auth.signOut();
    this.session = null;
    window.location.href = 'login.html';
  },

  getToken() {
    return this.session?.access_token || null;
  },

  getEmail() {
    return this.session?.user?.email || '';
  }
};
