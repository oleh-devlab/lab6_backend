import pgPromise from 'pg-promise';

export const pgp = pgPromise();

// Параметри підключення беруться з .env, а не з коду.
// У Compose хост — ім'я сервісу db.
export const db = pgp({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Не чекати на недоступну базу довше за 3 с (важливо для health check).
  connectionTimeoutMillis: 3000,
});
