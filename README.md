# 🎓 LMS Backend

A robust **Learning Management System** backend built with **Node.js**, **Express**, and **MongoDB**.

---

## 🚀 Live Deployment

| Platform | URL |
|----------|-----|
| 🟢 Render | https://lms-backend-o5p5.onrender.com/ |
| ▲ Vercel | https://project-t90rp.vercel.app/ |

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens) + Bcrypt
- **File Upload:** Multer + Cloudinary
- **Email:** Nodemailer (Gmail SMTP)
- **Deploy:** Render / Vercel

---

## 📁 Project Structure

```
lms-backend/
├── src/
│   ├── controllers/
│   │   ├── user.controller.js      # Auth, login, profile
│   │   ├── course.controller.js    # Course CRUD
│   │   ├── lecture.controller.js   # Lecture management
│   │   ├── progress.controller.js  # Student progress
│   │   ├── quiz.controller.js      # Quiz system
│   │   └── contact.controller.js   # Contact form
│   ├── models/                     # Mongoose schemas
│   ├── routes/                     # Express routes
│   ├── middleware/                  # Auth middleware
│   ├── utils/
│   │   ├── cloudinary.js           # Cloudinary upload
│   │   └── sendEmail.js            # Email utility ✉️
│   └── app.js
├── server.js
└── .env
```

---

## 📧 Email Notification System

Jab bhi koi user **login karta hai**, uske registered email pe ek **automatic notification email** bheji jaati hai.

### Email Features:
- 🎨 **Premium Dark Theme** HTML email design
- 👤 User ka **naam, email, role** show hota hai
- 🕐 **Login time** (IST timezone) display hota hai
- 🎭 **Role badge** — color coded (Admin 🔴 / Teacher 🟡 / Student 🟢)
- ⚠️ **Security warning** — agar login unauthorized ho

### Setup (Gmail App Password):

1. **Gmail 2-Step Verification ON karo:**
   - Jao → https://myaccount.google.com/security
   - "2-Step Verification" ON karo

2. **App Password banao:**
   - Jao → https://myaccount.google.com/apppasswords
   - App name: `LMS Backend` → **Create**
   - 16-character password milega

3. **`.env` mein add karo:**
   ```env
   EMAIL_USER=tumhari_gmail@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   ```
   > ⚠️ `EMAIL_PASS` mein spaces mat daalo

### Email Template Preview:

```
╔══════════════════════════════════╗
║         🎓 LMS Platform          ║  ← Dark Navy Header
║      LOGIN ACTIVITY ALERT        ║
╠══════════════════════════════════╣
║  🔐  New Login Detected!         ║  ← Purple Gradient Banner
╠══════════════════════════════════╣
║  Hey Bittu! 👋                   ║
║  ┌──────────┐  ┌──────────────┐  ║
║  │ 👤 Name  │  │ 🎓 Role      │  ║  ← Info Cards
║  │ Bittu    │  │ [Student]    │  ║
║  └──────────┘  └──────────────┘  ║
║  ┌──────────────────────────────┐ ║
║  │ 📧 Email: abc@gmail.com     │ ║
║  │ 🕐 Time: 21/07/2025, IST   │ ║
║  └──────────────────────────────┘ ║
║  ⚠️ Security Notice (Red Box)    ║
╠══════════════════════════════════╣
║      © 2025 LMS Platform  ● ● ●  ║  ← Footer
╚══════════════════════════════════╝
```

### sendEmail Utility (`src/utils/sendEmail.js`):

```js
const sendEmail = require("../utils/sendEmail");

await sendEmail({
  to: "user@example.com",
  subject: "Subject here",
  html: "<h1>Your HTML content</h1>",
});
```

---

## ⚙️ Environment Variables

```env
PORT=5000
FRONTEND_URL=your_frontend_url

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
```

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `admin` | Full access — manage users, courses |
| `teacher` | Create & manage own courses |
| `student` | Enroll & track course progress |

---

## 📡 Key API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login + sends email 📧 |
| POST | `/api/users/logout` | Logout (token blacklist) |
| GET | `/api/users/profile` | Get own profile |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all courses |
| POST | `/api/courses` | Create course (Teacher) |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |

---

## 🏃 Local Setup

```bash
# Clone the repo
git clone https://github.com/bittuurlwebwala/lms-backend.git
cd lms-backend

# Install dependencies
npm install

# Create .env file and fill values
cp .env.example .env

# Start dev server
npm run dev
```

---

## 📝 Scripts

```bash
npm run dev      # Start with nodemon (development)
npm start        # Start production server
npm run build    # Build (echo)
```
