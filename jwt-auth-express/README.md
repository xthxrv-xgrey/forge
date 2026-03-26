# 🔐 JWT Auth Boilerplate — Node.js + Express + MongoDB

A production-ready authentication boilerplate with JWT access tokens, hashed refresh token rotation, and secure cookie handling.

---

## ✨ Features

- **Register** with username, email, password validation
- **Login** with username or email (identifier-based)
- **Refresh Token Rotation** — new refresh token issued on every refresh
- **Hashed Refresh Tokens** — SHA-256 hashed before storing in DB (never stored raw)
- **Secure Cookies** — `httpOnly`, `sameSite: strict`, production-aware `secure` flag
- **Clean Architecture** — controller / route / model / util separation
- **Global Error Handling** — `ApiError`, `ApiResponse`, `asyncHandler` utilities

---

## 🗂️ Project Structure

```
├── server.js
└── src/
    ├── app.js
    ├── db/
    │   └── db.js
    ├── controllers/
    │   └── auth.controller.js
    ├── routes/
    │   └── auth.routes.js
    ├── models/
    │   └── user.model.js
    └── utils/
        ├── ApiError.util.js
        ├── ApiResponse.util.js
        └── asyncHandler.util.js
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/jwt-auth-boilerplate.git
cd jwt-auth-boilerplate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.sample .env
```

Fill in your `.env`:

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/your-db-name

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
```

### 4. Run the server

```bash
# Development
npm run dev

# Production
npm start
```

---

## 📡 API Endpoints

### `POST /api/v1/auth/register`

Register a new user.

**Request Body:**
```json
{
  "username": "batman",
  "email": "batman@gmail.com",
  "password": "batmanHuMeHai"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "User registered successfully!",
  "data": {
    "safeUser": { "_id": "...", "username": "batman", "email": "batman@gmail.com" },
    "accessToken": "<jwt>"
  },
  "success": true
}
```

---

### `POST /api/v1/auth/login`

Login with username or email.

**Request Body:**
```json
{
  "identifier": "batman",
  "password": "batmanHuMeHai"
}
```

**Response:** Same shape as register. Sets `refreshToken` cookie.

---

### `POST /api/v1/auth/refresh`

Get a new access token using the refresh token cookie.

- Reads `refreshToken` from `httpOnly` cookie
- Verifies JWT signature
- Compares SHA-256 hash against stored token
- Issues new access token + rotates refresh token

**Response:**
```json
{
  "statusCode": 200,
  "message": "Tokens refreshed successfully!",
  "data": {
    "safeUser": { ... },
    "accessToken": "<new_jwt>"
  },
  "success": true
}
```

---

## 🔒 Security Design

| Concern | Approach |
|---|---|
| Password storage | `bcrypt` with salt rounds = 10 |
| Refresh token storage | SHA-256 hashed in DB, raw only in cookie |
| Refresh token reuse | Rotation on every refresh — old token invalidated |
| Cookie flags | `httpOnly`, `sameSite: strict`, `secure` in production |
| Token expiry | Access: 15m short-lived / Refresh: 7d |
| Field exposure | `password` and `refreshToken` have `select: false` |

---

## 🛠️ Utilities

### `ApiError`
Throw structured errors anywhere:
```js
throw new ApiError(400, "Invalid credentials");
```

### `ApiResponse`
Consistent response shape:
```js
res.status(200).json(new ApiResponse(200, "Success", data));
```

### `asyncHandler`
Wraps async controllers — no try/catch needed in every route:
```js
export const myController = asyncHandler(async (req, res) => {
  // errors auto-caught
});
```

---

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express v5
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (`jsonwebtoken`) + `bcrypt`
- **Cookies:** `cookie-parser`
- **Logging:** `morgan`
- **Config:** `dotenv`

---

## 🗺️ Boilerplate Roadmap

This is part of a personal boilerplate collection:

- [x] **JWT Auth** ← you are here
- [ ] Google OAuth (Passport.js)
- [ ] OTP Verification (Email/SMS)
- [ ] Role-Based Access Control (RBAC)

---

## 👤 Author

**Atharv Agrey** — [@xthxrv_xgrey](https://github.com/xthxrv-xgrey)

> Built as a learning project on Day 7 of backend development.
