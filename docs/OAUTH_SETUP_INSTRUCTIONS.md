# 🔐 FloodSupport OAuth2 Setup Instructions

## Quick Setup (5 minutes)

### 1. Get Your Credentials

Visit your Choreo application dashboard and click **"View"** under Credentials:

```
Consumer Key (Client ID): ____________________________________
Consumer Secret:          ____________________________________
```

⚠️ **Keep these secret!** Never share or commit these values.

### 2. Update Backend `.env`

Open `src/web-dashboard/backend/.env` and add:

```env
# FloodSupport API OAuth2 Configuration
FLOODSUPPORT_OAUTH_TOKEN_URL=https://7bc3c491-cd06-428a-826a-080e4544715c-prod.e1-us-east-azure.choreosts.dev/oauth2/token
FLOODSUPPORT_CONSUMER_KEY=<paste_your_consumer_key_here>
FLOODSUPPORT_CONSUMER_SECRET=<paste_your_consumer_secret_here>
```

Replace `<paste_your_consumer_key_here>` and `<paste_your_consumer_secret_here>` with your actual credentials.

### 3. Verify Security

Run this command to ensure `.env` is not tracked by Git:

```bash
git check-ignore src/web-dashboard/backend/.env
```

Expected output: `src/web-dashboard/backend/.env`

If you don't see this, run:
```bash
git rm --cached src/web-dashboard/backend/.env
```

### 4. Test It

#### Start Backend:
```bash
cd src/web-dashboard/backend
npm install
npm start
```

#### Test Token Endpoint:
Open a new terminal and run:
```bash
curl http://localhost:5000/api/auth/floodsupport-token
```

Expected response:
```json
{
  "success": true,
  "accessToken": "eyJ4NXQjUzI1NiI6...",
  "message": "Access token retrieved successfully"
}
```

#### Start Frontend:
```bash
cd src/web-dashboard/frontend
npm install
npm run dev
```

### 5. Done! 🎉

Your application now:
- ✅ Automatically refreshes tokens every 6 hours
- ✅ Never exposes consumer secrets to frontend
- ✅ Retries failed requests with fresh tokens
- ✅ Works in production with environment variables

## Production Deployment

### Backend (Render, Heroku, etc.)

Add these environment variables in your hosting dashboard:

```
FLOODSUPPORT_OAUTH_TOKEN_URL=https://7bc3c491-cd06-428a-826a-080e4544715c-prod.e1-us-east-azure.choreosts.dev/oauth2/token
FLOODSUPPORT_CONSUMER_KEY=<your_consumer_key>
FLOODSUPPORT_CONSUMER_SECRET=<your_consumer_secret>
```

### Frontend (Vercel, Netlify, etc.)

No changes needed! Just ensure `VITE_API_BASE_URL` points to your production backend.

## Troubleshooting

### Error: "OAuth2 credentials not configured"
- Check backend `.env` file has `FLOODSUPPORT_CONSUMER_KEY` and `FLOODSUPPORT_CONSUMER_SECRET`
- Restart backend after adding credentials

### Error: "Failed to refresh access token"
- Verify consumer key/secret are correct (no extra spaces)
- Check your Choreo application is active
- Ensure token URL is correct

### Frontend still shows 401 errors
- Verify backend is running
- Check `VITE_API_BASE_URL` in frontend `.env` points to correct backend URL
- Clear browser cache and reload

## Need Help?

See full documentation: `docs/AUTOMATIC_TOKEN_REFRESH.md`
