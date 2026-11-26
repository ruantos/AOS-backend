import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Recife Express ouvindo na porta ${env.port}`);
});
