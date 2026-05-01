// Обёртка для запросов к Node.js API
const API = {

  // Базовый запрос с авторизационным заголовком
  async request(method, path, body) {
    const token = Auth.getToken();
    if (!token) throw new Error('Нет токена. Войдите снова.');

    const res = await fetch(`${CONFIG.API_URL}${path}`, {
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  },

  // ── Питомцы ──────────────────────────────────────────────
  getPets()              { return this.request('GET',    '/pets'); },
  createPet(pet)         { return this.request('POST',   '/pets', pet); },
  updatePet(id, pet)     { return this.request('PUT',    `/pets/${id}`, pet); },
  deletePet(id)          { return this.request('DELETE', `/pets/${id}`); },

  // ── Прививки ─────────────────────────────────────────────
  createVaccine(v)       { return this.request('POST',   '/vaccines', v); },
  updateVaccine(id, v)   { return this.request('PUT',    `/vaccines/${id}`, v); },
  deleteVaccine(id)      { return this.request('DELETE', `/vaccines/${id}`); }
};
