# ExamEase – Online Examination System

ExamEase is a full-stack, secure, student-friendly online examination and assessment web application. It features real-time server-controlled countdown timers, automatic grading for multiple-choice questions, role-based access control (Student, Teacher, Admin), and database resilience.

---

## 🌟 Key Features

### 🎓 Student Features
- **Registration & Secure Authentication:** Students register and log in with JWT sessions.
- **Available Examinations Catalog:** View scheduled exams, instructions, time duration, total marks, and passing criteria.
- **Exam Player with Live Countdown:** Server-synchronized timer with visual warnings when time is low (< 2 minutes).
- **Interactive Question Palette:** Color-coded navigation palette (Answered, Current, Skipped) for effortless jumping between questions.
- **Confirmation & Auto-Submission:** Receive an answer review confirmation modal before manual submission, or automatic submission when the deadline expires.
- **Instant Result & Explanations:** When permitted by instructor settings, students immediately review their score, percentage, pass/fail status, and question explanations.
- **Attempts History:** Track all previous attempts, dates, and historical scores.
- **Retake Safeguards:** Restricts duplicate attempts when retakes are disabled by the teacher.

### 🧑‍🏫 Teacher Features
- **Exam Authoring Suite:** Create, edit, publish, and delete multiple-choice examinations.
- **Question Builder:** Add 4-option multiple choice questions, set answer keys, per-question marks, and explanatory notes.
- **Flexible Parameters:** Configure duration in minutes, pass percentage, scheduling windows (start and end times), retake policies, and instant result release toggles.
- **Security & Answer Protection:** Master answer keys are never sent to students prior to submission.
- **Real-Time Submission Tracking:** Inspect student attempts, scores, and exam-wide pass rates and average scores.

### 🛡️ Administrator Features
- **System Metrics & Statistics:** Monitor total registered users (students, teachers, admins), published exams, attempt counts, overall pass rate, and average score.
- **User Management:** Search and filter users by role and status; activate or deactivate accounts; delete accounts (with self-protection).
- **Institution-Wide Auditing:** Review all examinations and examination results across the platform.

### ⚙️ Examination Engine & Security
- **Server-Controlled Timing:** Deadlines are calculated on the server from `startTime + durationMinutes` and clamped to `exam.endTime`.
- **Automatic Server-Side Grading:** Answers are graded strictly on the backend against the master answer key.
- **Persistent Storage:** MongoDB models with Mongoose validation, indexes, and timestamps.
- **Database Availability Enforcement:** If MongoDB is disconnected, API operations return HTTP 503 `DB_UNAVAILABLE` with clear diagnostic instructions rather than silently pretending that operations succeeded.

---

## 🏗️ Technology Stack

- **Frontend:** React (Vite), Modern responsive CSS (Inter font, clean blue & white theme, responsive for mobile & desktop)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT) & bcrypt password hashing
- **Environment:** dotenv for secrets and configuration

---

## 📁 Project Directory Structure

```
examease/
├── backend/
│   ├── .env                     # Local environment configuration
│   ├── .env.example             # Template for environment variables
│   ├── .gitignore
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # MongoDB connection & health check
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── attemptController.js
│   │   │   ├── authController.js
│   │   │   └── examController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification & account status
│   │   │   ├── dbCheck.js       # 503 DB unavailable protection
│   │   │   └── roles.js         # Role-based access control
│   │   ├── models/
│   │   │   ├── Exam.js
│   │   │   ├── ExamAttempt.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── attemptRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── examRoutes.js
│   │   │   └── healthRoutes.js
│   │   ├── scripts/
│   │   │   └── seed.js          # Database seeding script
│   │   └── server.js            # Express server entry point
│   └── tests/
│       └── run-tests.js         # Automated core engine test suite
├── frontend/
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── ConfirmModal.jsx
│       │   ├── DbAlertBanner.jsx
│       │   ├── Footer.jsx
│       │   └── Navbar.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── AdminDashboard.jsx
│       │   ├── ExamPlayerPage.jsx
│       │   ├── ExamResultPage.jsx
│       │   ├── HomePage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── StudentDashboard.jsx
│       │   └── TeacherDashboard.jsx
│       ├── services/
│       │   └── api.js
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── .gitignore
└── README.md
```

---

## 🚀 Setup & Installation Instructions (Windows CMD)

### Prerequisites
- **Node.js** (v18 or higher recommended; verified on Node v24)
- **MongoDB** (Local Community Server installed or a MongoDB Atlas cloud URI)

### Step 1: Clone or Navigate to the Project Folder
Open Windows Command Prompt (`cmd.exe`):
```cmd
cd /d C:\Users\yamun\.gemini\antigravity\scratch\examease
```

---

### Step 2: Configure & Start MongoDB

Ensure MongoDB is running locally on port `27017`:
```cmd
net start MongoDB
```
*Note: If you run MongoDB manually instead of a Windows service, run:*
```cmd
mongod --dbpath "C:\data\db"
```
*(Alternatively, you can paste your MongoDB Atlas cloud URI into `backend/.env` under `MONGODB_URI`)*.

---

### Step 3: Install Backend Dependencies & Seed Sample Data

1. Navigate to the `backend` folder:
```cmd
cd /d C:\Users\yamun\.gemini\antigravity\scratch\examease\backend
```

2. Review `backend/.env` (pre-created with local defaults):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/examease
JWT_SECRET=examease_jwt_secret_token_dev_994827361548
JWT_EXPIRES_IN=24h
ADMIN_BOOTSTRAP_SECRET=examease_admin_bootstrap_key_2026
```

3. Run the database seed script to populate sample accounts and a sample exam:
```cmd
npm run seed
```

---

### Step 4: Run the Automated Test Suite

To verify security rules, password hashing, timer calculations, exam grading, and sanitization:
```cmd
npm test
```
*Expected output: `ALL 32/32 TESTS PASSED SUCCESSFULLY!`*

---

### Step 5: Start the Backend Server

```cmd
npm start
```
The backend API server will listen at **`http://localhost:5000`**.  
Check health status at: **`http://localhost:5000/api/health`**

---

### Step 6: Start the Frontend Application

Open a **new** Windows Command Prompt window:
```cmd
cd /d C:\Users\yamun\.gemini\antigravity\scratch\examease\frontend
npm run dev
```
Open your browser and navigate to:
👉 **`http://localhost:5173`**

*(Note: The frontend is also pre-built inside `frontend/dist`. When you run the backend server with `npm start`, you can also open `http://localhost:5000` directly in your browser!)*

---

## 👥 Sample Credentials for Testing

The seed script creates three ready-to-test accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@examease.com` | `AdminPassword123!` | System stats, manage users, activate/deactivate accounts, view all exams and submissions |
| **Teacher** | `teacher@examease.com` | `TeacherPassword123!` | Create, edit, publish exams, define MCQs & marks, view student submissions & scores |
| **Student** | `student@examease.com` | `StudentPassword123!` | Take published exams, live countdown timer, auto/manual submission, view results |

*Tip: The Login page includes one-click demo prefill buttons to easily switch between roles.*

---

## 🛡️ Creating the First Administrator Account

To prevent unauthorized privilege escalation, the public registration form (`/api/auth/register`) strictly rejects the `admin` role.

To create the initial or additional administrator accounts securely:
1. **Using Seed Script:** Run `npm run seed` in the backend folder.
2. **Using Secure Bootstrap API:**
   Send a `POST` request to `http://localhost:5000/api/auth/bootstrap-admin` with the secret configured in `.env`:
   ```json
   {
     "name": "Super Admin",
     "email": "superadmin@examease.com",
     "password": "SecurePassword123!",
     "bootstrapSecret": "examease_admin_bootstrap_key_2026"
   }
   ```

---

## 🩺 Database Disconnection Behavior

In strict compliance with requirements:
- The system **never** silently falls back to temporary in-memory mocks when MongoDB is disconnected.
- If MongoDB is offline, any API call that requires database access returns **HTTP 503 `DB_UNAVAILABLE`** with explicit troubleshooting steps.
- The frontend displays a persistent, non-intrusive red banner at the top with a **"Check Connection Again"** button so users always know the exact operational status of their database.
