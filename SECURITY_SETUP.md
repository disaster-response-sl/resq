# Admin Security Setup

## ✅ Secure Credentials Created

The admin and responder accounts have been set up with cryptographically secure passwords.

### Login Credentials

**Admin Account:**
- Individual ID: `admin001`
- Password: *[Stored securely - see setup output above]*

**Responder Account:**
- Individual ID: `responder001`
- Password: *[Stored securely - see setup output above]*

## 🔒 Security Best Practices

### For Production Deployment:

1. **Store credentials securely**
   - Use a password manager (1Password, LastPass, Bitwarden, etc.)
   - Never commit passwords to version control
   - Never share passwords via unsecured channels

2. **Password Management**
   - Passwords are 32 characters with mixed case, numbers, and symbols
   - Change passwords regularly (every 90 days recommended)
   - Use unique passwords for each admin account

3. **Access Control**
   - Only share credentials with authorized personnel
   - Implement role-based access control (RBAC)
   - Monitor admin login activity via AdminSession logs

4. **Database Security**
   - Passwords are hashed using bcrypt (10 rounds)
   - Never store plaintext passwords
   - Keep MongoDB connection string secure

## 🔄 Rotating Credentials

If credentials are compromised, immediately:

1. Connect to MongoDB directly or via admin panel
2. Update the user password:
   ```javascript
   const user = await User.findOne({ individualId: 'admin001' });
   user.password = 'new-secure-password-here';
   await user.save(); // Password will be auto-hashed
   ```
3. Notify all authorized personnel
4. Review AdminSession logs for suspicious activity

## 🚨 Security Incident Response

If you suspect credentials have been compromised:

1. **Immediately rotate passwords**
2. **Review audit logs**: Check `AdminSession` collection for:
   - Unknown IP addresses
   - Unusual activity times
   - Multiple failed login attempts
3. **Check for unauthorized actions**: Review `approval_history` in MissingPerson records
4. **Enable additional monitoring**: Set up alerts for admin logins

## 📝 Admin Session Tracking

All admin/responder logins are tracked with:
- IP address
- User agent
- Login/logout timestamps
- Activity log (all actions performed)
- Suspicious activity flags

Query admin sessions:
```javascript
const sessions = await AdminSession.find({ user_id: 'admin001' })
  .sort({ login_time: -1 })
  .limit(10);
```

## ⚠️ Important Notes

- **DO NOT** commit this file with actual passwords
- **DO NOT** share the setup script output publicly
- **DO NOT** store passwords in plain text anywhere
- **DO** use environment-specific credentials for staging/production
- **DO** implement 2FA for production environments (future enhancement)

## 🔐 Password Policy

Current requirements:
- Minimum length: 32 characters (for admin/responder)
- Must include: uppercase, lowercase, numbers, symbols
- Generated using cryptographically secure random (crypto.randomBytes)
- Hashed using bcrypt with 10 salt rounds

## 📞 Support

For security concerns or credential reset requests:
- Contact: security@disaster-response.sl
- Emergency: Use MongoDB direct access with root credentials
