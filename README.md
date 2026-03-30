# 🔨 Forge

> Production-ready boilerplates — clone, configure, and build.

A personal collection of starter codebases built to skip the setup and get straight to building. Each boilerplate is battle-tested, cleanly structured, and ready to drop into a real project.

---

## 📦 Boilerplates

### Authentication

| Name                                                     | Stack                       | Features                                                                                                                                    |
| -------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [`jwt-auth-express`](./jwt-auth-express)                 | Node.js + Express + MongoDB | Register, Login, Logout, Logout All, Refresh Token Rotation, Token Reuse Detection, Session Tracking, Hashed Refresh Tokens, Secure Cookies |
| [`otp-verification-express`](./otp-verification-express) | Node.js + Express + MongoDB | Email OTP, TTL-based Expiry, Hashed OTPs, Crypto-safe Generation, Full JWT Auth Flow                                                        |
| `google-oauth-express`                                   | Node.js + Express + MongoDB | Google OAuth 2.0, Passport.js — _coming soon_                                                                                               |
| `rbac-express`                                           | Node.js + Express + MongoDB | Role-Based Access Control, Protected Routes — _coming soon_                                                                                 |

---

## 🚀 How to Use

Every boilerplate follows the same pattern:

```bash
# 1. Clone the repo
git clone https://github.com/xthxrv-xgrey/forge.git

# 2. Navigate to the boilerplate you need
cd forge/jwt-auth-express

# 3. Install dependencies
npm install

# 4. Copy and fill env
cp .env.sample .env

# 5. Run
npm run dev
```

Each folder has its own `README.md` with full setup instructions and API docs.

---

## 🗺️ Roadmap

- [x] JWT Auth — register, login, logout, logout all, refresh token rotation
- [x] OTP Verification — email OTP, TTL expiry, hashed OTPs, full auth flow
- [ ] Google OAuth
- [ ] Role-Based Access Control (RBAC)
- [ ] File Upload (Cloudinary)
- [ ] Email Service (Nodemailer)
- [ ] Payment Integration (Razorpay/Stripe)

---

## 🛠️ Stack

All boilerplates are built on a consistent core stack:

- **Runtime** — Node.js
- **Framework** — Express v5
- **Database** — MongoDB + Mongoose
- **Auth** — JWT + bcrypt
- **Config** — dotenv
- **Logging** — morgan

---

## 👤 Author

**Atharv Agrey** — [@xthxrv_xgrey](https://github.com/xthxrv-xgrey)

> Started backend on Day 1 with zero knowledge. These are the foundations I built along the way.
