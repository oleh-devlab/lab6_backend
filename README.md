# lab6_backend

Сервіс скорочення посилань на Express.js 5 і PostgreSQL.

## Запуск

Потрібні Docker і Docker Compose.

```bash
git clone https://github.com/oleh-devlab/lab6_backend.git
cd lab6_backend
cp .env.sample .env # заповніть значення, приклад нижче
docker compose up --build
```

Приклад `.env`:

```
DB_HOST=db
DB_USER=shortener
DB_PASSWORD=ваш_пароль
DB_NAME=shortener
DB_PORT=5432
NODE_DOCKER_PORT=8080
```

`DB_HOST=db` — ім'я сервісу бази в `compose.yaml`; якщо запускати сервер
без Docker, потрібно `localhost`.

Сервер доступний за адресою <http://localhost:8080>.

Перевірка стану: `curl -i http://localhost:8080/health`
відповідає `200` (база доступна) або `503` (база недоступна).

## Зупинка

```bash
docker compose down # дані зберігаються в томі db-data
docker compose down --volumes # видалити також дані бази
```

Скрипт `db/initdb.sql` виконується лише при першому створенні бази.
Після зміни таблиці в ньому потрібно `docker compose down --volumes`.

## Структура

```
openapi.yaml               специфікація API (єдине джерело правди)
test.txt                   curl-команди для перевірки всіх кодів стану
db/initdb.sql              створення таблиці links
src/
  server.js                запуск сервера і коректна зупинка
  app.js                   порядок middleware і маршрутів, /health
  db.js                    підключення pg-promise
  swagger.js               Swagger UI з openapi.yaml
  errors.js                HttpError, обробники 404 і помилок
  validation.js            перевірка тіла і параметрів запиту
  middleware/logger.js     логування запитів
  repositories/links.js    SQL-запити до таблиці links
  routes/links.js          /api/links: обробники операцій
  routes/redirect.js       /{code}: перехід і підрахунок
```
