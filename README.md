# 🍼 Parento

> A modern full-stack parenting platform built with React, Node.js, TypeScript, PostgreSQL, Prisma, Redis, and Docker.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

---

## 📖 Overview

Parento is a full-stack parenting platform designed to help parents manage their children's health, connect with verified doctors, participate in community discussions, and access personalized parenting resources through a secure and scalable web application.

The project follows a modern full-stack architecture using React on the frontend and Node.js with TypeScript on the backend, powered by PostgreSQL, Prisma ORM, Redis, and Docker.

> **Note:** AI-powered parenting assistance is planned for a future release.

---

# ✨ Features

## 👨‍👩‍👧 Parent Features

- Child profile management
- Growth tracking (Height, Weight & BMI)
- Vaccination records & reminders
- Development milestone tracking
- Medication records
- Community discussion feed
- Likes, comments & bookmarks
- Real-time notifications
- Personal dashboard

---

## 🩺 Doctor Features

- Doctor registration
- Professional profile management
- Availability scheduling
- Appointment management
- Patient consultation history

---

## 🛡️ Admin Features

- User management
- Doctor verification
- Content moderation
- Report management
- Audit logs

---

# 🛠 Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- Socket.io Client

---

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Zod Validation
- bcryptjs

---

## DevOps

- Docker
- Docker Compose
- GitHub Actions
- Nginx

---

# 🏗 Project Structure

```text
parento/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 📸 Screenshots

> Screenshots will be added after deployment.

---

# 🚀 Getting Started

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (Optional)

---

## Clone Repository

```bash
git clone https://github.com/praveshnexus/parento.git
cd parento
```

---

## Environment Setup

Create the backend environment file.

```bash
cp backend/.env.example backend/.env
```

Update the environment variables with your own credentials.

---

## Install Dependencies

```bash
npm run install:all
```

---

## Run Database Migration

```bash
npm run db:migrate
```

---

## Start Development

```bash
npm run dev
```

---

## Docker

Run the complete application using Docker.

```bash
npm run docker:up
```

Stop containers

```bash
npm run docker:down
```

---

# ⚙️ Environment Variables

The backend requires the following environment variables.

| Variable | Description |
|-----------|-------------|
| DATABASE_URL | PostgreSQL connection |
| REDIS_URL | Redis connection |
| JWT_ACCESS_SECRET | JWT access token secret |
| JWT_REFRESH_SECRET | JWT refresh token secret |
| SMTP_HOST | SMTP server |
| SMTP_PORT | SMTP port |
| SMTP_USER | Email username |
| SMTP_PASS | Email password |
| GOOGLE_CLIENT_ID | Google OAuth Client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth Secret |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud |
| CLOUDINARY_API_KEY | Cloudinary key |
| CLOUDINARY_API_SECRET | Cloudinary secret |
| ANTHROPIC_API_KEY | *(Future AI Integration)* |

---

# 🔒 Security

- JWT Authentication
- Refresh Token Rotation
- Role-Based Authorization
- Helmet Security Headers
- CORS Protection
- Rate Limiting
- Zod Request Validation
- Password Hashing (bcrypt)
- Audit Logging
- Secure Environment Variables

---

# 📊 Database

Core models include:

- User
- Doctor
- Child
- Appointment
- Post
- Comment
- Like
- Bookmark
- GrowthRecord
- Vaccination
- Milestone
- Notification
- Conversation
- Message
- Report
- AuditLog

Prisma schema is available in:

```
backend/prisma/schema.prisma
```

---

# 🧪 Testing

Backend

```bash
npm test
```

Frontend Type Check

```bash
cd frontend
npx tsc --noEmit
```

---

# 🚀 Deployment

Deployment guides will be added after production deployment.

Planned platforms:

- Render (Backend)
- Vercel (Frontend)

---

# 📌 Roadmap

## Version 1.0

- ✅ Authentication
- ✅ Community Feed
- ✅ Child Management
- ✅ Growth Tracking
- ✅ Vaccination Tracking
- ✅ Doctor Appointments
- ✅ Notifications
- ✅ Docker Support
- ✅ CI/CD Pipeline

---

## Version 2.0

- ⏳ AI Parenting Assistant
- ⏳ Personalized Parenting Recommendations
- ⏳ AI Growth Analysis
- ⏳ Smart Vaccination Suggestions
- ⏳ AI Chat Assistant

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Commit your changes

```bash
git commit -m "feat: add new feature"
```

4. Push the branch

```bash
git push origin feature/your-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Pravesh Yadav**

GitHub:
https://github.com/praveshnexus

---

⭐ If you found this project useful, consider giving it a star.