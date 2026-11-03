# IT-Asset-Management
# IT Asset & Maintenance Management System

A web-based application for managing IT assets and maintenance requests within an organization. This project was developed as a personal portfolio project to implement asset management, maintenance workflows, role-based access control, and REST API integration.

## Features

### Authentication & Authorization
- User registration and login.
- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control for ADMIN and USER roles.
- Protected routes and API endpoints.

### IT Asset Management
- View and manage IT assets.
- Create, update, and delete asset records (Admin only).
- Track asset information, including:
  - Asset Code
  - Asset Name
  - Category
  - Brand
  - Serial Number
  - Location
  - Assigned User (PIC)
  - Department
  - Asset Status
- Manage asset statuses:
  - ACTIVE
  - MAINTENANCE
  - RETIRED

### Maintenance Management
- Create maintenance requests.
- Admin approval workflow for user maintenance requests.
- Manage maintenance ticket statuses:
  - PENDING
  - APPROVED
  - REJECTED
  - IN_PROGRESS
  - COMPLETED
- View maintenance ticket history.
- Automatically approve maintenance tickets created by Admin.

### Dashboard
- Display asset statistics.
- Monitor asset statuses.
- Track maintenance ticket statistics based on their statuses.

## User Roles

| Role | Permissions |
|---|---|
| ADMIN | Manage assets, manage maintenance tickets, approve or reject requests, and access administrative features. |
| USER | View assets and create maintenance requests. |

## Technologies Used

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt

## Project Structure

```text
IT-ASSET-MANAGEMENT/
├── it-asset-backend/
│   ├── prisma/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── ...
│   ├── package.json
│   └── .env
│
├── IT-ASSET-FRONTEND/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── ...
│   ├── package.json
│   └── .env
│
└── README.md
```

## Installation & Setup

### Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Navigate to the project directory:

```bash
cd IT-ASSET-MANAGEMENT
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd it-asset-backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET=your_secret_key
```

Configure the environment variables according to your local PostgreSQL database and backend configuration.

Generate the Prisma Client:

```bash
npx prisma generate
```

Start the backend server:

```bash
npm run dev
```

The backend API will run on the configured port.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd IT-ASSET-FRONTEND
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Adjust the API URL according to your backend configuration.

Start the frontend development server:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API status |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get authenticated user |
| GET | `/api/assets` | Retrieve assets |
| POST | `/api/assets` | Create an asset |
| GET | `/api/maintenance/history` | Retrieve maintenance history |

Additional endpoints are available for asset management, maintenance tickets, departments, and dashboard statistics.

## Security

- JWT authentication for protected endpoints.
- Password hashing using bcrypt.
- Role-based authorization.
- Environment variables for sensitive configuration.
- Input validation and error handling.

## Project Status

This project is currently under development. Additional features and improvements may be implemented in future updates.

## Disclaimer

This project was developed for personal learning and portfolio purposes. It is not intended to be used as a production system without further security review, testing, and deployment configuration.

## Author

**Dhanu Satria Atmaja**

Computer Engineering Graduate  
Universitas Diponegoro

