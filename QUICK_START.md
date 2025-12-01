# Quick Start Guide - Shadow Account System

## 🎉 Backend is Running!

**Server Status**: ✅ **OPERATIONAL**  
**Port**: 5000  
**Process ID**: 17508  
**Socket.io**: ✅ Ready for real-time notifications

---

## Test the Backend (Right Now!)

### 1. Test Shadow Account Creation

Open a new terminal and run:

```powershell
$body = @{
    name = "Jane Doe"
    phone = "+94771234568"
    location = @{
        lat = 6.9271
        lng = 79.8612
    }
    message = "Help needed - flooding"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/sos/citizen/submit" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected Output**:
```json
{
  "success": true,
  "message": "SOS submitted successfully. Help is on the way!",
  "data": {
    "sos": {
      "id": "...",
      "status": "pending",
      "priority": "high"
    },
    "citizen": {
      "id": "...",
      "name": "Jane Doe",
      "phone": "+94771234568"
    },
    "auth": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "30d"
    }
  }
}
```

### 2. View Your SOS History

**Save the token** from the previous response, then:

```powershell
$token = "YOUR_TOKEN_HERE"
Invoke-WebRequest -Uri "http://localhost:5000/api/sos/citizen/my-sos" -Method GET -Headers @{Authorization = "Bearer $token"} | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### 3. Test Missing Person Report (No Auth)

```powershell
$body = @{
    reporter_name = "John Citizen"
    reporter_phone = "+94771234569"
    missing_person_name = "Alice Smith"
    age = 25
    last_seen_location = "Colombo"
    description = "Wearing blue dress"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/missing-persons" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## Frontend Integration (Next Steps)

### 1. Install Socket.io Client

```bash
cd src/MobileApp
npm install socket.io-client
```

### 2. Create Socket Service

Create `src/MobileApp/services/SocketService.ts`:

```typescript
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private socket: Socket | null = null;
  private sosId: string | null = null;

  connect(sosId: string) {
    this.sosId = sosId;
    
    // Connect to Socket.io server
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      
      // Join SOS room
      AsyncStorage.getItem('citizenId').then(citizenId => {
        if (citizenId && this.sosId) {
          this.socket?.emit('join-sos-room', {
            sosId: this.sosId,
            citizenId: citizenId
          });
          console.log(`[Socket] Joined room: sos_${this.sosId}`);
        }
      });
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    return this.socket;
  }

  // Listen for responder updates
  onResponderUpdate(callback: (data: any) => void) {
    this.socket?.on('responder-update', callback);
  }

  // Listen for chat messages
  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('new-message', callback);
  }

  // Listen for location updates
  onLocationUpdate(callback: (data: any) => void) {
    this.socket?.on('location-update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[Socket] Manually disconnected');
    }
  }
}

export default new SocketService();
```

### 3. Update SOS Submission Screen

In your SOS submission component (e.g., `SosScreen.tsx`):

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from '../services/SocketService';

const submitSOS = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/sos/citizen/submit', {
      name: userName,
      phone: userPhone,
      location: {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      },
      message: sosMessage
    });

    if (response.data.success) {
      const { sos, citizen, auth } = response.data.data;
      
      // Save token and citizen ID
      await AsyncStorage.setItem('authToken', auth.token);
      await AsyncStorage.setItem('citizenId', citizen.id);
      
      // Connect to Socket.io for real-time updates
      const socket = SocketService.connect(sos.id);
      
      // Listen for responder updates
      SocketService.onResponderUpdate((data) => {
        console.log('[SOS] Responder update:', data);
        Alert.alert('Update', data.message);
        // Update UI with responder status
        setResponderStatus(data.status);
        setResponderLocation(data.responder_location);
        setEstimatedArrival(data.estimated_arrival_time);
      });
      
      // Listen for chat messages
      SocketService.onNewMessage((data) => {
        console.log('[SOS] New message:', data);
        // Add message to chat
        setChatMessages(prev => [...prev, data]);
      });
      
      // Navigate to tracking screen
      navigation.navigate('SOSTracking', { sosId: sos.id });
    }
  } catch (error) {
    console.error('[SOS] Submission failed:', error);
    Alert.alert('Error', 'Failed to submit SOS');
  }
};
```

### 4. Create SOS Tracking Screen

Create `screens/SOSTrackingScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import SocketService from '../services/SocketService';
import MapView, { Marker } from 'react-native-maps';

export default function SOSTrackingScreen({ route }) {
  const { sosId } = route.params;
  const [responderStatus, setResponderStatus] = useState('pending');
  const [responderLocation, setResponderLocation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [estimatedArrival, setEstimatedArrival] = useState(null);

  useEffect(() => {
    // Connect to Socket.io
    SocketService.connect(sosId);

    // Listen for responder updates
    SocketService.onResponderUpdate((data) => {
      setResponderStatus(data.status);
      setResponderLocation(data.responder_location);
      setEstimatedArrival(data.estimated_arrival_time);
    });

    // Listen for chat messages
    SocketService.onNewMessage((data) => {
      setChatMessages(prev => [...prev, data]);
    });

    // Cleanup on unmount
    return () => {
      SocketService.disconnect();
    };
  }, [sosId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOS Tracking</Text>
      <Text>Status: {responderStatus}</Text>
      {estimatedArrival && (
        <Text>Estimated Arrival: {estimatedArrival}</Text>
      )}
      
      {/* Map showing responder location */}
      {responderLocation && (
        <MapView
          style={styles.map}
          region={{
            latitude: responderLocation.lat,
            longitude: responderLocation.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: responderLocation.lat,
              longitude: responderLocation.lng,
            }}
            title="Responder"
          />
        </MapView>
      )}
      
      {/* Chat messages */}
      <Text style={styles.subtitle}>Messages</Text>
      <FlatList
        data={chatMessages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.message}>
            <Text style={styles.sender}>{item.sender}</Text>
            <Text>{item.message}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  map: { width: '100%', height: 300, marginVertical: 10 },
  message: { padding: 10, marginVertical: 5, backgroundColor: '#f0f0f0', borderRadius: 5 },
  sender: { fontWeight: 'bold' },
  timestamp: { fontSize: 12, color: '#666', marginTop: 5 },
});
```

---

## Testing the Complete Flow

### Step 1: Submit SOS from Mobile App
- User fills SOS form (name, phone, location, message)
- App sends POST to `/api/sos/citizen/submit`
- Backend creates shadow account + returns JWT token
- App saves token and connects to Socket.io

### Step 2: Responder Acknowledges SOS
- Responder (web dashboard) sees new SOS
- Responder clicks "Acknowledge" or "En Route"
- Backend updates SOS status
- **Socket.io emits** `responder-update` event
- **Mobile app receives** real-time notification
- User sees: "Responder is on the way!"

### Step 3: Responder Sends Message
- Responder types message in chat
- Backend saves message to database
- **Socket.io emits** `new-message` event
- **Mobile app receives** message instantly
- Chat updates in real-time

### Step 4: Responder Updates Location
- Responder's location tracked via GPS
- Backend updates location periodically
- **Socket.io emits** `location-update` event
- **Mobile app receives** location update
- Map marker moves in real-time

---

## Server Management

### Check if Server is Running

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime
```

### Stop Server

```powershell
Stop-Process -Name node -Force
```

### Restart Server

```powershell
# Stop existing server
Stop-Process -Name node -Force

# Start new server
cd 'f:\national-disaster-platform\src\web-dashboard\backend'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'node app.js' -WindowStyle Minimized
```

### View Server Logs

The server is running in a minimized PowerShell window. To see logs, restore the window or check the terminal output.

---

## Troubleshooting

### Issue: Can't connect to Socket.io

**Solution**: Update Socket.io server URL in mobile app:
- **Development**: `http://localhost:5000` (Android emulator: `http://10.0.2.2:5000`)
- **Production**: `https://your-backend-url.com`

### Issue: Token expired

**Solution**: Re-submit SOS or implement token refresh:
```javascript
// Check token expiry
const tokenData = jwt.decode(token);
if (Date.now() >= tokenData.exp * 1000) {
  // Token expired - re-submit SOS or show login prompt
  Alert.alert('Session Expired', 'Please submit SOS again');
}
```

### Issue: Not receiving notifications

**Solution**: Check Socket.io connection:
```javascript
socket.on('connect', () => console.log('✅ Connected'));
socket.on('disconnect', () => console.log('❌ Disconnected'));
socket.on('connect_error', (error) => console.error('Connection error:', error));
```

---

## What's Next?

### Immediate (Required)
1. ✅ Backend running and tested
2. 🔲 Install socket.io-client in mobile app
3. 🔲 Create SocketService.ts
4. 🔲 Update SOS submission screen
5. 🔲 Create SOS tracking screen
6. 🔲 Test end-to-end flow

### Optional Enhancements
7. 🔲 Add push notifications (FCM/OneSignal)
8. 🔲 Implement phone number verification (OTP)
9. 🔲 Integrate with SLUDI authentication
10. 🔲 Add offline support (queue SOS when offline)

---

## Resources

- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Complete Guide**: `SHADOW_ACCOUNT_SYSTEM.md`
- **Backend Server**: Running on port 5000 (Process ID: 17508)
- **Test Endpoint**: `http://localhost:5000/api/sos/citizen/submit`

---

**Status**: ✅ Backend Complete, Ready for Frontend Integration  
**Next Action**: Implement Socket.io client in mobile app

*Happy Coding! 🚀*
