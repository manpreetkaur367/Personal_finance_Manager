# SpendWise

SpendWise is a production-style personal finance dashboard built with the MERN stack. It gives users a secure way to manage transactions, budgets, analytics, and personal finance goals using real data from MongoDB-backed APIs.

## Features

- Secure authentication with JWT and HTTP-only cookies
- Dashboard for income, expense, balance, and savings metrics
- Transaction CRUD with search, filters, sorting, and date ranges
- Monthly budget tracking and warnings for overspending
- Recharts-powered analytics for category trends and monthly comparison
- Protected routes and ownership-based data isolation
- Responsive finance SaaS UI designed for desktop and mobile

## Stack

- Frontend: React, Vite, React Router, Recharts, Lucide React, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, express-validator
- Testing: Node test runner and Supertest

## Project structure

- frontend/
- backend/
- README.md

## Prerequisites

- Node.js 18+
- MongoDB instance or MongoDB Atlas connection string
- npm

## Local setup

1. Install dependencies:
   - cd backend && npm install
   - cd frontend && npm install

2. Create environment files:
   - backend/.env (copy from backend/.env.example)
   - frontend/.env (copy from frontend/.env.example)

3. Add your MongoDB URI and JWT secret.

## Start the app

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## API overview

Authentication

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- PUT /api/auth/profile
- PUT /api/auth/change-password

Transactions

- GET /api/transactions
- POST /api/transactions
- GET /api/transactions/:id
- PUT /api/transactions/:id
- DELETE /api/transactions/:id

Analytics

- GET /api/analytics/summary
- GET /api/analytics/monthly
- GET /api/analytics/categories
- GET /api/analytics/trends

Budgets

- GET /api/budgets
- POST /api/budgets
- PUT /api/budgets/:id
- DELETE /api/budgets/:id

Health

- GET /api/health

## Testing

Run backend tests with:

```bash
cd backend
npm test
```

## Deployment

Frontend:

- Deploy to Netlify, Vercel, or another frontend hosting service.
- Set VITE_API_URL to your deployed backend URL.

Backend:

- Deploy to Render, Railway, Fly.io, or any Node.js host.
- Set environment variables for PORT, MONGODB_URI, JWT_SECRET, FRONTEND_URL, NODE_ENV.

## MongoDB Atlas setup

1. Create a free MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Allow connections from your IP or set 0.0.0.0/0 for testing.
4. Copy the connection string into MONGODB_URI.

## GitHub upload

```bash
git init
git add .
git commit -m "Initial Commit"
git branch -M main
git remote add origin <your-github-url>
git push -u origin main
```

## Notes

- Do not commit real JWT secrets or database credentials.
- Keep the frontend and backend deployed separately for clean production setup.
- This project is built for portfolio and interview use and is ready to extend with recurring transactions, CSV exports, and notifications.
