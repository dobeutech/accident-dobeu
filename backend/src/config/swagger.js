const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Accident Reporting System API',
      version: '2.1.0',
      description: 'Comprehensive API for fleet accident reporting with telematics integration, kill switch functionality, and AI-powered image validation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://staging.example.com',
        description: 'Staging server',
      },
      {
        url: 'https://api.example.com',
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
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'fleet_admin', 'fleet_manager', 'fleet_viewer', 'driver'],
            },
            fleet_id: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            fleet_id: {
              type: 'string',
              format: 'uuid',
            },
            vehicle_number: {
              type: 'string',
            },
            vin: {
              type: 'string',
            },
            make: {
              type: 'string',
            },
            model: {
              type: 'string',
            },
            year: {
              type: 'integer',
            },
            license_plate: {
              type: 'string',
            },
            telematics_device_id: {
              type: 'string',
            },
            kill_switch_enabled: {
              type: 'boolean',
            },
            kill_switch_status: {
              type: 'string',
              enum: ['inactive', 'active', 'engaged', 'overridden'],
            },
          },
        },
        AccidentReport: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            fleet_id: {
              type: 'string',
              format: 'uuid',
            },
            driver_id: {
              type: 'string',
              format: 'uuid',
            },
            vehicle_id: {
              type: 'string',
              format: 'uuid',
            },
            report_number: {
              type: 'string',
            },
            incident_type: {
              type: 'string',
              enum: ['accident', 'incident', 'near_miss'],
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'under_review', 'closed'],
            },
            latitude: {
              type: 'number',
              format: 'double',
            },
            longitude: {
              type: 'number',
              format: 'double',
            },
            address: {
              type: 'string',
            },
            incident_date: {
              type: 'string',
              format: 'date-time',
            },
            custom_fields: {
              type: 'object',
            },
          },
        },
        WorkflowCompletion: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            report_id: {
              type: 'string',
              format: 'uuid',
            },
            vehicle_id: {
              type: 'string',
              format: 'uuid',
            },
            completion_percentage: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
            },
            is_complete: {
              type: 'boolean',
            },
            kill_switch_engaged: {
              type: 'boolean',
            },
            steps_required: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            steps_completed: {
              type: 'array',
              items: {
                type: 'object',
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
      {
        cookieAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Reports',
        description: 'Accident report management',
      },
      {
        name: 'Telematics',
        description: 'Vehicle and telematics provider management',
      },
      {
        name: 'Workflow',
        description: 'Workflow and supervisor override management',
      },
      {
        name: 'Uploads',
        description: 'File upload and management',
      },
      {
        name: 'Users',
        description: 'User management',
      },
      {
        name: 'Fleets',
        description: 'Fleet management',
      },
      {
        name: 'Health',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
