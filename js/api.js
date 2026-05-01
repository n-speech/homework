// Все запросы идут напрямую в Supabase — никакого бэкенда не нужно

const API = {

  // ── Питомцы ──────────────────────────────────────────────

  async getPets() {
    const { data, error } = await sb
      .from('pets')
      .select('*, vaccines(*)')
      .order('created_at');
    if (error) throw new Error(error.message);
    return data;
  },

  async createPet(pet) {
    const { data, error } = await sb
      .from('pets')
      .insert({ ...pet, user_id: Auth.getUser().id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...data, vaccines: [] };
  },

  async updatePet(id, pet) {
    const { data, error } = await sb
      .from('pets')
      .update(pet)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deletePet(id) {
    const { error } = await sb.from('pets').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // ── Прививки ─────────────────────────────────────────────

  async createVaccine(v) {
    const { data, error } = await sb
      .from('vaccines')
      .insert(v)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateVaccine(id, v) {
    const { data, error } = await sb
      .from('vaccines')
      .update(v)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteVaccine(id) {
    const { error } = await sb.from('vaccines').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  }
};
