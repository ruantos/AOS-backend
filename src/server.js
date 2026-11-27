import app from './app.js';
import { env } from './config/env.js';

try {

  app.listen(env.port, '0.0.0.0', () => {
  console.log(`Servidor em execução: ${env.port}`);
});
} catch (error) {
  console.log("Erro ao inicializar o servidor: " + error)
}

