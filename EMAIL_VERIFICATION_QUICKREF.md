# Email Verification - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Configure Email (backend/.env)
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=AutoVolt <noreply@autovolt.com>
```

### 2. Start Servers
```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
npm run dev
```

### 3. Test Registration
```
1. Go to http://localhost:5173/register
2. Register with real email
3. Check inbox for verification email
4. Click verification link
5. ✅ Success!
```

## 📋 Quick Test Commands

```bash
# Check verification status
cd backend && node test-email-verification.js

# View unverified users
node -e "require('./backend/models/User').find({emailVerified:false})"

# Manually verify user (testing only)
node -e "
const User = require('./backend/models/User');
User.updateOne({email:'test@example.com'}, {emailVerified:true})
"
```

## 🔗 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register + Send verification email |
| GET | `/api/auth/verify-email/:token` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |

## 🎨 Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/register` | Register.tsx | Registration form |
| `/verify-email/:token` | VerifyEmail.tsx | Email verification page |
| `/resend-verification` | ResendVerification.tsx | Resend verification email |

## 🗄️ Database Fields

```javascript
User Schema {
  emailVerified: Boolean (default: false)
  emailVerificationToken: String (SHA-256 hashed)
  emailVerificationExpires: Date (24 hours from generation)
}
```

## 🔐 Token Security

- **Generate**: `crypto.randomBytes(32)`
- **Hash**: SHA-256 before storing
- **Expire**: 24 hours validity
- **Invalidate**: On successful verification or resend

## 📧 Email Template

**Subject**: Verify Your AutoVolt Account  
**Template**: HTML with gradient design  
**Includes**: 
- User name
- Verification button
- 24-hour expiry notice
- Alternative plain text link

## 🧪 Test Scenarios

### Test 1: Happy Path
```
Register → Receive Email → Click Link → ✅ Verified
```

### Test 2: Token Expiration
```
Register → Wait 24h → Click Link → ❌ Expired → Resend → ✅ Success
```

### Test 3: Resend
```
Register → No Email → Go to Resend Page → Enter Email → ✅ New Email
```

### Test 4: Invalid Token
```
Random Token → ❌ Invalid Token Error
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No email received | Check spam folder, verify SMTP credentials |
| Token expired | Use resend verification page |
| Invalid token | Check token hasn't been used, resend email |
| Build errors | Run `npm run build` to check compilation |
| Database errors | Verify MongoDB connection, check indexes |

## 📊 Quick Statistics Query

```bash
cd backend && node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const total = await User.countDocuments();
  const verified = await User.countDocuments({emailVerified: true});
  console.log('Total:', total, 'Verified:', verified);
  process.exit(0);
});
"
```

## ⚡ Production Checklist

- [ ] Real SMTP credentials configured
- [ ] Email FROM domain matches sender
- [ ] Rate limiting enabled on resend endpoint
- [ ] Email queue implemented (optional)
- [ ] Monitoring set up for email delivery
- [ ] Token cleanup cron job (optional)
- [ ] CAPTCHA on registration (recommended)

## 🔧 Gmail App Password Setup

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Click "App passwords"
4. Select "Mail" → Generate
5. Copy 16-character password
6. Paste to `SMTP_PASS` in .env

## 📚 Full Documentation

- **EMAIL_VERIFICATION_GUIDE.md** - Complete implementation guide
- **EMAIL_VERIFICATION_IMPLEMENTATION.md** - Implementation summary
- **backend/test-email-verification.js** - Test script

## 🎯 Common Use Cases

### Manually Verify User (Testing)
```javascript
// In backend directory
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  await User.updateOne(
    { email: 'test@example.com' },
    { 
      emailVerified: true,
      \$unset: { emailVerificationToken: 1, emailVerificationExpires: 1 }
    }
  );
  console.log('User verified');
  process.exit(0);
});
"
```

### Expire Token Immediately (Testing)
```javascript
// Force token expiration for testing
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
```

### Reset Verification Status (Testing)
```javascript
// Reset user for re-testing
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  await User.updateOne(
    { email: 'test@example.com' },
    { 
      emailVerified: false,
      \$unset: { emailVerificationToken: 1, emailVerificationExpires: 1 }
    }
  );
  console.log('User reset for re-testing');
  process.exit(0);
});
"
```

## 🔄 User Flow Diagram

```
┌─────────────┐
│   Register  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Generate    │
│   Token     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Send Email  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ User Clicks │
│    Link     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validate   │
│   Token     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Email       │
│ Verified ✅ │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Notify    │
│   Admins    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Admin     │
│  Approval   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ User Login  │
│  Enabled ✅ │
└─────────────┘
```

## 💡 Pro Tips

1. **Development Mode**: Email service falls back to console logging if SMTP not configured
2. **Token Security**: Always use `crypto.randomBytes()` for token generation
3. **Error Handling**: All endpoints return proper error messages for debugging
4. **Rate Limiting**: Add to prevent abuse (3 resends per 15 minutes recommended)
5. **Email Queue**: Use Bull or RabbitMQ for production email handling
6. **Monitoring**: Track delivery rates and verification completion rates
7. **Testing**: Use temp-mail.org for temporary test emails

## 🎉 Success Indicators

✅ Build compiles without errors  
✅ Verification email received  
✅ Token validation works  
✅ Resend functionality works  
✅ Database updates correctly  
✅ Admin receives notifications  

---

**Quick Help**: Run `node backend/test-email-verification.js` for system status
