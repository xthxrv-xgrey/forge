# 📧 otp-verification-express

> Production-ready backend boilerplates designed to eliminate setup time and accelerate real-world development — Node.js + Express + MongoDB

Extends JWT auth with a full email verification flow. New users are held in a temporary collection, verified via a 6-digit OTP sent to their inbox, then promoted to the main users collection — all with hashed OTPs, TTL-based expiry, and zero plain-text secrets stored.

---

## ✨ Features

- **Register** with username, email, and password validation
- **Email OTP Verification** — 6-digit OTP sent via Gmail, expires in 5 minutes
- **Unverified User Collection** — pending registrations stored separately, auto-deleted by MongoDB TTL
- **Hashed OTPs** — SHA-256 hashed before storing, raw OTP only ever lives in the email
- **Cryptographically Secure OTP** — generated with `crypto.randomInt`, not `Math.random`
- **No Double Hashing** — password hashed once in `UnverifiedUser`, safely transferred to `User`
- **Login** with username or email (identifier-based)
- **Logout** — revokes session server-side and clears cookie
- **Logout All** — revokes all sessions for the user server-side and clears cookie
- **Change Password** — authenticated route, invalidates all sessions on success
- **Forgot Password** — sends OTP to registered email, rate-limited to 1 request per minute
- **Reset Password** — verifies OTP and resets password, invalidates all sessions on success
- **Refresh Token Rotation** — new refresh token issued on every refresh, old one invalidated
- **Token Reuse Detection** — if a stolen/replayed token is detected, all sessions are immediately revoked
- **Session ID in Access Token** — `sessionId` embedded in JWT payload, enabling per-session middleware validation
- **Session Model** — every login creates a tracked session with IP and user agent
- **Hashed Refresh Tokens** — SHA-256 hashed before storing, raw token only ever lives in cookie
- **Secure Cookies** — `httpOnly`, `sameSite: strict`, production-aware `secure` flag
- **Clean Architecture** — controller / route / model / service / util separation
- **Global Error Handling** — `ApiError`, `ApiResponse`, `asyncHandler` utilities

---

## 🗂️ Project Structure

```
├── server.js
└── src/
    ├── app.js
    ├── config/
    │   └── config.js
    ├── db/
    │   └── db.js
    ├── controllers/
    │   └── auth.controller.js
    ├── routes/
    │   └── auth.routes.js
    ├── models/
    │   ├── user.model.js
    │   ├── unverifiedUser.model.js
    │   ├── resetPasswordUser.model.js
    │   └── session.model.js
    ├── services/
    │   └── email.service.js
    ├── middlewares/
    │   └── error.middleware.js
    └── utils/
        ├── ApiError.js
        ├── ApiResponse.js
        ├── asyncHandler.js
        └── hashToken.js
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/xthxrv-xgrey/forge.git
cd forge/otp-verification-express
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
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

GOOGLE_EMAIL_USER=your_gmail@gmail.com
GOOGLE_APP_PASSWORD=your_gmail_app_password
```

> **Gmail setup** — `GOOGLE_APP_PASSWORD` is not your Gmail password. Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) with 2FA enabled.

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

Creates an unverified user and sends a 6-digit OTP to the provided email. The pending record auto-deletes after **5 minutes** if not verified. Rate-limited to 1 request per minute per email.

**Request Body:**

```json
{
  "username": "test",
  "email": "test@gmail.com",
  "password": "test123"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "OTP sent successfully.",
  "data": null,
  "success": true
}
```

---

### `POST /api/v1/auth/verify-user`

Verifies the OTP and promotes the pending user to the main users collection. Issues access token and sets refresh token cookie.

**Request Body:**

```json
{
  "email": "test@gmail.com",
  "otp": "000000"
}
```

**Response:**

```json
{
  "statusCode": 201,
  "message": "User verified successfully.",
  "data": {
    "safeUser": {
      "_id": "...",
      "username": "test",
      "email": "test@gmail.com"
    },
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
  "identifier": "test",
  "password": "test123"
}
```

**Response:** Same shape as verify-user. Sets `refreshToken` cookie and creates a new session.

---

### `POST /api/v1/auth/logout`

Revokes the current session server-side and clears the cookie.

**Response:**

```json
{
  "statusCode": 200,
  "message": "Logged out successfully.",
  "data": null,
  "success": true
}
```

---

### `POST /api/v1/auth/logout-all`

Revokes all active sessions for the user.

**Response:**

```json
{
  "statusCode": 200,
  "message": "Logged out of all sessions successfully.",
  "data": null,
  "success": true
}
```

---

### `POST /api/v1/auth/change-password`

Changes the password for an authenticated user. Requires a valid access token in the `Authorization` header. Invalidates all active sessions on success.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "oldPassword": "test123",
  "newPassword": "newpass456"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Password changed successfully.",
  "data": null,
  "success": true
}
```

---

### `POST /api/v1/auth/forgot-password`

Looks up the user by username or email and sends a password reset OTP to their registered email. OTP expires in **5 minutes**. Rate-limited to 1 request per minute per email.

**Request Body:**

```json
{
  "identifier": "test"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "OTP sent successfully. Check your email.",
  "data": {
    "email": "test@gmail.com"
  },
  "success": true
}
```

---

### `POST /api/v1/auth/reset-password`

Verifies the reset OTP and sets a new password. Invalidates all active sessions on success.

**Request Body:**

```json
{
  "email": "test@gmail.com",
  "otp": "000000",
  "newPassword": "newpass456"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Password reset successfully.",
  "data": null,
  "success": true
}
```

---

### `POST /api/v1/auth/refresh`

Get a new access token using the refresh token cookie.

- Reads `refreshToken` from `httpOnly` cookie
- Verifies JWT signature
- Looks up session by SHA-256 hash
- **If no valid session found → all sessions for that user are revoked** (token reuse detected)
- Issues new access token with `sessionId` + rotates refresh token

**Response:**

```json
{
  "statusCode": 200,
  "message": "Tokens refreshed successfully.",
  "data": {
    "safeUser": { "..." },
    "accessToken": "<new_jwt>"
  },
  "success": true
}
```

---

## 🔒 Security Design

| Concern               | Approach                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Password storage      | `bcrypt` with salt rounds = 10, hashed in `UnverifiedUser`, safely transferred to `User` |
| OTP generation        | `crypto.randomInt` — cryptographically secure                                            |
| OTP storage           | SHA-256 hashed in DB, raw OTP only ever lives in the email                               |
| OTP expiry (register) | MongoDB TTL — `UnverifiedUser` doc auto-deleted after 5 minutes                          |
| OTP expiry (reset)    | MongoDB TTL — `ResetPasswordUser` doc auto-deleted after 5 minutes                       |
| OTP rate limiting     | 1 request per minute per email — enforced by checking `createdAt` diff                   |
| Password change       | Requires valid access token + correct old password, revokes all sessions                 |
| Password reset        | Requires valid OTP, revokes all sessions                                                 |
| Refresh token storage | SHA-256 hashed in DB, raw only in cookie                                                 |
| Refresh token reuse   | Rotation on every refresh — old session invalidated                                      |
| Token reuse detection | Invalid refresh token with no session → all user sessions revoked immediately            |
| Session ID in JWT     | `sessionId` embedded in access token payload for per-session middleware checks           |
| Cookie flags          | `httpOnly`, `sameSite: strict`, `secure` in production                                   |
| Token expiry          | Access: 15m short-lived / Refresh: 7d                                                    |
| Field exposure        | `password` has `select: false` on the user model                                         |
| Session tracking      | Every login stores IP + user agent for auditability                                      |

---

## 🔄 Auth Flows

**Registration & Verification**

```
POST /register
    → validate fields
    → check User collection (username + email must be free)
    → check UnverifiedUser (rate limit: reject if < 60s since last OTP)
    → delete stale UnverifiedUser if exists
    → generate crypto OTP → hash it → send email
    → create UnverifiedUser (TTL: 5 min)

POST /verify-user
    → find UnverifiedUser by email
        → not found = OTP expired or never created → reject
    → compare hashed OTP → mismatch → reject
    → create User (password hashed by pre-save hook)
    → delete UnverifiedUser
    → create Session → issue tokens
```

**Forgot & Reset Password**

```
POST /forgot-password
    → find user by username or email → not found → reject
    → check ResetPasswordUser (rate limit: reject if < 60s since last OTP)
    → delete stale ResetPasswordUser if exists
    → generate crypto OTP → hash it → send email
    → create ResetPasswordUser (TTL: 5 min)

POST /reset-password
    → find ResetPasswordUser by email
        → not found = OTP expired → reject
    → compare hashed OTP → mismatch → reject
    → validate new password
    → update User password → revoke all sessions → clear cookie
    → delete ResetPasswordUser
```

---

## 🛠️ Utilities

### `ApiError`

Throw structured errors anywhere:

```js
throw new ApiError(401, "Invalid OTP.");
```

### `ApiResponse`

Consistent response shape across all routes:

```js
res.status(200).json(new ApiResponse(200, "OTP sent successfully."));
```

### `asyncHandler`

Wraps async controllers — no try/catch boilerplate in every route:

```js
export const myController = asyncHandler(async (req, res) => {
  // errors are caught and forwarded automatically
});
```

### `hashToken`

SHA-256 hash utility used for OTPs and refresh tokens:

```js
import { hashToken } from "../utils/hashToken.js";
const hashed = hashToken(rawOtp);
```

---

## 📦 Tech Stack

- **Runtime** — Node.js
- **Framework** — Express v5
- **Database** — MongoDB + Mongoose
- **Auth** — JWT (`jsonwebtoken`) + `bcrypt`
- **Email** — Nodemailer (Gmail)
- **Cookies** — `cookie-parser`
- **Logging** — `morgan`
- **Config** — `dotenv`

---

## 🗺️ Boilerplate Roadmap

Part of the **[forge](../README.md)** boilerplate collection:

- [x] jwt-auth-express
- [x] **otp-verification-express** ← you are here
- [ ] google-oauth-express
- [ ] rbac-express

---

## 👤 Author

**Atharv Agrey** — [@xthxrv_xgrey](https://github.com/xthxrv-xgrey)

> Started backend on Day 1 with zero knowledge. These are the foundations I built along the way.
