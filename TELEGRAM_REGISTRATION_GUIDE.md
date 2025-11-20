# Telegram Bot Registration Guide

## Overview
The AutoVolt IoT Classroom system uses a Telegram bot for real-time notifications and alerts. **User registration cannot be done through the web interface** - it must be done directly through the Telegram bot for security and verification purposes.

## Why Not Web Registration?
- **Security**: Direct bot interaction ensures the person registering is the actual Telegram user
- **Verification**: Immediate verification through the bot prevents unauthorized registrations
- **Role-based Access**: Only authorized personnel (admins/security) can register
- **Real-time Communication**: Establishes direct communication channel between user and system

## Registration Process

### Step 1: Find the Bot
1. Open Telegram
2. Search for the AutoVolt bot (the bot username will be provided by your administrator)
3. Start a chat with the bot by clicking "Start" or sending `/start`

### Step 2: Register Your Account
Send the following command to the bot:
```
/register your-email@university.edu
```

**Example:**
```
/register admin@university.edu
```

### Step 3: Complete Verification
1. The bot will send you a **6-character verification code**
2. **Reply to the bot** with the exact code (case-sensitive)
3. The bot will confirm successful registration

### Step 4: Configure Notifications (Optional)
After registration, you can customize your notification preferences:
- `/subscribe 4` - Subscribe to Energy Alerts
- `/subscribe 2` - Subscribe to Security Alerts
- `/unsubscribe 2` - Unsubscribe from Security Alerts
- `/status` - Check your current subscriptions

## Who Can Register?
Only users with these roles can register for Telegram notifications:
- **Super Admin**
- **Dean**
- **Head of Department (HOD)**
- **Admin**
- **Security Personnel**

If you don't have the required permissions, the bot will inform you during registration.

## Available Commands

### Registration Commands
- `/start` - Welcome message and registration instructions
- `/register <email>` - Register with your system email
- `/status` - Check your registration and subscription status

### Subscription Commands
- `/subscribe` - Show all available alert types
- `/subscribe <number>` - Subscribe to specific alert type
- `/unsubscribe <number>` - Unsubscribe from specific alert type

### Device Monitoring
- `/devices` - Show device query options
- `/devices 1` - Show offline devices
- `/devices 4` - Show device status summary

### Alert Types
1. **Admin Alerts** - Administrative notifications (admins only)
2. **Security Alerts** - Security-related notifications
3. **Maintenance Alerts** - Device maintenance alerts (admins only)
4. **Energy Alerts** - Energy conservation notifications
5. **System Alerts** - System health notifications (admins only)
6. **User Alerts** - User-related notifications (admins only)
7. **After-Hours Lights** - Alerts when lights are on after 5 PM

## Troubleshooting

### "No active user found with email"
- Check that your email address is spelled correctly
- Ensure your account is active and approved in the system
- Contact your administrator if the issue persists

### "Not authorized to receive Telegram alerts"
- Your user role doesn't have permission for Telegram notifications
- Only administrators and security personnel can register
- Contact your system administrator to request access

### "Invalid or expired verification code"
- Codes expire after 10 minutes
- Use `/register <email>` again to get a new code
- Make sure to reply directly to the bot's message

### Bot Not Responding
- Check your internet connection
- Try restarting the Telegram app
- Contact your system administrator if the bot appears offline

## Admin Management
Administrators can manage Telegram users through the web interface:
- View registered users
- Unregister users if needed
- Monitor bot statistics and activity
- Send test alerts

**Location:** Dashboard → Telegram Bot (admin only)

## Security Notes
- All communications are encrypted end-to-end by Telegram
- The bot only stores necessary user information for notifications
- Registration requires valid system credentials
- All alert subscriptions are role-based and auditable

## Support
If you encounter issues with Telegram bot registration:
1. Check this guide for common solutions
2. Contact your system administrator
3. Include any error messages you received from the bot

---
*Last updated: November 17, 2025*</content>
<parameter name="filePath">c:\Users\IOT\Desktop\new-autovolt\TELEGRAM_REGISTRATION_GUIDE.md