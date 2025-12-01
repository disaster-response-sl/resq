# ResQ - Local Development Setup & Missing Persons Feature

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (already configured)
- VS Code with PowerShell

### Step 1: Install Dependencies

**Backend:**
```powershell
cd f:\national-disaster-platform\src\web-dashboard\backend
npm install express-fileupload form-data
npm install
```

**Frontend:**
```powershell
cd f:\national-disaster-platform\src\web-dashboard\frontend
npm install
```

### Step 2: Start Development Servers

**Terminal 1 - Backend:**
```powershell
cd f:\national-disaster-platform\src\web-dashboard\backend
npm run dev
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```powershell
cd f:\national-disaster-platform\src\web-dashboard\frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

### Step 3: Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Docs:** http://localhost:5000/api

---

## 📋 Missing Persons Feature - Hybrid Architecture

### Architecture Overview

```
┌─────────────────┐
│   Citizen/User  │
│  Uploads Poster │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Frontend (React)                  │
│  - Upload image                     │
│  - Call /extract API                │
│  - Display extracted data in form   │
│  - Allow user to review/edit        │
│  - Submit to MongoDB                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Backend (Express)                 │
│  Route: POST /api/missing-persons/  │
│         extract                     │
└────────┬────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│ Extraction   │ │  MongoDB    │ │ Verification │
│   API        │ │  (Source of │ │    Layer     │
│ (Processor)  │ │   Truth)    │ │ (Pending →   │
│              │ │             │ │  Verified)   │
└──────────────┘ └─────────────┘ └──────────────┘
```

### Key Principles

1. **MongoDB = Source of Truth**
   - All data MUST be stored in MongoDB
   - External API is just a processor, NOT storage

2. **Extraction API = Form Filler**
   - Speeds up data entry
   - User can review/edit before saving
   - Graceful fallback to manual entry if API fails

3. **Verification Layer**
   - New reports start as `verification_status: 'pending'`
   - Hidden from public until Admin/Responder verifies
   - Admin can approve or reject

---

## 🔌 API Endpoints

### Public Endpoints (No Auth)

#### 1. Extract Data from Poster
```
POST /api/missing-persons/extract
Content-Type: multipart/form-data

Body:
  image: [File]

Response:
{
  "success": true,
  "message": "Data extracted successfully. Please review and submit.",
  "extracted_data": {
    "name": "Nimal",
    "age": 10,
    "lastSeenLocation": "Colombo Fort",
    "extractedText": "...",
    "confidence": 0.95
  },
  "extracted_contacts": [
    { "phone": "+9477...", "relation": "Father" }
  ],
  "note": "This data has NOT been saved yet. Review and submit the form to save."
}
```

#### 2. Submit Missing Person Report
```
POST /api/missing-persons/submit
Authorization: Bearer <token>

Body:
{
  "extracted_data": { ... }, // Optional: if from extraction API
  "manual_data": {
    "full_name": "Nimal Perera",
    "age": 10,
    "gender": "male",
    "description": "...",
    "last_seen_date": "2025-12-01",
    "last_seen_location": {
      "lat": 6.9271,
      "lng": 79.8612,
      "address": "Colombo Fort",
      "city": "Colombo"
    },
    "circumstances": "Lost during flood",
    "reporter_name": "Kamal Perera",
    "reporter_relationship": "Father",
    "reporter_phone": "+94771234567"
  },
  "image_url": "https://..."
}

Response:
{
  "success": true,
  "message": "Missing person report submitted successfully. Awaiting verification by admin.",
  "data": { ... }
}
```

### Admin/Responder Endpoints (Auth Required)

#### 3. Get Pending Reports
```
GET /api/missing-persons/pending/list
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [ ... ],
  "count": 5
}
```

#### 4. Verify/Reject Report
```
PUT /api/missing-persons/:id/verify
Authorization: Bearer <token>

Body:
{
  "action": "approve", // or "reject"
  "rejection_reason": "Duplicate report" // Required if rejecting
}

Response:
{
  "success": true,
  "message": "Report approved successfully",
  "data": { ... }
}
```

#### 5. Get All Missing Persons
```
GET /api/missing-persons
Query Params:
  - status: missing | found_safe | found_deceased
  - priority: low | medium | high | critical
  - disaster_related: true | false
  - limit: 100 (default)
  - skip: 0 (pagination)

Response:
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

## 📊 Database Schema Updates

### MissingPerson Model - New Fields

```javascript
{
  // AI Extraction Fields (Hybrid Approach)
  extracted_data: {
    name: String,
    age: Number,
    lastSeenLocation: String,
    extractedText: String,
    confidence: Number,
    extractedContacts: [{ phone: String, relation: String }]
  },
  
  data_source: {
    type: String,
    enum: ['manual', 'ai_extracted', 'api_import'],
    default: 'manual'
  },
  
  verification_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  
  verified_by: {
    user_id: String,
    username: String,
    role: String,
    verified_at: Date
  },
  
  rejection_reason: String
}
```

---

## 🛠️ Frontend Implementation Guide

### Step 1: Create Image Upload Component

```tsx
// components/MissingPersonForm.tsx
const [image, setImage] = useState<File | null>(null);
const [extractedData, setExtractedData] = useState<any>(null);
const [loading, setLoading] = useState(false);

const handleImageUpload = async (file: File) => {
  setLoading(true);
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/missing-persons/extract`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    if (response.data.success) {
      setExtractedData(response.data.extracted_data);
      // Pre-fill form fields
      setFormData({
        full_name: response.data.extracted_data.name,
        age: response.data.extracted_data.age,
        last_seen_location: {
          address: response.data.extracted_data.lastSeenLocation
        }
      });
      toast.success('Data extracted! Please review and edit if needed.');
    } else {
      // Fallback to manual
      toast.info('Could not extract data. Please enter manually.');
    }
  } catch (error) {
    toast.error('Extraction failed. Enter details manually.');
  } finally {
    setLoading(false);
  }
};
```

### Step 2: Submit Form

```tsx
const handleSubmit = async () => {
  const payload = {
    extracted_data: extractedData, // Include if extraction was used
    manual_data: formData, // User's final data
    image_url: uploadedImageUrl
  };
  
  const response = await axios.post(
    `${API_BASE_URL}/api/missing-persons/submit`,
    payload,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  if (response.data.success) {
    toast.success('Report submitted! Awaiting admin verification.');
    navigate('/missing-persons');
  }
};
```

### Step 3: Admin Verification Panel

```tsx
// pages/AdminMissingPersons.tsx
const [pendingReports, setPendingReports] = useState([]);

useEffect(() => {
  fetchPendingReports();
}, []);

const fetchPendingReports = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/missing-persons/pending/list`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  setPendingReports(response.data.data);
};

const handleVerify = async (id: string, action: 'approve' | 'reject') => {
  await axios.put(
    `${API_BASE_URL}/api/missing-persons/${id}/verify`,
    { action },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  toast.success(`Report ${action}d!`);
  fetchPendingReports(); // Refresh list
};
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Extract endpoint works with real image
- [ ] Extract endpoint fails gracefully if API down
- [ ] Submit creates record with `verification_status: 'pending'`
- [ ] Pending reports hidden from public
- [ ] Admin can approve report → becomes visible
- [ ] Admin can reject report → stays hidden
- [ ] Only verified reports show in public search

### Frontend Tests
- [ ] Image upload triggers extraction
- [ ] Extracted data pre-fills form
- [ ] User can edit extracted data
- [ ] Manual entry works if extraction fails
- [ ] Success message shows correct status
- [ ] Admin sees pending reports
- [ ] Verify/Reject buttons work

---

## 🔄 Switching Back to Production

When Vercel limit resets (13 hours):

```powershell
# Frontend: Update .env.local to production
VITE_API_BASE_URL=https://resq-backend-3efi.onrender.com

# Or just delete .env.local to use .env.production
rm f:\national-disaster-platform\src\web-dashboard\frontend\.env.local
```

Backend stays on Render - no changes needed.

---

## 📝 Summary

**What We Built:**
✅ Hybrid architecture: MongoDB (storage) + Extraction API (processor)  
✅ Verification layer: Pending → Verified → Public  
✅ Graceful fallback: Manual entry if extraction fails  
✅ Admin approval workflow  
✅ Image upload & extraction endpoint  

**What's Next:**
1. Install `express-fileupload` and `form-data` in backend
2. Start both servers locally
3. Build frontend components
4. Test with real images
5. Deploy when Vercel limit resets

**Need Help?**
- Backend API running? Check: http://localhost:5000
- Frontend working? Check: http://localhost:5173
- Extraction failing? Check logs in backend terminal
- MongoDB connection? Check .env.local file
