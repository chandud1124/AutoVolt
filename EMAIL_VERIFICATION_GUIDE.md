# Email Verification System - Complete Guide

## 📧 Overview
AutoVolt now includes a robust email verification system that validates user email addresses during registration. This prevents fake registrations and ensures only legitimate users can access the platform after admin approval.

## ✨ Features Implemented

### Backend Components
- **User Model Updates** (`backend/models/User.js`)
  - `emailVerified`: Boolean flag (default: false)
  - `emailVerificationToken`: Hashed token storage
  - `emailVerificationExpires`: 24-hour expiration timestamp
  - Index on verification token for fast lookups

- **Email Service** (`backend/services/emailService.js`)
  - `sendEmailVerification()`: Sends verification emails with HTML templates
  - Professional gradient design with AutoVolt branding
  - Includes user name, verification link, and 24-hour expiry notice
  - Fallback to console logging in development mode

- **Authentication Controller** (`backend/controllers/authController.js`)
  - `register()`: Generates crypto token, sends verification email
  - `verifyEmail()`: Validates token, marks email verified, notifies admins
  - `resendVerificationEmail()`: Generates new token and resends email

- **API Routes** (`backend/routes/auth.js`)
  - `GET /api/auth/verify-email/:token`: Verify email with token
  - `POST /api/auth/resend-verification`: Resend verification email

### Frontend Components
- **API Methods** (`src/services/api.ts`)
  - `verifyEmail(token)`: Calls backend verification endpoint
  - `resendVerification(email)`: Requests new verification email

- **Verification Page** (`src/pages/VerifyEmail.tsx`)
  - Automatic token extraction from URL
  - Loading state with spinner animation
  - Success confirmation with checkmark
  - Error handling with resend option
  - Navigation to login/resend pages

- **Resend Page** (`src/pages/ResendVerification.tsx`)
  - Email input form with validation
  - Success confirmation screen
  - Loading states for better UX
  - Links to login and back to verification

- **Registration Update** (`src/pages/Register.tsx`)
  - Updated success message mentions email verification
  - Extended toast duration to 10 seconds
  - Redirects to login after 6 seconds

## 🔄 User Flow

### 1. Registration Process
```
User fills registration form 
  → Submits credentials
  → Backend creates user with emailVerified=false
  → Generates secure token (crypto.randomBytes + SHA-256)
  → Sends verification email
  → Shows success message: "Please check your email to verify your account"
```

### 2. Email Verification
```
User receives email
  → Clicks verification link
  → Redirected to /verify-email/:token
  → Frontend calls API with token
  → Backend validates token & expiration
  → Marks emailVerified=true
  → Notifies admins via email
  → Shows success message
```

### 3. Resend Verification
```
User doesn't receive email OR token expires
  → Visits /resend-verification
  → Enters registered email
  → Backend generates new token
  → Sends new verification email
  → Shows confirmation message
```

### 4. Admin Approval
```
User verifies email
  → Account still has isApproved=false, isActive=false
  → Admin receives notification
  → Admin reviews in Users management
  → Admin approves account
  → User can now login
```

## 🧪 Testing Guide

### Prerequisites
1. **Configure Email Credentials** (backend/.env):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=AutoVolt <noreply@autovolt.com>
```

2. **Gmail App Password Setup**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Generate new app password for "Mail"
   - Copy 16-character password to SMTP_PASS

### Test Scenario 1: Successful Registration & Verification
```bash
# 1. Start backend server
cd backend
npm run dev

# 2. Start frontend (separate terminal)
npm run dev

# 3. Register new user
- Navigate to http://localhost:5173/register
- Fill all required fields
- Use valid email address you can access
- Submit registration

# 4. Check email
- Check inbox for "Verify Your AutoVolt Account" email
- Click "Verify My Email" button
- Should redirect to success page

# 5. Verify database
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const user = await User.findOne({ email: 'test@example.com' });
  console.log('Email Verified:', user.emailVerified);
  process.exit(0);
});
"
```

### Test Scenario 2: Token Expiration
```bash
# 1. Register user
- Complete registration process
- Don't click verification link

# 2. Manually expire token in database
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  await User.updateOne(
    { email: 'test@example.com' },
    { emailVerificationExpires: new Date(Date.now() - 1000) }
  );
  console.log('Token expired');
  process.exit(0);
});
"

# 3. Try to verify with expired token
- Click verification link
- Should show "Token has expired" error
- Click "Resend Verification Email"
- Enter email and submit
- Check inbox for new verification email
```

### Test Scenario 3: Resend Verification
```bash
# 1. Register user and wait for email

# 2. Navigate to resend page
- Go to http://localhost:5173/resend-verification
- Or click "Resend Verification Email" from expired token page

# 3. Enter registered email
- Type email address used during registration
- Click "Send Verification Email"
- Should show success message with sent email

# 4. Check inbox
- New verification email should arrive
- Old token is invalidated
- New token has fresh 24-hour expiration
```

### Test Scenario 4: Already Verified User
```bash
# 1. Complete verification for a user

# 2. Try to verify again
- Click same verification link
- Should show "Email already verified" message
- User can proceed to login
```

### Test Scenario 5: Invalid Token
```bash
# 1. Try random token
- Navigate to http://localhost:5173/verify-email/invalid-token-xyz
- Should show "Invalid or expired token" error

# 2. Try missing token
- Navigate to http://localhost:5173/verify-email/
- Should redirect or show error
```

### Test Scenario 6: Admin Notification
```bash
# 1. Verify user email

# 2. Check admin inbox
- Email should be sent to admins
- Subject: "New User Verified - Awaiting Approval"
- Contains user details (name, email, role)

# 3. Admin dashboard
- Login as admin
- Navigate to Users management
- Check for email verified indicator (if implemented)
```

## 🔒 Security Features

### Token Generation
- Uses `crypto.randomBytes(32)` for cryptographically secure tokens
- SHA-256 hashing before database storage
- Prevents token exposure in database breaches

### Token Expiration
- 24-hour validity period
- Automatic expiration check on verification
- Old tokens invalidated on resend

### Email Validation
- RFC 5322 compliant email validation
- Domain verification with regex
- Duplicate email prevention

### Rate Limiting
- Implement rate limiting on resend endpoint (recommended)
- Prevent email spam attacks
- Consider adding CAPTCHA for production

## 🎨 Email Template Customization

The verification email uses a professional HTML template in `backend/services/emailService.js`:

```javascript
// Customize colors
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Customize button
background-color: #667eea;
border-radius: 6px;

// Customize footer
contact email, social links, legal text
```

## 🐛 Troubleshooting

### Email Not Sending
**Symptom**: No email received after registration
**Solutions**:
1. Check SMTP credentials in backend/.env
2. Verify Gmail App Password is correct
3. Check backend console for email service logs
4. Enable "Less secure app access" (if not using App Password)
5. Check spam folder

### Token Invalid Error
**Symptom**: "Invalid or expired token" when clicking link
**Solutions**:
1. Check token hasn't expired (24 hours)
2. Verify token wasn't already used
3. Try resending verification email
4. Check database for emailVerificationToken field

### Frontend Not Showing Verification Pages
**Symptom**: 404 error on /verify-email/:token
**Solutions**:
1. Verify routes added to src/App.tsx
2. Check lazy imports are correct
3. Run `npm run build` to check compilation
4. Clear browser cache and reload

### Database Connection Issues
**Symptom**: Registration fails silently
**Solutions**:
1. Check MongoDB is running
2. Verify MONGODB_URI in backend/.env
3. Check database indexes are created
4. Review backend console logs

## 📊 Database Queries for Testing

### Check User Verification Status
```javascript
// Find unverified users
db.users.find({ emailVerified: false })

// Find verified but unapproved users
db.users.find({ emailVerified: true, isApproved: false })

// Check token expiration
db.users.find({ 
  emailVerificationExpires: { $lt: new Date() } 
})
```

### Manual Verification (Testing Only)
```javascript
// Manually verify user
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: { emailVerified: true },
    $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 }
  }
)
```

### Reset Verification Status (Testing Only)
```javascript
// Reset user for re-testing
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: { emailVerified: false },
    $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 }
  }
)
```

## 🚀 Production Deployment

### Environment Variables
Ensure these are set in production:
```env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=production-email@autovolt.com
SMTP_PASS=app-specific-password
EMAIL_FROM=AutoVolt <noreply@autovolt.com>
FRONTEND_URL=https://autovolt.yourdomain.com
```

### Monitoring
- Monitor email sending success/failure rates
- Track verification completion rates
- Alert on high resend request volumes
- Log failed verification attempts

### Rate Limiting (Recommended)
Add to backend/routes/auth.js:
```javascript
const rateLimit = require('express-rate-limit');

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many resend requests, please try again later'
});

router.post('/resend-verification', resendLimiter, authController.resendVerificationEmail);
```

## 📝 User Documentation

### For End Users
**"Didn't receive verification email?"**
1. Check spam/junk folder
2. Wait 2-3 minutes for delivery
3. Verify email address was typed correctly during registration
4. Click "Resend Verification Email" on verification page
5. Contact support if issue persists

**"Verification link expired?"**
1. Links are valid for 24 hours only
2. Visit the resend verification page
3. Enter your registered email address
4. New verification email will be sent immediately

### For Admins
**Approving Verified Users:**
1. Check email notifications for verified users
2. Login to admin dashboard
3. Navigate to Users → Pending Approvals
4. Verify user has emailVerified=true
5. Review user details and approve

## ✅ Verification Checklist

- [x] User model updated with verification fields
- [x] Email service function created with HTML template
- [x] Registration controller sends verification email
- [x] Verification endpoint validates tokens
- [x] Resend endpoint generates new tokens
- [x] Frontend verification page created
- [x] Frontend resend page created
- [x] Routes configured in App.tsx
- [x] API methods added to frontend service
- [x] Registration success message updated
- [x] Build compilation successful
- [ ] SMTP credentials configured in .env
- [ ] End-to-end testing completed
- [ ] Admin notification emails tested
- [ ] Token expiration tested
- [ ] Resend functionality tested
- [ ] Security review completed
- [ ] Rate limiting implemented
- [ ] Production deployment checklist completed

## 🔗 Related Files

### Backend Files
- `backend/models/User.js` - User schema with verification fields
- `backend/controllers/authController.js` - Verification logic
- `backend/routes/auth.js` - Verification endpoints
- `backend/services/emailService.js` - Email sending functionality

### Frontend Files
- `src/pages/VerifyEmail.tsx` - Verification confirmation page
- `src/pages/ResendVerification.tsx` - Resend request page
- `src/pages/Register.tsx` - Updated registration flow
- `src/services/api.ts` - API integration methods
- `src/App.tsx` - Route configuration

### Configuration Files
- `backend/.env` - SMTP credentials and settings
- `.env.example` - Template for environment variables

---

**Implementation Date**: December 2024  
**System Version**: AutoVolt v1.0  
**Contact**: For issues, contact development team or create issue in repository
