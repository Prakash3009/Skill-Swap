# Authentication Implementation Guide

## ✅ Authentication Added Successfully!

JWT-based authentication has been implemented for the SkillSwap application.

---

## 🔐 What Was Implemented

### 1. **Backend Components**

#### **Updated User Model** (`server/models/User.js`)
- Added `password` field (required, min 6 characters)
- Password is excluded from queries by default (`select: false`)

```javascript
password: {
  type: String,
  required: true,
  minlength: 6,
  select: false // Don't return password in queries
}
```

#### **Auth Middleware** (`server/middleware/auth.js`)
- Verifies JWT tokens from Authorization header
- Extracts userId and attaches to `req.userId`
- Handles token expiration and invalid tokens

```javascript
// Usage in routes:
const { authMiddleware } = require('../middleware/auth');
router.get('/protected-route', authMiddleware, async (req, res) => {
  // req.userId is available here
});
```

#### **Auth Routes** (`server/routes/authRoutes.js`)

**POST /api/auth/register**
- Inputs: name, email, password, bio (optional)
- Validates email format and password length
- Hashes password using bcryptjs (10 salt rounds)
- Prevents duplicate email registration
- Creates user with 10 default coins
- Returns JWT token + user info

**POST /api/auth/login**
- Inputs: email, password
- Finds user and compares password using bcryptjs
- Generates JWT token (expires in 7 days)
- Returns token + user info

**GET /api/auth/me** (Protected)
- Requires authentication
- Returns current user's profile with skills

---

### 2. **Frontend Components**

#### **Login Page** (`client/login.html`)
- Email and password form
- Calls `/api/auth/login`
- Stores token in localStorage
- Redirects to profile on success

#### **Register Page** (`client/register.html`)
- Name, email, password, bio form
- Calls `/api/auth/register`
- Stores token in localStorage
- Shows welcome bonus message (10 coins)
- Redirects to profile on success

#### **Updated Utilities** (`client/js/main.js`)
- `getAuthToken()` - Get JWT token from localStorage
- `isLoggedIn()` - Check if user is authenticated
- `logout()` - Clear session and redirect to login
- `authenticatedFetch()` - Make authenticated API calls

---

## 📝 API Endpoints

### **Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "bio": "I love learning!" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "coins": 10
  }
}
```

### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "coins": 15
  }
}
```

### **Get Current User** (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "I love learning!",
    "coins": 15,
    "skillsOffered": [...],
    "skillsWanted": [...]
  }
}
```

---

## 🔒 How to Use Authentication

### **Frontend - Making Authenticated Requests**

#### **Example 1: Using authenticatedFetch()**
```javascript
// Get current user profile
const response = await authenticatedFetch('http://localhost:3000/api/auth/me');
const result = await response.json();

if (result.success) {
  console.log('User:', result.data);
}
```

#### **Example 2: Manual Authorization Header**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

#### **Example 3: Login Flow**
```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const result = await response.json();

if (result.success) {
  // Save token
  localStorage.setItem('token', result.data.token);
  localStorage.setItem('userId', result.data.userId);
  
  // Redirect to dashboard
  window.location.href = 'profile.html';
}
```

#### **Example 4: Logout**
```javascript
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  window.location.href = 'login.html';
}
```

---

### **Backend - Protecting Routes**

#### **Example 1: Protect a Single Route**
```javascript
const { authMiddleware } = require('../middleware/auth');

router.get('/protected', authMiddleware, async (req, res) => {
  // req.userId is available here
  const userId = req.userId;
  
  res.json({
    success: true,
    message: `Hello user ${userId}`
  });
});
```

#### **Example 2: Protect All Routes in a File**
```javascript
const { authMiddleware } = require('../middleware/auth');

// Apply to all routes
router.use(authMiddleware);

router.get('/profile', async (req, res) => {
  // All routes here are protected
  const user = await User.findById(req.userId);
  res.json({ success: true, data: user });
});
```

#### **Example 3: Mixed Protected/Public Routes**
```javascript
// Public route
router.get('/public', async (req, res) => {
  res.json({ message: 'This is public' });
});

// Protected route
router.get('/private', authMiddleware, async (req, res) => {
  res.json({ message: 'This is private', userId: req.userId });
});
```

---

## 🔧 Security Features

### **Password Hashing**
- Uses bcryptjs with 10 salt rounds
- Passwords are never stored in plain text
- Secure comparison using `bcrypt.compare()`

### **JWT Tokens**
- Tokens expire in 7 days
- Signed with secret key
- Contains only userId (no sensitive data)
- Verified on every protected request

### **Validation**
- Email format validation
- Password minimum length (6 characters)
- Duplicate email prevention
- Required field validation

---

## 📦 Dependencies Added

```json
{
  "bcryptjs": "^2.4.3",      // Password hashing
  "jsonwebtoken": "^9.0.0"   // JWT token generation
}
```

---

## 🚀 Installation & Setup

### **1. Install New Dependencies**
```bash
npm install
```

### **2. Restart Server**
```bash
npm start
```

### **3. Test Authentication**

**Register:**
- Visit: http://localhost:3000/register.html
- Create account with email and password

**Login:**
- Visit: http://localhost:3000/login.html
- Login with your credentials

---

## 🎯 Example: Complete Authentication Flow

### **1. User Registration**
```javascript
// Frontend: register.html
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'secure123',
    bio: 'Web developer'
  })
});

const result = await response.json();
// Save token: localStorage.setItem('token', result.data.token);
```

### **2. User Login**
```javascript
// Frontend: login.html
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'alice@example.com',
    password: 'secure123'
  })
});

const result = await response.json();
// Save token: localStorage.setItem('token', result.data.token);
```

### **3. Access Protected Route**
```javascript
// Frontend: profile.html
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
// Display user profile
```

---

## ⚠️ Important Notes

1. **JWT Secret**: Currently hardcoded as `skillswap_secret_key_2024`
   - In production, use environment variable: `process.env.JWT_SECRET`

2. **Token Storage**: Tokens stored in localStorage
   - Consider httpOnly cookies for production

3. **Password Reset**: Not implemented (MVP only)

4. **Email Verification**: Not implemented (MVP only)

5. **Token Expiration**: Set to 7 days
   - Adjust in `authRoutes.js` if needed

---

## 🔍 Error Handling

### **Common Errors**

**401 Unauthorized**
```json
{
  "success": false,
  "message": "No token provided. Authorization denied."
}
```

**400 Bad Request**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Invalid Token**
```json
{
  "success": false,
  "message": "Invalid token. Authorization denied."
}
```

**Token Expired**
```json
{
  "success": false,
  "message": "Token expired. Please login again."
}
```

---

## ✅ Testing Checklist

- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Register with duplicate email (should fail)
- [ ] Access protected route with valid token
- [ ] Access protected route without token (should fail)
- [ ] Token persists after page reload
- [ ] Logout clears token

---

## 🎉 Summary

Authentication is now fully functional with:
- ✅ Secure password hashing (bcryptjs)
- ✅ JWT token generation and verification
- ✅ Protected routes using middleware
- ✅ Login and registration pages
- ✅ Token management utilities
- ✅ Error handling and validation

**Ready for hackathon demos!** 🚀
