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

> **Parento AI:** parents can chat with an assistant about each child's growth, vaccinations and milestones. It uses Claude when an Anthropic API key is configured, and falls back to a built-in knowledge base otherwise (see [Parento AI](#-parento-ai)).

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
- Parento AI child-health assistant (streaming chat, per-child context)

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
│   │   ├── data/          (Parento AI knowledge base)
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

## Seed Demo Data (optional)

```bash
npm run db:seed
```

Creates demo accounts and a parent with two children (Arjun, 14 months, and Anaya, about 4 years) whose growth, vaccination and milestone records are dated relative to today.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@parento.com | Admin@123 |
| Doctor | doctor@parento.com | Doctor@123 |
| Parent | parent@parento.com | Parent@123 |

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
| ANTHROPIC_API_KEY | *(Optional)* Anthropic key for Parento AI. Without a valid key the assistant uses the built-in knowledge base |
| ANTHROPIC_MODEL | *(Optional)* Claude model ID, default `claude-sonnet-5-5` |

---

# 🤖 Parento AI

Parents open **Parento AI** (✨ icon in the top bar, or `/ai`), pick a child, and ask questions. Replies stream in real time over Server-Sent Events.

- **With a valid `ANTHROPIC_API_KEY`:** Claude answers using the child's real records (growth, vaccinations, milestones, allergies, medications) plus the most relevant knowledge-base entries for the question.
- **Without a key, or if the API is unreachable:** the assistant answers from the built-in knowledge base and the child's records, so the feature still works offline. Such replies are labelled in the chat.
- Emergency questions (breathing trouble, seizures, swallowed batteries, etc.) always start with an instruction to call emergency services.

The knowledge base lives in `backend/src/data/knowledge/`:

| File | Contents | Source |
|------|----------|--------|
| `who-growth-standards.json` | Official LMS tables by day of age (0-1856 days) for weight, length/height, head circumference and BMI, used for exact z-scores and percentiles | WHO Child Growth Standards, from WHO's [`anthro`](https://github.com/WorldHealthOrganization/anthro) repository |
| `vaccination-schedule.json` | Routine immunization timetable with official notes | IAP-ACVIP 2023, Table I ([Indian Pediatrics, Feb 2024](https://www.indianpediatrics.net/feb2024/113.pdf)) |
| `milestones.json` | All 159 milestones from the 12 official checklists (2 months to 5 years), plus screening reminders and parent tips | CDC "Learn the Signs. Act Early." (2022 revision, public domain) |
| `parenting-faq.json` | Parenting and child-health FAQs (fever, feeding, sleep, safety, red flags) | Parento editorial summary of public WHO/AAP/IAP/CDC guidance |

New children get the CDC milestone checklist in **Track**, and the demo seed generates growth records from the WHO tables. The FAQ file is a written summary, not an official document, so have a pediatrician review it before production use.

API endpoints (parent role): `POST /api/ai/chat/:childId`, `GET /api/ai/summary/:childId`, and `GET /api/ai/status`.

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
- ✅ AI Chat Assistant (Claude + offline knowledge base)

---

## Version 2.0

- ⏳ Personalized Parenting Recommendations
- ⏳ AI Growth Analysis
- ⏳ Smart Vaccination Suggestions

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