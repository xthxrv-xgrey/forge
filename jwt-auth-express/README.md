# 🔐 jwt-auth-express

> Production-ready JWT authentication boilerplate — Node.js + Express + MongoDB

Handles the full auth lifecycle: register, login, logout, and silent token refresh. Refresh tokens are SHA-256 hashed, stored in a dedicated session collection, rotated on every use, and protected against reuse attacks.

---

## ✨ Features

- **Register** with username, email, and password validation
- **Login** with username or email (identifier-based)
- **Logout** — revokes session server-side and clears cookie
- **Refresh Token Rotation** — new refresh token issued on every refresh, old one invalidated
- **Token Reuse Detection** — if a stolen/replayed token is detected, all sessions for that user are immediately revoked
- **Session ID in Access Token** — `sessionId` embedded in JWT payload, enabling per-session middleware validation
- **Session Model** — every login creates a tracked session with IP and user agent
- **Hashed Refresh Tokens** — SHA-256 hashed before storing, raw token only ever lives in cookie
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
    │   ├── user.model.js
    │   └── session.model.js
    └── utils/
        ├── ApiError.util.js
        ├── ApiResponse.util.js
        ├── asyncHandler.util.js
        └── hashToken.util.js
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/xthxrv-xgrey/forge.git
cd forge/jwt-auth-express
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
  "password": "batman123"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "User registered successfully.",
  "data": {
    "safeUser": { "_id": "...", "username": "batman", "email": "batman@gmail.com" },
    "accessToken": "<jwt>"
  },
  "success": true
}
```

Sets `refreshToken` as an `httpOnly` cookie. Creates a session entry with IP and user agent.

---

### `POST /api/v1/auth/login`

Login with username or email.

**Request Body:**
```json
{
  "identifier": "batman",
  "password": "batman123"
}
```

**Response:** Same shape as register. Sets `refreshToken` cookie and creates a new session.

---

### `POST /api/v1/auth/logout`

Revokes the current session server-side and clears the cookie.

- Finds active session by hashed refresh token
- Sets `revoked: true` on that session
- Clears the `refreshToken` cookie

**Response:**
```json
{
  "statusCode": 200,
  "message": "Logged out successfully.",
  "success": true
}
```

---

### `POST /api/v1/auth/refresh`

Get a new access token using the refresh token cookie.

- Reads `refreshToken` from `httpOnly` cookie
- Verifies JWT signature
- Looks up session by SHA-256 hash, checks `revoked: false`
- **If no valid session found → all sessions for that user are revoked** (token reuse attack detected)
- Issues new access token with `sessionId` + rotates refresh token

**Response:**
```json
{
  "statusCode": 200,
  "message": "Tokens refreshed successfully.",
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
| Refresh token reuse | Rotation on every refresh — old session token invalidated |
| Token reuse detection | Invalid refresh token with no session → all user sessions revoked immediately |
| Session ID in JWT | `sessionId` embedded in access token payload for per-session middleware checks |
| Token revocation | Sessions have a `revoked` flag — stolen tokens can be invalidated server-side |
| Cookie flags | `httpOnly`, `sameSite: strict`, `secure` in production |
| Token expiry | Access: 15m short-lived / Refresh: 7d |
| Field exposure | `password` has `select: false` on the user model |
| Session tracking | Every login stores IP + user agent for auditability |

---

## 🛠️ Utilities

### `ApiError`
Throw structured errors anywhere:
```js
throw new ApiError(401, "Invalid credentials.");
```

### `ApiResponse`
Consistent response shape across all routes:
```js
res.status(200).json(new ApiResponse(200, "Success", data));
```

### `asyncHandler`
Wraps async controllers — no try/catch boilerplate in every route:
```js
export const myController = asyncHandler(async (req, res) => {
    // errors are caught and forwarded automatically
});
```

### `hashToken`
SHA-256 hash utility used for refresh tokens:
```js
import { hashToken } from "../utils/hashToken.util.js";
const hashed = hashToken(rawToken);
```

---

## 📦 Tech Stack

- **Runtime** — Node.js
- **Framework** — Express v5
- **Database** — MongoDB + Mongoose
- **Auth** — JWT (`jsonwebtoken`) + `bcrypt`
- **Cookies** — `cookie-parser`
- **Logging** — `morgan`
- **Config** — `dotenv`

---

## 🗺️ Boilerplate Roadmap

Part of the **[forge](../README.md)** boilerplate collection:

- [x] **jwt-auth-express** ← you are here
- [ ] google-oauth-express
- [ ] otp-verification-express
- [ ] rbac-express

---

## 👤 Author

**Atharv Agrey** — [@xthxrv_xgrey](https://github.com/xthxrv-xgrey)

> Built during the early days of learning backend development.
