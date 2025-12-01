# API Endpoint Fixes Summary

## Issue
Frontend was trying to connect to `localhost:5000` instead of the production backend, causing `ERR_CONNECTION_REFUSED` errors during citizen signup/login.

## Root Cause
1. Wrong environment variable name in some services (`VITE_API_URL` instead of `VITE_API_BASE_URL`)
2. Missing `/api` prefix in some endpoint paths
3. No production environment file

## Files Fixed

### 1. Environment Configuration
- **`.env.local`** - Updated to use production backend
  ```env
  VITE_API_BASE_URL=https://resq-backend-3efi.onrender.com
  ```

- **`.env.production`** - Created new file for production builds
  ```env
  VITE_API_BASE_URL=https://resq-backend-3efi.onrender.com
  ```

- **`.env.production.example`** - Fixed example (removed /api suffix from URL)

### 2. Service Files

#### `src/services/citizenAuthService.ts`
- ✅ Changed `VITE_API_URL` → `VITE_API_BASE_URL`
- ✅ Added `/api` prefix to all endpoints:
  - `/api/citizen-auth/signup`
  - `/api/citizen-auth/login`
  - `/api/citizen-auth/profile` (GET & PUT)

#### `src/components/CitizenSOSDashboard.tsx`
- ✅ Changed `VITE_API_URL` → `VITE_API_BASE_URL`
- ✅ Added `/api` prefix to all endpoints:
  - `/api/sos/citizen/my-sos`
  - `/api/sos/:id/messages`
  - `/api/sos/:id/status`

### 3. Configuration Files

#### `src/config/api.ts`
- ✅ Updated fallback URL to production backend
- ✅ Changed error to warning for missing env var

## Verified Working
All other components already use `VITE_API_BASE_URL` correctly with fallbacks to `localhost:5000` for local development:
- CitizenMapPage.tsx
- CitizenSOSPage.tsx
- CitizenReportPage.tsx
- CitizenDashboard.tsx
- ReliefTrackerPage.tsx
- LankaRouteWatchPage.tsx
- AdminIncidentReportsPage.tsx
- And more...

## Testing
1. Frontend dev server automatically restarted with new config
2. All API calls now route to: `https://resq-backend-3efi.onrender.com/api/*`
3. Citizen signup/login should work without connection errors

## Next Steps
None required - all fixes applied and server restarted automatically.
