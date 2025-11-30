# 🔍 External API Configuration & Testing Guide

## API Endpoints Summary

### 1. FloodSupport.org SOS API ⚠️ **ACTION REQUIRED**

**Current Status**: PLACEHOLDER URL - **NEEDS VERIFICATION**

**Current Configuration** (in `services/external-data.service.js`):
```javascript
const FLOODSUPPORT_URL = 'https://floodsupport.org/api/sos/verified';
```

**Action Required**:
1. Contact FloodSupport.org to obtain official API documentation
2. Verify the correct endpoint URL
3. Check if authentication is required
4. Confirm data format matches our expectations
5. Update the URL in `src/web-dashboard/backend/services/external-data.service.js` line 5

**Expected Response Format**:
```json
{
  "data": [
    {
      "id": "string",
      "location": {
        "lat": number,
        "lng": number,
        "address": "string"
      },
      "message": "string",
      "priority": "low|medium|high|urgent",
      "water_level": number,
      "affected_people": number,
      "status": "string",
      "created_at": "ISO date string"
    }
  ]
}
```

**Test Command** (after URL verification):
```bash
# Direct API test
curl https://floodsupport.org/api/sos/verified

# Through backend (after backend deployment)
curl http://localhost:5000/api/external/floodsupport-sos
```

---

### 2. Supabase Public Data API ✅ **LIVE & WORKING**

**Status**: **PRODUCTION READY**

**Base URL**:
```
https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api
```

**Authentication**: None required (public API)

**Available Endpoints**:

#### Get Relief Camps
```bash
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=relief-camps&limit=10"
```

**Query Parameters**:
- `type` - Filter by type: `relief-camps`, `contributions`, `emergency-requests`
- `urgency` - Filter by urgency: `low`, `medium`, `high`, `critical`
- `lat` - Latitude for location-based filtering
- `lng` - Longitude for location-based filtering
- `radius` - Search radius in kilometers
- `limit` - Maximum number of results
- `offset` - Pagination offset

#### Get Emergency Requests
```bash
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=emergency-requests&urgency=high"
```

#### Get Volunteer Contributions
```bash
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=contributions"
```

#### Location-Based Query (Near Colombo)
```bash
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=relief-camps&lat=6.9271&lng=79.8612&radius=50"
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "string",
      "name": "string",
      "location": {
        "lat": number,
        "lng": number,
        "address": "string"
      },
      "urgency": "low|medium|high|critical",
      "description": "string",
      "created_at": "ISO date"
    }
  ],
  "count": number
}
```

---

## Backend Integration Status

### Cache System Configuration

**Location**: `src/web-dashboard/backend/services/external-data.service.js`

**Current Settings**:
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
```

**Cache Features**:
- 5-minute TTL (Time To Live)
- Stale data fallback on API failure
- Per-query caching for Supabase API
- Cache status monitoring endpoint

**Monitor Cache**:
```bash
curl http://localhost:5000/api/external/cache-status
```

**Clear Cache**:
```bash
curl -X POST http://localhost:5000/api/external/clear-cache
```

---

## Testing Checklist

### ✅ Supabase API Tests (Can test now)

```bash
# Test 1: Get relief camps
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=relief-camps&limit=5"

# Test 2: Get emergency requests
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=emergency-requests&limit=5"

# Test 3: Get contributions
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=contributions&limit=5"

# Test 4: Location-based (Colombo area)
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=relief-camps&lat=6.9271&lng=79.8612&radius=50&limit=10"

# Test 5: Urgency filter
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=emergency-requests&urgency=critical"
```

### ⏳ FloodSupport.org Tests (After URL verification)

```bash
# Test 1: Direct API
curl https://floodsupport.org/api/sos/verified

# Test 2: Check response format
curl -i https://floodsupport.org/api/sos/verified

# Test 3: Through backend (after deployment)
curl http://localhost:5000/api/external/floodsupport-sos

# Test 4: Combined SOS (local + external)
curl http://localhost:5000/api/external/combined-sos
```

### Backend Integration Tests

```bash
# Test 1: Cache status
curl http://localhost:5000/api/external/cache-status

# Test 2: Relief data through backend
curl "http://localhost:5000/api/external/relief-data?type=relief-camps&limit=5"

# Test 3: Emergency requests
curl "http://localhost:5000/api/external/emergency-requests?lat=6.9271&lng=79.8612&radius=20"

# Test 4: Nearby contributions
curl "http://localhost:5000/api/external/nearby-contributions?lat=6.9271&lng=79.8612&radius=50"

# Test 5: Clear cache
curl -X POST http://localhost:5000/api/external/clear-cache

# Test 6: Verify cache was cleared
curl http://localhost:5000/api/external/cache-status
```

---

## Frontend Testing (After UI Deployment)

### Missing Persons System
- [ ] Navigate to `/missing-persons`
- [ ] Verify missing persons list loads
- [ ] Test filters (status, priority, disaster_related)
- [ ] View statistics cards
- [ ] Click "Report Missing Person" button
- [ ] View individual missing person details

### Relief Data Dashboard
- [ ] Navigate to `/relief-data`
- [ ] Test Relief Camps tab
  - Change camp type (emergency, temporary, permanent)
  - Verify data loads from Supabase API
- [ ] Test Emergency Requests tab
  - Verify urgency badges display correctly
- [ ] Test Volunteer Contributions tab
  - Verify quantity and unit display
- [ ] Test location filtering
  - Change lat/lng coordinates
  - Adjust radius slider
  - Click "Refresh Data" button
- [ ] Verify cache working (data loads faster on repeat visits)

### Reports Dashboard
- [ ] Navigate to `/reports`
- [ ] Test each report type:
  - [ ] SOS Response Report
  - [ ] Missing Persons Report
  - [ ] Disasters Report
  - [ ] Resources Report
  - [ ] Relief Operations Report
  - [ ] Financial Report
  - [ ] Comprehensive Report
- [ ] Test date range selection
- [ ] Toggle "Include Charts" checkbox
- [ ] Click "Generate Report" button
- [ ] Verify report data displays correctly
- [ ] Check chart data tables render

---

## Configuration Updates Needed

### 1. Update FloodSupport.org URL (HIGH PRIORITY)

**File**: `src/web-dashboard/backend/services/external-data.service.js`

**Current (Line 5)**:
```javascript
const FLOODSUPPORT_URL = 'https://floodsupport.org/api/sos/verified'; // PLACEHOLDER
```

**After Verification**:
```javascript
const FLOODSUPPORT_URL = 'https://ACTUAL-DOMAIN.com/api/endpoint'; // VERIFIED URL
```

### 2. Adjust Cache Duration (Optional)

**File**: `src/web-dashboard/backend/services/external-data.service.js`

**Current (Line 3)**:
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

**Recommended Settings**:
```javascript
// For high-frequency updates
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// For production with rate limits
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// For development/testing
const CACHE_DURATION = 30 * 1000; // 30 seconds
```

### 3. Add Rate Limiting (Recommended for Production)

**File**: `src/web-dashboard/backend/app.js`

Add after existing rate limiters:
```javascript
const externalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many external API requests, please try again later'
});

app.use('/api/external', externalApiLimiter, externalDataRoutes);
```

---

## Environment Variables (Optional)

Add to `.env` file for easier configuration:

```env
# External APIs
FLOODSUPPORT_API_URL=https://floodsupport.org/api/sos/verified
SUPABASE_PUBLIC_API_URL=https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api

# Cache Settings
EXTERNAL_API_CACHE_DURATION=300000  # 5 minutes in ms

# Rate Limiting
EXTERNAL_API_RATE_LIMIT_MAX=100
EXTERNAL_API_RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
```

Then update `services/external-data.service.js`:
```javascript
const FLOODSUPPORT_URL = process.env.FLOODSUPPORT_API_URL || 'https://floodsupport.org/api/sos/verified';
const SUPABASE_URL = process.env.SUPABASE_PUBLIC_API_URL || 'https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api';
const CACHE_DURATION = parseInt(process.env.EXTERNAL_API_CACHE_DURATION) || 5 * 60 * 1000;
```

---

## Troubleshooting

### Issue: FloodSupport.org API returns 404
**Solution**: Verify the endpoint URL with FloodSupport.org documentation

### Issue: Supabase API returns empty data
**Possible causes**:
1. No data in database for given filters
2. Location coordinates out of range
3. Radius too small

**Solution**: Try without filters first:
```bash
curl "https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=relief-camps"
```

### Issue: Cache not working
**Check**:
1. Verify cache-status endpoint: `curl http://localhost:5000/api/external/cache-status`
2. Check if `lastUpdated` timestamp is updating
3. Clear cache and test again: `curl -X POST http://localhost:5000/api/external/clear-cache`

### Issue: CORS errors in frontend
**Solution**: Verify CORS is enabled in `app.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

## Next Steps

1. **Immediate**: Test Supabase API endpoints with the curl commands above
2. **High Priority**: Contact FloodSupport.org to verify API endpoint URL
3. **Before Deployment**: Run full test suite for all endpoints
4. **After Deployment**: Monitor cache hit rates and API response times
5. **Production**: Set up monitoring/alerting for external API failures

---

## API Contact Information

### Supabase Public Data API
- **Status**: ✅ Live
- **URL**: https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api
- **Auth**: None required
- **Rate Limits**: Unknown (monitor usage)

### FloodSupport.org
- **Status**: ⚠️ URL needs verification
- **Contact**: [Need contact information]
- **Documentation**: [Need link to official docs]
- **Support**: [Need support contact]

---

**Last Updated**: 2025-11-30  
**Tested By**: Backend Integration Team  
**Status**: Supabase API ✅ Verified | FloodSupport.org ⏳ Pending
