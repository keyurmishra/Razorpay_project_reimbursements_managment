# Razorpay Reimbursement Management API

A robust RESTful API for managing employee reimbursement claims, featuring role-based access control (RBAC), hierarchical approvals, and robust state management.

## Architecture Explanation

This project uses a layered architecture to ensure separation of concerns and maintainability:

1. **Routes Layer (`src/routes`)**: Maps HTTP methods and paths to specific controllers. Applies authentication and authorization middleware.
2. **Middleware Layer (`src/middleware`)**: Handles JWT authentication (`authenticate.js`), role-based access control (`authorize.js`), Joi request validation (`validate.js`), and global error handling (`errorHandler.js`).
3. **Controller Layer (`src/controllers`)**: Acts as the interface between the network and business logic. Parses HTTP requests, delegates work to services, and formats the HTTP response (with consistent JSON structures).
4. **Service Layer (`src/services`)**: Contains the core business logic, state machines (e.g., reimbursement status transitions), and transaction logic. It is completely decoupled from HTTP concerns.
5. **Repository Layer (`src/repositories`)**: Encapsulates all database interactions and Sequelize queries. Services never interact directly with Sequelize models, ensuring database logic is centralized.
6. **Model Layer (`src/models`)**: Defines the data schema, associations, and database-level validation using Sequelize.

## Setup Steps

1. **Clone the repository** and navigate to the project root.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy the example environment file and fill in your local configurations:
   ```bash
   cp .env.example .env
   ```
4. **Ensure PostgreSQL is running** and accessible via the credentials specified in your `.env` file.

## Environment Variables

The application relies on the following environment variables. Set them in your `.env` file:

```env
# Server
NODE_ENV=development      # 'development', 'production', or 'test'
PORT=7002                 # The port the Express server will listen on

# Database
DB_HOST=localhost         # PostgreSQL host
DB_PORT=5432              # PostgreSQL port
DB_NAME=razor_db          # Database name
DB_USER=postgres          # Database username
DB_PASSWORD=yourpassword  # Database password

# Security
JWT_SECRET=super_secret   # Secret key for signing JWTs
JWT_EXPIRES_IN=7d         # JWT expiration duration
COOKIE_SECRET=cookie_key  # Secret for signing HTTP-only cookies
```

## Migration Commands

The project uses `sequelize-cli` to manage database schema changes.

```bash
# Create the database (if it doesn't exist)
npx sequelize-cli db:create

# Run all pending migrations
npx sequelize-cli db:migrate

# Undo the most recent migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## Seeder Commands

Seeders populate the database with initial data (such as default roles or an initial admin/CFO user).

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Undo all seeders
npx sequelize-cli db:seed:undo:all
```
*(Note: If seeders haven't been created yet, you can generate one using `npx sequelize-cli seed:generate --name init-users`)*

## Testing

Integration tests cover critical workflows and are written using Jest and Supertest.

```bash
# Prepare the test database (drops, creates, and migrates 'razor_db_test')
npm run test:db:setup

# Run the test suite
npm run test
```

## API Documentation

Swagger API documentation is integrated directly into the application.

Once the server is running (`npm run dev`), you can view the interactive API documentation at:

**`http://localhost:7002/api-docs`**

The documentation includes detailed schemas, request/response formats, and role constraints for all endpoints:
- **Auth**: `/rest/onboardings/register`, `/login`, `/logout`
- **Roles**: `/rest/roles/assign`
- **Employees**: `/rest/employees`, `/rest/employees/assign`
- **Reimbursements**: `/rest/reimbursements`, `/rest/reimbursements/:id/decision`
