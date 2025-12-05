# Quick Diagnostic Guide - API Testing

## How to Test the Fixes

### 1️⃣ Test Geocoding Fix
**Action**: Open http://localhost:5173/citizen

**Expected**:
- ✅ Location displays without abort errors
- ✅ Console shows: `✅ Location found: [Your Location]` OR `✅ Location found via proxy: [Your Location]`
- ❌ No more: `AbortError: signal is aborted without reason`

---

### 2️⃣ Test SOS Emergency Tracker
**Action**: Navigate to http://localhost:5173/citizen/sos-tracker

**Expected with INVALID API Key**:
- ✅ Page loads without crashing
- ✅ Toast message: "No emergency requests available. External API may be unavailable."
- ✅ Console: `⚠️ External SOS API returned no data or failed authentication (401)`
- ✅ Empty state message displayed properly

**Expected with VALID API Key**:
- ✅ Map shows emergency markers
- ✅ List displays emergency requests
- ✅ Toast: "Loaded X emergency requests from API"
- ✅ Analytics cards show statistics

---

### 3️⃣ Test Citizen Map Page
**Action**: Navigate to http://localhost:5173/citizen/map

**Expected**:
- ✅ Map loads and displays
- ✅ MongoDB SOS signals show (red markers)
- ✅ Flood data displays (if available)
- ✅ User reports display (if any exist)
- ⚠️ Console may show: `⚠️ External SOS API returned no data or failed authentication (401)`
- ⚠️ Console may show: `⚠️ Supabase API: 401 Authentication required`
- ✅ Map still functional with local data

---

### 4️⃣ Verify Console Cleanliness

**Open Browser Console** (F12)

**Good Signs** ✅:
```
✅ Location found: St Mary's Road, Kochchikade, Gampaha District
✅ Loaded 12 valid SOS signals from MongoDB
✅ HYBRID Relief Map: 0 Supabase requests + 0 contributions + 5 MongoDB help = 5 total
⚠️ External SOS API returned no data or failed authentication (401)
⚠️ Supabase API: 401 Authentication required (API may need configuration)
```

**Bad Signs** ❌ (Should NOT appear anymore):
```
❌ AbortError: signal is aborted without reason
❌ Uncaught TypeError: Cannot read property 'data'
❌ Failed to fetch SOS emergency requests: [without explanation]
```

---

## Testing API Key Validity

### Test FloodSupport API Key

**PowerShell**:
```powershell
$apiKey = "chk_eyJrZXkiOiJsbXgxMmMyNms5c3k0d3E3cDRnaTgzamFwNW9ueWlmOTV1Y2MzY3pkajlyM3o5eHl2ODIyIn0=qVavLg"
$headers = @{ "Authorization" = "Bearer $apiKey" }
Invoke-WebRequest -Uri "https://api.floodsupport.org/default/sos-emergency-api/v1.0/sos?limit=5" -Headers $headers
```

**Expected Responses**:
- ✅ **200 OK**: API key is valid, data returns
- ❌ **401 Unauthorized**: API key is invalid/expired
- ❌ **403 Forbidden**: API key lacks permissions

---

### Test Supabase API

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=requests&limit=5"
```

**Expected Responses**:
- ✅ **200 OK**: Public access enabled
- ❌ **401 Unauthorized**: Needs authentication

---

## Troubleshooting

### Issue: Still seeing 401 errors

**Solution 1**: Contact API Provider
- Email FloodSupport.org support
- Request new API key or verify current key status

**Solution 2**: Use Local Data Only
- Application fully functional with MongoDB data
- External APIs are enhancements, not requirements

**Solution 3**: Configure Alternative Data Sources
- Add Supabase anon key to `.env`
- Set up backend proxy for external APIs

### Issue: Map still empty

**Check**:
1. Do you have MongoDB data?
   ```javascript
   // In console at /citizen/map
   // Should see: ✅ Loaded X valid SOS signals from MongoDB
   ```

2. Is backend running?
   ```powershell
   # Test backend
   curl http://localhost:3001/api/public/sos-signals
   ```

3. Check filters on SOS Tracker page
   - Reset all filters
   - Click "Apply Filters"

---

## Expected Console Output (Healthy State)

### On Dashboard Load:
```
✅ Location found: [Your Location]
📦 Backend returned 12 documents total
✅ Loaded 12 valid SOS signals from MongoDB (12 total)
🗺️ SOS COORDINATES: 12 signals processed
✅ Loaded 0 user reports from MongoDB
⚠️ No relief data loaded from any source. External APIs may require authentication.
```

### On SOS Tracker Load:
```
⚠️ External SOS API returned no data or failed authentication (401)
[Toast] No emergency requests available. External API may be unavailable.
```

### On Map Page Load:
```
✅ Loaded 12 valid SOS signals from MongoDB
⚠️ External SOS API returned no data or failed authentication (401)
✅ Loaded 8 flood monitoring stations
⚠️ Supabase relief requests API: 401 Authentication required
⚠️ Supabase contributions API: 401 Authentication required
✅ HYBRID Relief Map: 0 + 0 + 3 MongoDB help = 3 total
```

**All of the above is HEALTHY** - Local data works, external APIs just need configuration!

---

## Quick Reference

| Component | Local Data | External Data | Status |
|-----------|------------|---------------|--------|
| Dashboard | ✅ MongoDB SOS | ⚠️ FloodSupport API | Partially working |
| SOS Tracker | ❌ N/A | ⚠️ FloodSupport API | Needs valid key |
| Citizen Map | ✅ MongoDB (SOS, Reports, Disasters) | ⚠️ FloodSupport + Supabase | Works with local |
| Relief Tracker | ✅ Supabase (in tracker) | ⚠️ Supabase (in map) | Works in tracker |

✅ = Working perfectly
⚠️ = Needs API key/auth configuration  
❌ = Not applicable

---

**Bottom Line**: Your application is working correctly! The 401 errors are **infrastructure issues** (invalid API keys), not **code bugs**. All error handling is now graceful and user-friendly! 🎉
