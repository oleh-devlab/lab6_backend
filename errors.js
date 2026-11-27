// Помилка з HTTP-статусом і машиночитаним кодом (поле error у відповіді).
// Обробник кидає її через throw — Express 5 сам передає її в errorHandler.
export class HttpError extends Error {
  constructor(status, error, message) {
    super(message);
    this.status = status;
    this.error = error;
  }
}

export const badRequest = (message) =>
  new HttpError(400, 'VALIDATION_ERROR', message);

export const notFound = (message) =>
  new HttpError(404, 'NOT_FOUND', message);

// Реєструється після всіх маршрутів: сюди доходять запити,
// для яких жоден маршрут не спрацював.
export function notFoundHandler(req, res, next) {
  next(notFound(`Route ${req.method} ${req.path} not found`));
}

// Middleware для помилок (4 аргументи) — реєструється останнім.
// Формує однакову структуру { error, message } для всіх операцій.
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.error, message: err.message });
  }

  // Помилки express.json(): битий JSON або завелике тіло.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request body is not valid JSON',
    });
  }
  if (err.type === 'entity.too.large') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request body is too large',
    });
  }

  // Непередбачена помилка: деталі — лише в лог, клієнту — загальне повідомлення.
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
