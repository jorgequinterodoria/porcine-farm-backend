# Porcine Farm Management - Backend

Backend API for multi-tenant pig farm management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (`.env`):
```env
DATABASE_URL="your-neon-database-url"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

3. Generate Prisma Client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user/tenant
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/invite` - Invite user (admin only)
- `POST /api/auth/logout` - Logout

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio