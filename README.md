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
* Take course quizzes
* Ask questions through the AI assistant
* Write course reviews
* Rate courses
* View notifications
* Manage their profile

---

### 🤖 AI Features

The platform integrates **Google Gemini** to provide AI-powered learning functionality.

Current AI features include:

* Lesson summaries
* Quiz generation
* AI learning assistant (Under development)

AI requests are handled by the backend so that API credentials are not exposed to the frontend.

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
* Platform statistics
* Login statistics

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

The system includes an instructor role for course/content ownership.

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
```

API responses use a consistent structure.

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Something went wrong",
  "code": "ERROR_CODE"
}
```

The backend uses centralized error handling through application errors.

---

## 🎨 Frontend

The frontend is built with React.

Main application pages include:

```text
Home
Courses
Course Details
Login
Register
Dashboard
Lesson
Profile
Admin Dashboard
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
│   ├── components/
│   ├── pages/
│   ├── api/
│   ├── context/
│   └── ...
│
└── backend/
    ├── controllers/
    ├── services/
    ├── routes/
    ├── middleware/
    ├── schemas/
    ├── lib/
    └── ...
    
prisma/
├── schema.prisma
└── migrations/

.env.example
package.json
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

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file based on `.env.example`.

Required environment variables depend on the configured services, including:

```env
DATABASE_URL=
JWT_SECRET=

FRONTEND_URLS=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=
```

**Never commit your real `.env` file or secret keys to GitHub.**

---

## 🗃️ Database Setup

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

If the project contains seed data:

```bash
npm run seed
```

---

## ▶️ Running the Project

Run the development environment using the scripts defined in `package.json`.

Example:

```bash
npm run dev
```

If frontend and backend are configured as separate applications, run their respective development commands.

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
