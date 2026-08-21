# Installation & Configuration Guide

This guide details the step-by-step setup instructions for configuring **DeepShield AI** with **MySQL 8** and **MySQL Workbench**.

## Prerequisites
1. **Node.js**: Version 20.x or higher
2. **MySQL 8.0**: Installed locally or accessible on `localhost:3306`
3. **MySQL Workbench**: Recommended GUI client for managing database schemas and executing custom SQL queries.

---

## 1. Database Setup in MySQL Workbench
1. Launch **MySQL Workbench**.
2. Create a new local connection pointing to `127.0.0.1:3306`.
3. Open a new SQL Query tab and execute:
```sql
CREATE DATABASE IF NOT EXISTS deepshield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Environment Variables (.env)
Update `.env` in the project root:
```env
DATABASE_URL="mysql://root:password@localhost:3306/deepshield"
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
JWT_SECRET="super-secret-jwt-key-deepshield-ai-enterprise-2026"
JWT_REFRESH_SECRET="super-secret-refresh-key-deepshield-ai-enterprise-2026"
```

---

## 3. Prisma ORM Migrations & Seeding
Run the following commands:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

This populates MySQL 8 with default organization records, default admin credentials, and sample detection history.
