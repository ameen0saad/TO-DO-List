# TO-DO List App - Backend

A comprehensive task management application backend built with Express.js, Prisma, and PostgreSQL. Features user authentication, team collaboration, task management, and email notifications.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database](#database)
- [Environment Variables](#environment-variables)
- [Security Features](#security-features)
- [Error Handling](#error-handling)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### User Management
- User registration with email verification
- Secure login/logout with JWT authentication
- Password reset with OTP verification
- Google OAuth 2.0 integration
- Profile management
- Password change functionality

### Task Management
- Create, read, update, and delete personal tasks
- Task prioritization (Low, Medium, High)
- Task status tracking (Pending, In Progress, Done)
- Task completion marking
- Due date assignment
- Task descriptions
- Task filtering and search
- Pagination support

### Team Collaboration
- Create and manage teams
- Add/remove team members
- Team ownership transfer
- Leave team functionality
- Team task management
- Role-based task permissions

### Email Notifications
- Welcome email on successful registration
- Email verification for account confirmation
- OTP email for password reset
- Password reset confirmation

### API Features
- Advanced filtering and search
- Sorting by multiple fields
- Pagination
- Field selection
- Relationship inclusion
- Rate limiting
- XSS protection
- CORS support
- Helmet security headers

## 🛠️ Tech Stack

**Runtime & Framework:**
- Node.js
- Express.js v5.1.0

**Database & ORM:**
- PostgreSQL
- Prisma v6.15.0

**Authentication & Security:**
- JWT (JSON Web Tokens)
- bcrypt for password hashing
- Passport.js for OAuth
- Helmet for security headers
- express-rate-limit for rate limiting
- express-xss-sanitizer for XSS protection
- hpp for HTTP Parameter Pollution protection

**Email Service:**
- Brevo (formerly Sendinblue) API
- Node Mailer

**Utilities:**
- dotenv for environment management
- Morgan for HTTP request logging
- Cookie-parser for cookie handling
- CORS for cross-origin requests
- Validator for input validation

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Brevo account for email service
- Google OAuth credentials (optional)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

### 4. Setup database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start the server

```bash
npm start          # Development with nodemon
npm run start:prod # Production mode
```

The server will run on `http://localhost:3000` (or your configured PORT)

## ⚙️ Configuration

### Database Setup

The application uses PostgreSQL. Ensure your database is running and accessible.

### Prisma Schema

The schema includes:
- User model
- Task model
- Team model
- TeamTask model
- OTP model
- VerificationToken model

### Email Configuration

Configure Brevo API for email notifications:
1. Create a Brevo account
2. Generate API keys
3. Add credentials to `.env`

### OAuth Setup (Optional)

For Google OAuth:
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://your-domain/api/v1/users/auth/google/callback`
4. Add credentials to `.env`

## 📁 Project Structure

```
Backend/
├── controller/              # Route controllers
│   ├── authController.js   # Authentication logic
│   ├── taskController.js   # Task management
│   ├── teamController.js   # Team management
│   ├── teamTaskController.js # Team task management
│   ├── oauthController.js  # OAuth logic
│   └── errorController.js  # Error handling
├── routes/                 # Express routes
│   ├── userRoutes.js
│   ├── taskRoutes.js
│   ├── teamRoutes.js
│   └── teamTaskRoutes.js
├── utils/                  # Utility functions
│   ├── ApiFeatures.js     # Query builder
│   ├── AppError.js        # Custom error class
│   ├── email.js           # Email service
│   └── path.js            # Path utilities
├── prisma/                # Prisma configuration
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── public/                # Static files
│   └── html/email/        # Email templates
├── app.js                 # Express app setup
├── server.js              # Server entry point
├── package.json
└── .eslintrc.json         # ESLint configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/users/signup` - Register new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/logout` - Logout user
- `POST /api/v1/users/forgetPassword` - Request password reset
- `POST /api/v1/users/verifyOTP` - Verify OTP
- `PATCH /api/v1/users/resetPassword` - Reset password
- `PATCH /api/v1/users/updatePassword` - Update password (authenticated)
- `GET /api/v1/users/me` - Get user profile (authenticated)

### OAuth
- `GET /api/v1/users/auth/google` - Google OAuth login
- `GET /api/v1/users/auth/google/callback` - Google OAuth callback

### Tasks
- `GET /api/v1/tasks` - Get all tasks (paginated, filterable)
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/:id` - Get task by ID
- `PATCH /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `GET /api/v1/tasks/completedTask` - Get completed tasks

### Teams
- `GET /api/v1/teams` - Get all teams
- `POST /api/v1/teams` - Create new team
- `GET /api/v1/teams/:teamId` - Get team details
- `PATCH /api/v1/teams/:teamId` - Update team
- `DELETE /api/v1/teams/:teamId` - Delete team
- `PATCH /api/v1/teams/deletememper/:teamId` - Remove team members
- `PATCH /api/v1/teams/leaveTeam/:teamId` - Leave team
- `PATCH /api/v1/teams/transfareOwner/:teamId` - Transfer ownership

### Team Tasks
- `GET /api/v1/teamTasks/:teamId` - Get team tasks
- `POST /api/v1/teamTasks/:teamId` - Create team task
- `GET /api/v1/teamTasks/:teamId/:id` - Get specific team task
- `PATCH /api/v1/teamTasks/:teamId/:id` - Update team task
- `DELETE /api/v1/teamTasks/:teamId/:id` - Delete team task

## 🔐 Authentication

### JWT Implementation
- Tokens are issued upon login
- Tokens expire based on `JWT_EXPIRES_IN` setting
- Tokens stored in HTTP-only cookies
- Tokens can also be sent via Authorization header: `Bearer <token>`

### Protected Routes
Use the `protect` middleware on routes requiring authentication:

```javascript
router.use(authController.protect);
```

### Password Security
- Passwords hashed with bcrypt (12 rounds)
- Password change tracking
- Password history comparison on reset

## 🗄️ Database

### Schema Highlights

**User**
- UUID primary key
- Email uniqueness constraint
- Password hashing
- Email verification status
- OAuth support (nullable password)

**Task**
- Linked to user via userId
- Priority and status enums
- Completion tracking
- Timestamps
- Indexes on priority, completion, and dueDate

**Team**
- Owner relationship
- Many-to-many user relationship
- Cascade delete

**TeamTask**
- Linked to team
- Similar structure to personal tasks
- Cascade delete on team deletion

**OTP & VerificationToken**
- Expiry tracking
- User linking
- Cascade delete on user removal

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/todolist

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@yourapp.com

# CORS
CLIENT_URL=http://localhost:5500

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session
SESSION_EXPIRES=15m
```

## 🛡️ Security Features

- **Helmet**: Security headers protection
- **Rate Limiting**: IP-based request throttling
- **XSS Protection**: Input sanitization
- **HPP**: HTTP Parameter Pollution prevention
- **CORS**: Configured allowed origins
- **Password Hashing**: bcrypt with 12 rounds
- **Email Verification**: Required before account activation
- **OTP Verification**: Secure password reset flow
- **JWT**: Secure token-based authentication

## ❌ Error Handling

### Global Error Handler
Centralized error handling in `errorController.js`:

```javascript
globalErrorHandler(err, req, res, next)
```

### Custom AppError Class
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
  }
}
```

### Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## 📝 Scripts

```bash
# Development
npm start

# Production
npm run start:prod

# Database
npx prisma migrate dev      # Create migration
npx prisma migrate deploy   # Apply migrations
npx prisma studio          # Open Prisma Studio
npx prisma db seed         # Seed database
npx prisma generate        # Generate Prisma client
```

## 🌐 Deployment

### Railway (Current Host)
1. Push code to GitHub
2. Connect repository to Railway
3. Configure environment variables
4. Railway auto-deploys on push

### Environment Setup for Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<secure_random_key>
BREVO_API_KEY=<your_api_key>
CLIENT_URL=https://yourdomain.com
```

### Database Migrations
Run migrations before starting:
```bash
npx prisma migrate deploy
```


## 📄 License

This project is licensed under the ISC License.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

## 👨‍💻 Author

**Ameen Saad**

- GitHub: [@ameen0saad](https://github.com/ameen0saad)

---


---

**Last Updated**: November 2025
**Version**: 1.0.0
