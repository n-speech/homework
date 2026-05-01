-- ============================================================
-- Схема базы данных ВетКлиники
-- Запустить в Supabase: SQL Editor → New query → Run
-- ============================================================

-- Таблица питомцев
CREATE TABLE pets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Собака', 'Кошка', 'Другое')),
  breed       TEXT,
  birth_date  DATE,
  sex         TEXT CHECK (sex IN ('Самец', 'Самка')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Таблица прививок
CREATE TABLE vaccines (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  date_done   DATE,
  date_next   DATE,
  status      TEXT DEFAULT 'done' CHECK (status IN ('done', 'soon', 'next')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security — каждый видит только своих питомцев
-- ============================================================

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;

-- Питомцы: пользователь работает только со своими
CREATE POLICY "pets_owner" ON pets
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Прививки: доступны если питомец принадлежит пользователю
CREATE POLICY "vaccines_owner" ON vaccines
  USING (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  )
  WITH CHECK (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );

-- ============================================================
-- Индексы для быстрых запросов
-- ============================================================

CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_vaccines_pet_id ON vaccines(pet_id);
CREATE INDEX idx_vaccines_date_next ON vaccines(date_next);
