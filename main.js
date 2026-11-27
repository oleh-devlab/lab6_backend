import express from 'express';

const app = express();
const PORT = Number(process.env.NODE_DOCKER_PORT ?? 8080);

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
