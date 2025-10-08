# 📝 To-Do-List

A powerful and secure task management system that allows users to manage their personal tasks and collaborate through teams efficiently.

## 🚀 Overview

The **To-Do-List** application enables users to **create**, **update**, **delete**, and **read** their personal tasks privately.  
Additionally, it supports **team collaboration**, where users can create teams, assign tasks, and manage members — with clear role-based permissions between **owners** and **members**.

---

## 🔧 Features

### 👤 User Features

- Create, update, delete, and view personal tasks privately.
- Email verification for new sign-ups.
- Google OAuth login integration.

### 👥 Team Features

- Create teams and invite members.
- Owners can:
  - Create, update, and delete tasks.
  - Add or remove members.
  - Delete the entire team.
  - Transfer ownership to another member.
- Members can:
  - Change the status of tasks (`Pending`, `In Progress`, `Done`).

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Frontend:** HTML, CSS, JavaScript
- **Authentication:** JWT, Email Verification, Google OAuth
- **Email Service:** Brevo (via API Key)

---

## ⚙️ Installation & Setup

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd TO-DO-LIST/backend
npm install
```

Run the application:

```bash
npm start
```

---

## 🔐 Environment Variables

Before running the project, create a `.env` file in the root directory and include the following variables:

```env
NODE_ENV=development
DATABASE_URL=your_postgres_connection_url
PORT=3000
CLIENT_URL=http://localhost:3000
BREVO_API_KEY=your_brevo_api_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
SESSION_EXPIRES=3600000
GOOGLE_CLIENT_ID=your_google_client_id
EMAIL_FROM=your_email@example.com
```

---

## 📂 Project Structure

```
TO-DO-LIST/
├── backend/
│   ├── controllers/
│   ├── prisma/
│   ├── public/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│    ├── Dashboard/
│    ├── forgetPassword/
│    ├── login_v1/
│    └── index.js
│
│
└── README.md
```

---

---

## Developed by

**Ameen Saad**
