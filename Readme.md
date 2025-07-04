# Project Management System - Backend API

## Description
This project is a robust backend API server built with Node.js and javaScript, designed to manage projects, tasks, subtasks, and notes with comprehensive user authentication and role-based permissions. 

Key features include:
- Express.js web framework
- MongoDB with Mongoose for data persistence
- File uploads using Multer and Cloudinary
- Email notifications via Nodemailer and Mailgen
- Validation with express-validator and Zod
- Winston for logging
- Code quality tools: Prettier, ESLint, Husky
- Hot reloading with ts-node-dev

## Technologies Used

### Core Stack
- **Backend**: Node.js with Express
- **Language**: javaScript
- **Database**: MongoDB with Mongoose

### Key Libraries
- **Authentication**: jsonwebtoken, bcryptjs
- **File Handling**: Multer, Cloudinary
- **Email**: Nodemailer, Mailgen
- **Validation**: express-validator, Zod
- **Logging**: Winston
- **Utilities**: cors, cookie-parser, dotenv
- **Api_docs**: swagger

### Development Tools
- Prettier
- ESLint

## Installation

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB
- Cloudinary account (for media storage)
- Email SMTP configuration (for notifications)

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/srvjha/project-managment-system
   cd project-management
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update with your configuration (database, Cloudinary, email, etc.)

4. Start the application:
   ```bash
   npm start
   # or
   yarn start
   ```

## Project Structure
```
Task-Management
├─ .prettierignore
├─ .prettierrc
├─ eslint.config.js
├─ package-lock.json
├─ package.json
├─ public
│  └─ images
│     ├─ avatar-1750819775801-585381060
│     └─ avatar-1750820034947-309602551
├─ Readme.md
└─ src
   ├─ .DS_Store
   ├─ app.js
   ├─ controllers
   │  ├─ auth.controllers.js
   │  ├─ healthcheck.controllers.js
   │  ├─ note.controllers.js
   │  ├─ project.controllers.js
   │  └─ task.controllers.js
   ├─ db
   │  └─ index.js
   ├─ index.js
   ├─ middlewares
   │  ├─ auth.middleware.js
   │  ├─ multer.middleware.js
   │  ├─ permission.js
   │  └─ rateLimiter.middlewae.js
   ├─ models
   │  ├─ note.models.js
   │  ├─ project.models.js
   │  ├─ projectmember.models.js
   │  ├─ subtask.models.js
   │  ├─ task.models.js
   │  └─ user.models.js
   ├─ routes
   │  ├─ auth.routes.js
   │  ├─ healthcheck.routes.js
   │  ├─ note.routes.js
   │  ├─ project.routes.js
   │  └─ task.routes.js
   ├─ swagger-gen.js
   ├─ swagger-output.json
   ├─ utils
   │  ├─ api-error.js
   │  ├─ api-response.js
   │  ├─ async-handler.js
   │  ├─ cloudinary.js
   │  ├─ constants.js
   │  ├─ handleZodError.js
   │  ├─ helper.js
   │  ├─ logger.js
   │  └─ mail.js
   └─ validators
      ├─ auth.js
      ├─ env.js
      ├─ note.validator.js
      ├─ project.validator.js
      └─ task.validator.js

```

## Features

### Core Functionality
- ✅ User authentication (JWT)
- ✅ Role-based access control
- ✅ Project management
- ✅ Task and subtask hierarchy
- ✅ Notes system

### Advanced Features
- 📁 File uploads with Cloudinary integration
- ✉️ Email notifications
- 🔒 Comprehensive input validation
- 📊 Activity logging
- 🛡️ Error handling middleware

## API Documentation
For detailed API documentation, clone the project and run on localhost and go this url ```http://localhost:5000/api-docs```

## Development

### Running in Development Mode
```bash
npm run dev
# or
yarn dev
```

### Building for Production
```bash
npm run build
# or
yarn build
```

### Linting
```bash
npm run lint
# or
yarn lint
```

## Contribution Guidelines

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please ensure your code:
- Follows existing style conventions
- Includes appropriate tests
- Has clear commit messages
- Documents any new features

## Support

For questions or support, please contact:

- **Email**: [pramodsamota21@gmail.com](mailto:pramodsamota21@gmail.com)


---

**Note**: This is a backend API only. For a complete project management solution, you'll need to pair this with a frontend client.
