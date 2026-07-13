<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

<h1 align="center">Inventory Management System API</h1>

<p align="center">
  A scalable and secure REST API for an <strong>Inventory Management System</strong><br />
  built with <strong>NestJS 11</strong>, <strong>Prisma ORM</strong>, and <strong>MySQL</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/Node.js-v22+-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Fastify-v5-000000?logo=fastify&logoColor=white" alt="Fastify">
  <img src="https://img.shields.io/badge/TypeScript-v5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-UNLICENSED-red.svg" alt="License">
</p>

---

# 📋 Prerequisites

Before getting started, make sure you have the following installed:

- **Node.js 22.x or later**
- **npm 10.x or later**
- **MySQL 8.0 or later**
- **Git**

---

## 📦 Installation

Clone the repository and install dependencies.

```bash
git clone <repository_url>
cd <project_directory>
npm install
```

---

## ⚙️ Environment Configuration

This project uses separate environment files for development and production.

Create the following files in the project root:

- `.development.env`
- `.production.env`

### Development Environment (`.development.env`)

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=inventory_management

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRATION=1d

JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRATION=7d

SWAGGER_ENABLED=true
SWAGGER_URL=http://localhost:6000
SWAGGER_PATH=/swagger

FRONTEND_URL=http://localhost:3000

PORT=6000
NODE_ENV=development

THROTTLE_TTL=60
THROTTLE_LIMIT=10
THROTTLE_BLOCK_DURATION=60
```

### Production Environment (`.production.env`)

```env
DATABASE_HOST=your_database_host
DATABASE_PORT=3306
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=your_database_name

JWT_ACCESS_SECRET=your_production_access_secret
JWT_ACCESS_EXPIRATION=1d

JWT_REFRESH_SECRET=your_production_refresh_secret
JWT_REFRESH_EXPIRATION=7d

SWAGGER_ENABLED=false
SWAGGER_URL=https://api.example.com
SWAGGER_PATH=/swagger

FRONTEND_URL=https://your-frontend-domain.com

PORT=6000
NODE_ENV=production

THROTTLE_TTL=60
THROTTLE_LIMIT=10
THROTTLE_BLOCK_DURATION=60
```

> **Note:** Replace all placeholder values with your actual configuration before running the application.

---

# Database Setup

After installing the project, complete the following steps in order.

## 1. Run Prisma Migrations

For local development:

```bash
npx prisma migrate dev
```

For production:

```bash
npx prisma migrate deploy
```

## 2. Seed the Database

Run the following command to populate the database with the initial data.

```bash
npx prisma db seed
```

---

# Default Administrator Account

After the seed process completes successfully, you can log in using the following credentials.

**Email**

```text
admin@gmail.com
```

**Password**

```text
asdfg1234
```

> ⚠️ **Security Notice**
>
> The default administrator password should be changed immediately after your first login.

Navigate to:

```text
<base_url>/admin/privacy
```

Example:

```text
http://localhost:3000/admin/privacy
```

---

# Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

---

# Running Tests

Unit tests

```bash
npm run test
```

End-to-end tests

```bash
npm run test:e2e
```

Test coverage

```bash
npm run test:cov
```

---

# API Documentation

Once the server is running, the Swagger documentation is available at:

Navigate To:

```text
<base_url>/api
```

Example:

```text
http://localhost:5000/api
```

---

# License

This project is licensed under the MIT License.
