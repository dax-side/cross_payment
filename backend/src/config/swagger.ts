import swaggerJsdoc from 'swagger-jsdoc';

const isDev = process.env.NODE_ENV !== 'production';
const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cross-Border Payment API',
      version: '1.0.0',
      description: 'A demo API for cross-border stablecoin payments using USDC on Polygon testnet',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: baseUrl,
        description: isDev ? 'Development server' : 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            walletAddress: { type: 'string' },
            fiatBalance: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            senderEmail: { type: 'string' },
            recipientEmail: { type: 'string' },
            amountFiat: { type: 'number' },
            amountUSDC: { type: 'number' },
            exchangeRate: { type: 'number' },
            fee: { type: 'number' },
            txHash: { type: 'string', nullable: true },
            status: { 
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed']
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        WalletBalance: {
          type: 'object',
          properties: {
            fiatBalance: { type: 'number' },
            usdcBalance: { type: 'string' },
            walletAddress: { type: 'string' }
          }
        },
        ExchangeRate: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            rate: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: isDev
    ? ['./src/routes/*.ts', './src/controllers/*.ts']
    : ['./dist/routes/*.js', './dist/controllers/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
