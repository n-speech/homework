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

  // ── Фото питомца ─────────────────────────────────────────

  async uploadPhoto(petId, file) {
    const ext  = file.name.split('.').pop();
    const path = `${Auth.getUser().id}/${petId}.${ext}`;

    // Удаляем старое фото если есть
    await sb.storage.from('pet-photos').remove([path]);

    const { error } = await sb.storage
      .from('pet-photos')
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);

    const { data } = sb.storage.from('pet-photos').getPublicUrl(path);
    const photoUrl = data.publicUrl + '?t=' + Date.now();

    // Сохраняем URL в таблицу pets
    await this.updatePet(petId, { photo_url: photoUrl });
    return photoUrl;
  },

  async deletePhoto(petId, photoUrl) {
    if (!photoUrl) return;
    const path = photoUrl.split('/pet-photos/')[1]?.split('?')[0];
    if (path) await sb.storage.from('pet-photos').remove([path]);
    await this.updatePet(petId, { photo_url: null });
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
