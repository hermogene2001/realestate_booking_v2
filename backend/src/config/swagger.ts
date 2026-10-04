import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Kigali Real Estate API',
    version: '1.0.0',
    description: 'Complete API documentation for the Kigali Real Estate Booking Platform',
    contact: {
      name: 'API Support',
      email: 'support@kigali-re.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Development server',
    },
    {
      url: 'https://api.kigali-re.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: any) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  console.log(`[Swagger] API docs available at http://localhost:${env.PORT}/api-docs`);
}
