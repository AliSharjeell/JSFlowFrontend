# Banking API Backend

A comprehensive RESTful API for a banking application built with FastAPI, featuring JWT authentication, account management, transactions, and transfers.

## Features

- 🔐 **JWT Authentication** - Secure access and refresh token system
- 👤 **User Management** - Registration, login, profile management
- 🏦 **Account Management** - Create, view, activate/deactivate accounts
- 💰 **Transactions** - Deposits, withdrawals with transaction history
- 💸 **Transfers** - Money transfers between accounts
- ⚡ **Rate Limiting** - Protection against API abuse
- 🛡️ **Security** - CORS, security headers, password hashing
- 📊 **Logging** - Comprehensive request/response logging
- 🗄️ **Database** - PostgreSQL with SQLAlchemy ORM

## Tech Stack

- **Framework**: FastAPI 0.109.2
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0.25
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)
- **Rate Limiting**: SlowAPI
- **Validation**: Pydantic v2

## Project Structure

```
.
├── main.py                 # Application entry point
├── config.py              # Configuration settings
├── database.py            # Database connection & session
├── models.py              # SQLAlchemy models
├── schemas.py             # Pydantic schemas
├── auth.py                # Authentication utilities
├── dependencies.py        # Reusable dependencies
├── middleware.py          # Custom middlewares
├── routers/
│   ├── auth.py           # Authentication endpoints
│   ├── accounts.py       # Account management endpoints
│   ├── transactions.py   # Transaction endpoints
│   └── transfers.py      # Transfer endpoints
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Installation

### Prerequisites

- Python 3.10+
- Neon DB account (cloud PostgreSQL) - or any PostgreSQL database
- pip

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ProcomHackathon26_backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your Neon DB connection string:
   ```env
   DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/banking_db?sslmode=require
   SECRET_KEY=your-secret-key-here-change-this-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   CORS_ORIGINS=["http://localhost:3000"]
   RATE_LIMIT_PER_MINUTE=60
   ```

5. **Initialize database**
   ```bash
   # Database tables will be created automatically on first run
   # Or manually initialize:
   python init_db.py init
   
   # Or using PostgreSQL client
   psql -U postgres
   CREATE DATABASE banking_db;
   ```

6. **Run the application**
   ```bash
   python main.py
   
   # Or with uvicorn directly
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/logout` - Logout user

### Accounts
- `POST /api/v1/accounts` - Create new account
- `GET /api/v1/accounts` - Get all user accounts
- `GET /api/v1/accounts/{account_number}` - Get account details
- `GET /api/v1/accounts/{account_number}/balance` - Get account balance
- `PATCH /api/v1/accounts/{account_number}/activate` - Activate account
- `PATCH /api/v1/accounts/{account_number}/deactivate` - Deactivate account
- `DELETE /api/v1/accounts/{account_number}` - Delete account

### Transactions
- `POST /api/v1/transactions/deposit` - Deposit money
- `POST /api/v1/transactions/withdraw` - Withdraw money
- `GET /api/v1/transactions` - Get transaction history
- `GET /api/v1/transactions/{transaction_id}` - Get transaction details
- `GET /api/v1/transactions/account/{account_number}/history` - Get account transaction history

### Transfers
- `POST /api/v1/transfers` - Transfer money between accounts
- `POST /api/v1/transfers/internal` - Transfer between own accounts
- `GET /api/v1/transfers/pending` - Get pending transfers
- `POST /api/v1/transfers/{transaction_id}/cancel` - Cancel pending transfer

## Usage Examples

### Register a User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123",
    "full_name": "John Doe",
    "phone_number": "+1234567890"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePass123"
  }'
```

### Create Account
```bash
curl -X POST "http://localhost:8000/api/v1/accounts" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "account_type": "savings",
    "currency": "USD"
  }'
```

### Deposit Money
```bash
curl -X POST "http://localhost:8000/api/v1/transactions/deposit" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": "1234567890",
    "amount": 1000.00,
    "description": "Initial deposit"
  }'
```

### Transfer Money
```bash
curl -X POST "http://localhost:8000/api/v1/transfers" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_account_number": "1234567890",
    "to_account_number": "0987654321",
    "amount": 500.00,
    "description": "Payment"
  }'
```

## Security Features

- **Password Hashing**: bcrypt algorithm
- **JWT Tokens**: Secure access and refresh tokens
- **Rate Limiting**: 60 requests per minute (configurable)
- **CORS**: Configurable allowed origins
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, etc.
- **Input Validation**: Pydantic schemas
- **SQL Injection Protection**: SQLAlchemy ORM

## Database Models

- **User**: User accounts with authentication
- **Account**: Bank accounts (savings, checking, business)
- **Transaction**: All financial transactions
- **LoginHistory**: User login tracking

## Configuration

All configuration is managed through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | Required |
| SECRET_KEY | JWT signing key | Required |
| ALGORITHM | JWT algorithm | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Access token validity | 30 |
| REFRESH_TOKEN_EXPIRE_DAYS | Refresh token validity | 7 |
| CORS_ORIGINS | Allowed CORS origins | [] |
| RATE_LIMIT_PER_MINUTE | API rate limit | 60 |

## Development

### Run with auto-reload
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Run tests (if tests are added)
```bash
pytest
```

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

All errors return JSON:
```json
{
  "detail": "Error message",
  "success": false
}
```

## Limitations & Business Rules

- **Accounts**: Maximum 5 accounts per user
- **Deposits**: Maximum 1,000,000 per transaction
- **Withdrawals**: Maximum 100,000 per transaction
- **Transfers**: Maximum 500,000 per transaction
- **Currency**: No currency conversion (accounts must match)
- **Account Deletion**: Only accounts with zero balance can be deleted