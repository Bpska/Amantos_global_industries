import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Retailer Onboarding & Sales Tracking API',
    version: '1.0.0',
    description:
      'Backend API for managing retailer onboarding, sales order tracking, and baki (balance due) collections with strict role-based access.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
          error: { type: 'object' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'AdminPassword@123' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      CreateSalespersonRequest: {
        type: 'object',
        required: ['username', 'password', 'fullName'],
        properties: {
          username: { type: 'string', example: 'sp_rajesh' },
          password: { type: 'string', example: 'Sales@12345' },
          fullName: { type: 'string', example: 'Rajesh Sharma' },
          phone: { type: 'string', example: '+919876543210' },
        },
      },
      UpdateSalespersonRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          phone: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      OnboardShopRequest: {
        type: 'object',
        required: ['shopName', 'location', 'ownerName', 'contactNumber', 'quantity', 'unitPrice'],
        properties: {
          shopName: { type: 'string', example: 'Ganesh General Store' },
          location: { type: 'string', example: 'MG Road, Sector 4, Indiranagar' },
          latitude: { type: 'number', example: 12.9716 },
          longitude: { type: 'number', example: 77.5946 },
          ownerName: { type: 'string', example: 'Ganesh Patil' },
          contactNumber: { type: 'string', example: '9845012345' },
          productName: { type: 'string', default: 'Mixture Pack', example: 'Mixture Pack' },
          quantity: { type: 'integer', minimum: 1, example: 100 },
          unitPrice: { type: 'number', minimum: 0.01, example: 5 },
          amountPaid: { type: 'number', minimum: 0, default: 0, example: 200 },
          visitDate: { type: 'string', example: '2026-10-22' },
          notes: { type: 'string', example: 'Owner requested delivery before 10 AM' },
        },
      },
      CreateRepeatOrderRequest: {
        type: 'object',
        required: ['quantity', 'unitPrice'],
        properties: {
          productName: { type: 'string', default: 'Mixture Pack', example: 'Mixture Pack' },
          quantity: { type: 'integer', minimum: 1, example: 50 },
          unitPrice: { type: 'number', minimum: 0.01, example: 5 },
          amountPaid: { type: 'number', minimum: 0, default: 0, example: 100 },
          visitDate: { type: 'string', example: '2026-10-22' },
          notes: { type: 'string', example: 'Refill batch' },
        },
      },
      CreatePaymentRequest: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 0.01, example: 150 },
          paidOn: { type: 'string', example: '2026-10-22' },
          note: { type: 'string', example: 'Cash collected during evening route' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User login',
        description: 'Authenticates admin or salesperson and returns a 7-day JWT token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Successful login' },
          401: { description: 'Invalid credentials or account deactivated' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        responses: {
          200: { description: 'Current user profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change the current administrator password (Admin only)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
        },
        responses: {
          200: { description: 'Password changed successfully' },
          400: { description: 'Incorrect current password or invalid data' },
          403: { description: 'Only administrators can change passwords' },
        },
      },
    },
    '/admin/salespersons': {
      post: {
        tags: ['Admin'],
        summary: 'Create salesperson',
        description: 'Admin creates a salesperson account. Public signup is forbidden.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSalespersonRequest' } } },
        },
        responses: {
          201: { description: 'Salesperson created' },
          403: { description: 'Forbidden' },
        },
      },
      get: {
        tags: ['Admin'],
        summary: 'List salespersons with summary totals',
        description: 'Lists all salespersons with shops onboarded, sales amount, collected, and baki totals',
        responses: {
          200: { description: 'List of salespersons' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/admin/salespersons/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Edit salesperson details or activate/deactivate',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateSalespersonRequest' } } },
        },
        responses: {
          200: { description: 'Salesperson updated' },
        },
      },
    },
    '/admin/salespersons/{id}/reset-password': {
      post: {
        tags: ['Admin'],
        summary: 'Reset salesperson password',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { password: { type: 'string' } } } } },
        },
        responses: {
          200: { description: 'Password reset' },
        },
      },
    },
    '/admin/shops': {
      get: {
        tags: ['Admin'],
        summary: 'List all shops with search, filters, and pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'salespersonId', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Paginated shops list' },
        },
      },
    },
    '/admin/shops/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get shop details with all orders and payments',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Shop details' },
        },
      },
    },
    '/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'List all orders with status, date, and salesperson filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'salespersonId', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PAID', 'PARTIAL', 'UNPAID'] } },
        ],
        responses: {
          200: { description: 'Paginated orders list' },
        },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard metrics',
        description: 'Overall totals, today numbers (IST), last 7 days chart data, top 5 salespersons, top 5 baki shops',
        responses: {
          200: { description: 'Dashboard metrics' },
        },
      },
    },
    '/admin/export/orders.csv': {
      get: {
        tags: ['Admin'],
        summary: 'Export orders as CSV',
        responses: {
          200: { description: 'CSV file download' },
        },
      },
    },
    '/shops': {
      post: {
        tags: ['Salesperson / Shops'],
        summary: 'Onboard a shop and create initial order in one request',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OnboardShopRequest' } } },
        },
        responses: {
          201: { description: 'Shop onboarded and order created' },
        },
      },
    },
    '/shops/mine': {
      get: {
        tags: ['Salesperson / Shops'],
        summary: 'List shops onboarded by current salesperson',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'My shops list' },
        },
      },
    },
    '/shops/{id}': {
      get: {
        tags: ['Salesperson / Shops'],
        summary: 'Get details of a shop (salespersons can see only their own)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Shop details' },
          403: { description: 'Forbidden if not your shop' },
        },
      },
    },
    '/shops/{id}/orders': {
      post: {
        tags: ['Salesperson / Orders'],
        summary: 'Place a repeat order for an existing shop',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRepeatOrderRequest' } } },
        },
        responses: {
          201: { description: 'Repeat order created' },
        },
      },
    },
    '/orders/{id}/payments': {
      post: {
        tags: ['Salesperson / Orders'],
        summary: 'Collect baki (payment) towards an order',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePaymentRequest' } } },
        },
        responses: {
          200: { description: 'Payment recorded and balance updated' },
        },
      },
    },
    '/me/summary': {
      get: {
        tags: ['Salesperson'],
        summary: 'Get current salesperson summary',
        description: 'Returns my shops, my total sales, collected, baki, and today numbers in IST',
        responses: {
          200: { description: 'Salesperson summary' },
        },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
}
