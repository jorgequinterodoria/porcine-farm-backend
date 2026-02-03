import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Granja Multitenant API',
      version: '1.0.0',
      description: 'API completa para sistema de gestión granícola multi-tenant',
      contact: {
        name: 'API Support',
        email: 'api@granja.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.granja.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'firstName', 'lastName'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del usuario',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
            },
            firstName: {
              type: 'string',
              description: 'Nombre del usuario',
            },
            lastName: {
              type: 'string',
              description: 'Apellido del usuario',
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'farm_admin', 'operator'],
              description: 'Rol del usuario en el sistema',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del tenant al que pertenece',
            },
            isActive: {
              type: 'boolean',
              description: 'Estado del usuario',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
          },
        },
        Tenant: {
          type: 'object',
          required: ['name', 'subdomain'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del tenant',
            },
            name: {
              type: 'string',
              description: 'Nombre de la organización/granja',
            },
            subdomain: {
              type: 'string',
              description: 'Subdominio único para la organización',
            },
            plan: {
              type: 'string',
              enum: ['free', 'basic', 'premium', 'enterprise'],
              description: 'Plan de suscripción',
            },
            maxUsers: {
              type: 'integer',
              description: 'Número máximo de usuarios permitidos',
            },
            maxAnimals: {
              type: 'integer',
              description: 'Número máximo de animales permitidos',
            },
            isActive: {
              type: 'boolean',
              description: 'Estado del tenant',
            },
          },
        },
        Animal: {
          type: 'object',
          required: ['internalCode', 'sex', 'birthDate'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del animal',
            },
            internalCode: {
              type: 'string',
              description: 'Código interno único del animal',
            },
            identificationNumber: {
              type: 'string',
              description: 'Número de identificación oficial',
            },
            electronicId: {
              type: 'string',
              description: 'ID del chip electrónico',
            },
            sex: {
              type: 'string',
              enum: ['male', 'female'],
              description: 'Sexo del animal',
            },
            birthDate: {
              type: 'string',
              format: 'date',
              description: 'Fecha de nacimiento',
            },
            birthWeight: {
              type: 'number',
              description: 'Peso al nacer (kg)',
            },
            currentWeight: {
              type: 'number',
              description: 'Peso actual (kg)',
            },
            currentStatus: {
              type: 'string',
              enum: ['active', 'sold', 'deceased', 'quarantine', 'sick'],
              description: 'Estado actual del animal',
            },
            stage: {
              type: 'string',
              enum: ['piglet', 'nursery', 'fattening', 'breeding'],
              description: 'Etapa productiva',
            },
            breed: {
              type: 'string',
              description: 'Raza del animal',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del tenant propietario',
            },
            currentPenId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del corral actual',
            },
          },
        },
        Facility: {
          type: 'object',
          required: ['name', 'type', 'capacity'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único de la instalación',
            },
            name: {
              type: 'string',
              description: 'Nombre de la instalación',
            },
            type: {
              type: 'string',
              enum: ['breeding', 'fattening', 'nursery', 'quarantine', 'slaughter'],
              description: 'Tipo de instalación',
            },
            capacity: {
              type: 'integer',
              description: 'Capacidad máxima de animales',
            },
            currentOccupancy: {
              type: 'integer',
              description: 'Ocupación actual',
            },
            address: {
              type: 'string',
              description: 'Dirección de la instalación',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Mensaje de error',
            },
            code: {
              type: 'string',
              description: 'Código de error interno',
            },
          },
        },
        Success: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta',
            },
            message: {
              type: 'string',
              description: 'Mensaje de éxito',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          required: ['success', 'data', 'pagination'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Array de datos',
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'Número de página actual',
                },
                limit: {
                  type: 'integer',
                  description: 'Elementos por página',
                },
                total: {
                  type: 'integer',
                  description: 'Total de elementos',
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total de páginas',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    apis: [
      './src/routes/*.ts', // Path to the API routes
      './src/controllers/*.ts', // Path to the API controllers
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

/**
 * Configura Swagger UI para la aplicación
 * @param app Instancia de Express
 */
export const setupSwagger = (app: Application): void => {
  // Generar especificación Swagger
  const specs = swaggerJsdoc(options);

  // Servir documentación API
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { 
        background-color: #4f46e5; 
        border-bottom: 1px solid #4338ca; 
      }
      .swagger-ui .topbar .download-url-wrapper .select-label {
        color: #fff;
      }
    `,
    customSiteTitle: 'Granja API Documentation',
    customJs: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  }));

  // Servir especificación JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at /api-docs');
  console.log('📄 Swagger JSON available at /api-docs.json');
};