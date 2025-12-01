# SOS System Testing Guide

## ✅ FIXES APPLIED - SERVERS RESTARTED

### Changes Made:
1. ✅ Fixed `authService.getUser()` → `authService.getCurrentUser()`
2. ✅ Backend extracts citizenId from JWT token
3. ✅ Frontend sends Authorization header with SOS submission
4. ✅ Responders can see all SOS (not filtered by civilian_responder)
5. ✅ Added detailed logging to track token flow

---

## 🧪 TESTING STEPS

### **IMPORTANT**: Old SOS signals will still show as "anonymous"
Only **NEW** SOS submissions from logged-in citizens will have proper user_id.

---

### Test 1: Citizen Submits SOS (Logged In)

1. **Login as Citizen**:
   - Go to: `http://localhost:5173/citizen-login`
   - Use your citizen credentials
   - Verify you see the citizen dashboard

2. **Submit SOS**:
   - Click "Emergency SOS" button
   - Allow location access
   - Fill in emergency details
   - Click "Send SOS"

3. **Check Browser Console** (F12):
   ```
   [CITIZEN SOS] Token: Present
   [CITIZEN SOS] Sending with headers: { Authorization: "Bearer ..." }
   ```

4. **Check Backend Terminal**:
   ```
   [PUBLIC SOS] Auth header: Present
   [PUBLIC SOS] Token decoded: { citizenId: '...', phone: '...', ... }
   [PUBLIC SOS] Authenticated user: <citizenId>
   Public SOS signal saved successfully with user_id: <citizenId>
   ```

5. **View in Citizen Dashboard**:
   - Go back to citizen dashboard
   - Scroll to "My SOS Signals" section
   - Your new SOS should appear (not "No Active SOS")

---

### Test 2: Citizen Sees Their SOS

1. **Go to Citizen Dashboard**: `http://localhost:5173/citizen`

2. **Scroll to "My SOS Signals"** section

3. **Check Browser Console**:
   ```
   Should NOT show: "No Active SOS"
   ```

4. **Check Backend Terminal**:
   ```
   [MY SOS] Fetching SOS for citizen: <citizenId>
   [MY SOS] User object: { citizenId: '...', phone: '...', ... }
   [MY SOS] Found X SOS signals
   [MY SOS] Sample SOS user_ids: ['<citizenId>', ...]
   ```

5. **Expected Result**: See your newly submitted SOS with status, message, time

---

### Test 3: Responder Sees All SOS

1. **Login as Responder**:
   - Go to: `http://localhost:5173/`
   - Login with responder credentials

2. **Navigate to SOS Dashboard**:
   - Click "SOS" in navigation
   - Or go to: `http://localhost:5173/sos`

3. **Expected Results**:
   - Dashboard loads without errors ✅
   - See ALL active SOS signals (including anonymous and citizen SOS)
   - Stats show correct counts
   - Can filter by status/priority

4. **Check Browser Console**:
   ```
   Should NOT show: "authService.getUser is not a function"
   ```

---

### Test 4: Admin Dashboard

1. **Login as Admin**:
   - Use admin credentials

2. **Navigate to SOS Dashboard**: `/sos`

3. **Expected Results**:
   - Dashboard loads with full stats
   - Pagination works
   - Can filter and sort
   - "View Details" button works
   - Recent activity shows SOS cards

---

## 🔍 DEBUGGING

### If Citizen Dashboard Shows "No Active SOS":

**Check Backend Logs**:
```
[MY SOS] Fetching SOS for citizen: <what-id-is-here?>
[MY SOS] Found 0 SOS signals  ← PROBLEM!
```

**Possible Issues**:
1. User not logged in → Check `localStorage` for `citizen_token`
2. Token missing citizenId → Check token payload in backend logs
3. SOS saved with different user_id → Check `[PUBLIC SOS] Authenticated user:`
4. Database has old anonymous SOS → Submit NEW SOS to test

**Fix**: Submit a NEW SOS while logged in. Check:
- Frontend: `[CITIZEN SOS] Token: Present`
- Backend: `[PUBLIC SOS] Authenticated user: <citizenId>`
- Database: SOS should have `user_id: <citizenId>` (not "anonymous")

---

### If Responder Dashboard Empty:

**Check**:
1. Are there ANY SOS in database? → Check admin dashboard
2. Backend filter logic → Look for `[SOS DASHBOARD]` logs
3. Token valid → Check Authorization header

**Expected Behavior**:
- Responders with `role === 'responder'` see ALL SOS
- Civilian responders filtered by allowed_sos_levels
- Query: `status: { $in: ['pending', 'acknowledged', 'responding'] }`

---

### If "authService.getUser is not a function":

**This should be FIXED**, but if it still appears:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check `SOSDashboard.tsx` line 117: should be `getCurrentUser()`

---

## 📊 DATABASE QUERIES

### Check SOS Signals:
```javascript
// In MongoDB Compass or mongosh:

// All SOS
db.sos_signals.find({}).pretty()

// Citizen SOS (not anonymous)
db.sos_signals.find({ user_id: { $ne: 'anonymous' } })

// Specific citizen's SOS
db.sos_signals.find({ user_id: '<citizenId>' })

// Count by user_id
db.sos_signals.aggregate([
  { $group: { _id: '$user_id', count: { $sum: 1 } } }
])
```

### Check Citizens:
```javascript
db.citizenusers.find({}).pretty()
```

---

## ✅ SUCCESS CRITERIA

- [ ] **Citizen**: Submit SOS → See in dashboard → Has proper user_id
- [ ] **Citizen**: Can view SOS details → Send messages → Update status
- [ ] **Responder**: Dashboard loads → Shows ALL SOS → Can respond
- [ ] **Admin**: Full dashboard works → Stats correct → Can assign
- [ ] **Backend Logs**: Show token being received and user_id extracted
- [ ] **Database**: New SOS have citizenId (not "anonymous")

---

## 🚨 KNOWN ISSUES

### Old SOS are Anonymous:
**Problem**: SOS submitted before code update have `user_id: 'anonymous'`

**Solution**: 
- Delete old test SOS
- Submit new SOS while logged in
- Or update database manually:
  ```javascript
  db.sos_signals.updateMany(
    { user_id: 'anonymous' },
    { $set: { user_id: '<citizenId>' } }
  )
  ```

### Token Expiry:
**Problem**: JWT expires after 30 days

**Solution**: 
- Login again
- Token automatically refreshed

---

## 📝 LOGGING REFERENCE

### Frontend Console Logs:
```
[CITIZEN SOS] Token: Present/Not found
[CITIZEN SOS] Sending with headers: {...}
```

### Backend Terminal Logs:
```
[PUBLIC SOS] Auth header: Present/Missing
[PUBLIC SOS] Token decoded: {...}
[PUBLIC SOS] Authenticated user: <userId>
Public SOS signal saved successfully with user_id: <userId>

[MY SOS] Fetching SOS for citizen: <citizenId>
[MY SOS] Found X SOS signals
```

---

## 🎯 NEXT STEPS AFTER TESTING

Once basic flow works:

1. **Test Messaging**:
   - Citizen → Responder messages
   - Responder → Citizen replies
   - Real-time updates via Socket.io

2. **Test Status Updates**:
   - Citizen marks "Resolved"
   - Responder updates status
   - Admin assigns responders

3. **Test Edge Cases**:
   - Anonymous SOS (not logged in)
   - Multiple responders on same SOS
   - Token expiry handling

---

**Status**: Ready for testing! Submit a NEW SOS as logged-in citizen. 🚀
