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

## Зупинка

```bash
docker compose down # дані зберігаються в томі db-data
docker compose down --volumes # видалити також дані бази
```

Скрипт `initdb.sql` виконується лише при першому створенні бази.
Після зміни таблиці в ньому потрібно `docker compose down --volumes`.
