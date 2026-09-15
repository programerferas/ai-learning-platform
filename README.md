# 🎓 AI Learning Platform

A full-stack AI-powered Learning Management System (LMS).

The platform provides a complete learning experience where students can discover courses, enroll in them, access lessons, track their progress, generate AI-powered summaries and quizzes, and interact with an AI learning assistant.

It also includes an admin dashboard for managing users, courses, categories, lessons, and reviews.

---

## 📌 Overview

This project was built as a practical full-stack application rather than a simple CRUD project.

It combines:

* React frontend
* Node.js / Express backend
* PostgreSQL database
* Prisma ORM
* Secure authentication
* Role-based authorization
* Email verification
* Private video storage
* AI-powered learning features
* Admin dashboard
* Course enrollment and progress tracking
* Reviews and ratings

The application is primarily designed for Arabic content and supports RTL interfaces.

---

## ✨ Features

### 👨‍🎓 Student

Students can:

* Create an account
* Verify their email
* Log in securely
* Browse available courses
* Browse courses by category
* View course details
* Enroll in courses
* Access enrolled lessons
* Watch course videos
* Track lesson progress
* Track course progress
* Generate AI-powered lesson summaries
* Take AI-generated lesson quizzes and course quizzes
* Ask questions through the AI assistant
* Get AI-generated course recommendations
* Resume a course from the last lesson
* Write course reviews
* Rate courses
* Manage their profile

---

### 🤖 AI Features

The platform integrates **Google Gemini** to provide AI-powered learning functionality.

Current AI features include:

* Lesson summaries (generated once per lesson and stored in the database)
* Lesson quizzes (3–15 multiple-choice questions, generated once per lesson and stored)
* Course quizzes built from the lesson summaries of a course
* AI learning assistant (chat) with per-user conversation history, optionally scoped to a lesson
* Course recommendations with AI-written explanations

AI requests are handled by the backend so that API credentials are not exposed to the frontend.

### AI request protection

Every AI request passes through the following chain before it can reach Gemini:

```text
verified login
   ↓
per-account burst limit
   ↓
daily / hourly limits
   ↓
Zod validation
   ↓
lesson / course authorization
   ↓
cache
   ↓
Gemini
   ↓
retry / backoff
```

* **Authentication** – all `/api/ai` routes require a verified, logged-in user.
* **Rate limits per account** (keyed by user ID, not IP):
  * 15 requests / minute
  * 20 requests / hour on the expensive generators (course quiz, recommendations)
  * 200 requests / day
* **Validation** – Zod schemas bound message length (≤ 2000 characters), question count (3–15) and ID formats.
* **Authorization** – summaries, quizzes and lesson-scoped chat are only available to students enrolled in the course, the course instructor, or an admin.
* **Caching** – lesson summaries and lesson quizzes are stored in the database; course quizzes and recommendations are cached in memory (6 h / 24 h) so repeated requests do not call Gemini again.
* **Retry / backoff** – transient Gemini errors (429 / 500 / 503) are retried with exponential backoff; if they persist the client receives a clean 503 response.

The AI rate limiter and the in-memory cache are **instance-local**: they live in the memory of a single backend process and are not shared across multiple instances.

---

### 👨‍💼 Admin Dashboard

Administrators can manage the learning platform through a dedicated dashboard.

Admin functionality includes:

* User management
* Course management
* Category management
* Lesson management
* Course thumbnails
* Category thumbnails
* Review moderation
* Contact-form notifications inbox
* Platform statistics (users, courses, lessons, reviews, recent enrollments)

---

## 🔐 Authentication

The application uses JWT-based authentication with **HTTP-only cookies**.

Authentication flow:

```text
User
 ↓
Login
 ↓
Backend validates credentials
 ↓
JWT generated
 ↓
JWT stored in HTTP-only cookie
 ↓
Authenticated requests
```

The JWT contains the user's ID.

The user's role is retrieved from the database when authorization decisions are required rather than relying on a role stored inside the JWT.

---

## 📧 Email Verification

New users must verify their email before their account is created.

The registration flow uses a temporary `PendingUser` record.

```text
Register
   ↓
Create PendingUser
   ↓
Generate verification token
   ↓
Hash token
   ↓
Store hashed token
   ↓
Send verification email
   ↓
User opens verification link
   ↓
Hash received token
   ↓
Compare with stored hash
   ↓
Create User
```

Verification tokens:

* Have an expiration time
* Are stored hashed in the database
* Are sent to the user in their raw form
* Are protected against excessive verification attempts

---

## 🛡️ Security

The backend includes several security mechanisms:

* JWT authentication
* HTTP-only cookies
* Password hashing with bcrypt
* Role-based authorization
* Rate limiting
* Helmet
* HPP protection
* CORS configuration
* Zod request validation
* Environment variable validation
* Centralized application errors
* Generic authentication error responses
* Signed, expiring storage URLs for uploads and video playback
* Per-account rate limits, validation, authorization and caching on AI endpoints (see above)

Sensitive credentials and secrets are stored in environment variables.

---

## 🎥 Video Storage

Course videos are stored using **Supabase Storage**.

The application uses signed URLs for protected video content.

### Upload flow

```text
Frontend
   ↓
Request upload URL
   ↓
Backend generates signed upload URL
   ↓
Frontend uploads video
   ↓
Backend stores video key
```

### Playback flow

```text
Student requests lesson
        ↓
Backend checks authorization
        ↓
Backend generates temporary signed URL
        ↓
Student receives video URL
        ↓
Video is played from Supabase Storage
```

This allows course videos to remain private instead of exposing permanent public video URLs.

---

## 👥 User Roles

The application currently supports three roles:

### STUDENT

Students can:

* Browse courses
* Enroll in courses
* Access enrolled lessons
* Track learning progress
* Take quizzes
* Write reviews
* Use AI learning features

### INSTRUCTOR

Instructors can:

* Create, edit, delete and publish/unpublish their own courses
* Add, edit, reorder and delete lessons in their own courses
* Upload course thumbnails and lesson videos
* Use the AI features on their own courses

Ownership is checked on the backend: an instructor cannot modify another instructor's course.

### ADMIN

Administrators can:

* Manage users
* Manage courses
* Manage categories
* Manage lessons
* Manage reviews
* View platform statistics

Authorization is enforced on the backend.

---

## 🗄️ Database

The application uses:

**PostgreSQL + Prisma ORM**

Main database models include:

```text
User
PendingUser
Course
Lesson
Category
Enrollment
Review
Notification
ChatSession
ChatMessage
LessonSummary
Quiz
QuizQuestion
```

These models handle relationships between:

* Users and courses
* Courses and categories
* Students and enrollments
* Courses and lessons
* Students and progress
* Courses and reviews
* AI conversations
* AI-generated summaries
* Quizzes and questions

---

## 📡 REST API

The backend is built using Express and follows a REST-style API structure.

Main API areas include:

```text
/api/auth
/api/users
/api/courses
/api/categories
/api/lessons
/api/enrollments
/api/reviews
/api/uploads
/api/ai
/api/notifications
/api/dashboard
/health
```

Error responses use a consistent structure:

```json
{
  "message": "Something went wrong"
}
```

Validation errors additionally include the failing fields:

```json
{
  "message": "First error message",
  "errors": [{ "field": "email", "message": "..." }]
}
```

The backend uses centralized error handling through application errors, so expected failures return proper HTTP status codes (400 / 401 / 403 / 404 / 409 / 429) and unexpected ones return a generic 500 in production.

---

## 🎨 Frontend

The frontend is built with React.

Main application pages include:

```text
Home
Courses
Categories
Course Details
Login / Register
Forgot / Reset Password
Email Verification
Lesson (video, curriculum, progress, AI summary, AI chat)
Quiz
My Courses
Account Settings
Contact / About
Admin Dashboard (overview, users, courses, lessons, categories, reviews, notifications)
```

Frontend technologies:

* React
* React Router
* Axios
* Context API
* Tailwind CSS
* JavaScript

Authentication state is managed through an authentication context.

Axios requests use `withCredentials` to allow the browser to send the authentication cookie.

---

## 🌍 Arabic & RTL

The platform is designed primarily for Arabic-speaking learners.

The interface supports:

* Arabic content
* RTL layouts
* Arabic course descriptions
* Arabic learning materials
* Arabic-oriented UI

---

## 🧱 Project Architecture

The application is separated into frontend and backend layers.

```text
                    ┌──────────────────┐
                    │   React Frontend │
                    └────────┬─────────┘
                             │
                           Axios
                             │
                             ▼
                    ┌──────────────────┐
                    │  Express Backend │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       Authentication    Services       Validation
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                       Prisma ORM
                             │
                             ▼
                       PostgreSQL
```

External services:

```text
Express Backend
      │
      ├── Gemini → AI features
      │
      ├── Supabase → Video storage
      │
      └── Nodemailer / SMTP → Email verification
```

---

## 📁 Project Structure

Simplified structure:

```text
src/
│
├── frontend/
│   ├── src/
│   │   ├── api/            # one Axios wrapper per backend module
│   │   ├── components/
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # public, student (lessonPage/), AdminDashboard/
│   │   └── App.jsx         # routes and route guards
│   ├── .env.example
│   └── package.json
│
└── backend/
    ├── app.js              # Express app: security, CORS, limits, routes, errors
    ├── server.js           # boot, cleanup job, graceful shutdown
    ├── config/             # env validation, cookie options, swagger
    ├── middlewares/        # auth, roles, validate, error handler
    ├── modules/            # one folder per feature: routes → controller → service
    │   ├── ai/  auth/  category/  course/  dashboard/  enrollment/
    │   ├── lesson/  notifications/  review/  upload/  user/
    ├── schemas/            # Zod request schemas
    ├── lib/                # prisma, mailer, storage (S3), gemini
    ├── utils/              # AppError, logger, jwt, prompts, ttlCache
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.js         # creates the first admin
    ├── .env.example
    └── package.json

README.md
```

---

## 🛠️ Tech Stack

### Frontend

* React
* JavaScript
* React Router
* Axios
* Tailwind CSS
* Context API

### Backend

* Node.js
* Express.js
* JavaScript / ES Modules
* JWT
* bcrypt
* Zod
* Nodemailer

### Database

* PostgreSQL
* Prisma ORM
* Prisma Migrations

### External Services

* Supabase Storage
* Google Gemini API
* SMTP / Nodemailer

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/programerferas/ai-learning-platform.git
```

```bash
cd ai-learning-platform
```

### 2. Install dependencies

The frontend and backend are separate applications, each with its own `package.json`:

```bash
cd src/backend && npm install
cd ../frontend && npm install
```

### 3. Configure environment variables

Create a `.env` file in each application based on its `.env.example`.

Backend (`src/backend/.env`) – the server validates these at startup and refuses to boot if required values are missing:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
API_URL=http://localhost:5000
FRONTEND_URLS=http://localhost:5173

EMAIL_USER=
EMAIL_PASS=

SUPABASE_S3_ENDPOINT=
SUPABASE_S3_REGION=
SUPABASE_S3_ACCESS_KEY_ID=
SUPABASE_S3_SECRET_ACCESS_KEY=
SUPABASE_STORAGE_BUCKET=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

Frontend (`src/frontend/.env`):

```env
VITE_API_URL=http://localhost:5000
```

**Never commit your real `.env` file or secret keys to GitHub.**

---

## 🗃️ Database Setup

From `src/backend`:

Apply migrations (development):

```bash
npx prisma migrate dev
```

Apply migrations (production):

```bash
npm run prisma:migrate
```

Generate Prisma Client (also runs automatically after `npm install`):

```bash
npm run prisma:generate
```

Create the first admin account:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='Strong1pass' npm run prisma:seed
```

---

## ▶️ Running the Project

Backend (from `src/backend`):

```bash
npm run dev      # development with nodemon – http://localhost:5000
npm start        # production
```

Frontend (from `src/frontend`):

```bash
npm run dev      # Vite dev server – http://localhost:5173
npm run build    # production bundle in dist/
```

A health check is available at `GET /health`. API docs (Swagger) are served at `/api-docs` in development only.

---

## 🔄 Student Learning Flow

A typical learning flow is:

```text
Register
   ↓
Email Verification
   ↓
Login
   ↓
Browse Courses
   ↓
View Course
   ↓
Enroll
   ↓
Access Lessons
   ↓
Watch Video
   ↓
Track Progress
   ↓
Generate Summary
   ↓
Complete Course
   ↓
Take Quiz
   ↓
Write Review
```

---

## 🧠 What I Built & Learned

This project was built to gain practical experience with full-stack application development.

It demonstrates experience with:

* Building REST APIs
* Designing relational databases
* Prisma ORM
* PostgreSQL
* Authentication
* Authorization
* JWT
* HTTP-only cookies
* Email verification
* Password hashing
* Request validation
* Rate limiting
* Security middleware
* Centralized error handling
* File upload workflows
* Private video storage
* Signed URLs
* React architecture
* API integration
* Admin dashboards
* AI API integration
* Learning progress tracking
* Database relationships

---

## 📌 Project Status

**Status: Portfolio Project / Active Development**

The core learning platform functionality has been implemented, including:

* Authentication
* Email verification
* Course management
* Category management
* Lesson management
* Enrollment
* Progress tracking
* Reviews
* Admin dashboard
* AI learning features
* Private video storage

The project is still open to further development and improvements.

---

## 🚧 Future Improvements

Possible future improvements include:

* Automated testing
* CI/CD
* Monitoring and observability
* Payment integration
* More advanced analytics
* Instructor-specific workflows
* Certificates
* Additional AI learning capabilities

These are **future plans, not currently implemented features**.

---

## 👨‍💻 Author

**Mohamad Feras Shaban**

Full-Stack Web Developer

GitHub:

`programerferas`

---

## 🎯 Project Goal

The goal of this project was to build a complete full-stack learning platform that combines:

```text
React
+
Node.js / Express
+
PostgreSQL
+
Prisma
+
Authentication
+
Security
+
Supabase Storage
+
Gemini AI
+
Admin Management
```

into one integrated application.

Rather than focusing only on basic CRUD functionality, the project was designed to solve real application problems involving authentication, authorization, protected content, database relationships, file storage, email verification, AI integration, and learning workflows.
