import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapi } from '../config/openapi.js';
import { authenticateDocumentation } from '../middlewares/authenticateDocumentation.js';

const router = Router();

router.use(authenticateDocumentation);
router.get('/openapi.json', (req, res) => res.json(openapi));
router.use(swaggerUi.serve);
router.get('/', swaggerUi.setup(null, {
  customSiteTitle: 'Recife Express | API',
  swaggerOptions: { url: '/api-docs/openapi.json', validatorUrl: null, persistAuthorization: false, docExpansion: 'none' },
}));

export default router;
