-- Виконується автоматично лише при першому запуску контейнера PostgreSQL
-- (коли том pgdata порожній).

CREATE TABLE IF NOT EXISTS links (
    id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Короткий код (згенерований або alias). UNIQUE гарантує унікальність
    -- навіть при одночасних запитах; CHECK дублює перевірку формату на рівні БД.
    code         varchar(32)  NOT NULL UNIQUE
                 CHECK (code ~ '^[A-Za-z0-9_-]{3,32}$'),
    original_url text         NOT NULL
                 CHECK (length(original_url) <= 2048),
    created_at   timestamptz  NOT NULL DEFAULT now(),
    -- integer, а не bigint: pg-promise повертає bigint рядком.
    clicks       integer      NOT NULL DEFAULT 0
                 CHECK (clicks >= 0)
);
