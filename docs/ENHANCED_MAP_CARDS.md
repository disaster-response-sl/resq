# Enhanced Map Cards Feature

## Overview
Modern, mobile-responsive map popup cards with action buttons for all marker types (SOS, Disaster, Flood, Relief).

## Features

### 🎨 Modern Design
- **Card-based UI**: Clean, modern card design with gradients and shadows
- **Priority Badges**: Color-coded badges (HIGH, URGENT, MEDIUM, LOW)
- **Icon Headers**: Emoji icons for visual identification (🚨 SOS, ⚠️ Disaster, 💧 Flood, 🏕️ Relief)
- **Status Indicators**: Quick-view stats grid (water level, floor, battery, safe time)
- **Condition Tags**: Visual tags for food, water, special needs

### 📱 Mobile Responsive
- Min width: 280px, Max width: 400px
- Touch-friendly buttons with active states
- Scrollable detail modal for small screens
- Optimized spacing for mobile devices

### 🎯 Action Buttons

#### 1. **Call Button** (Green)
- Opens phone dialer with contact number
- Disabled if no phone number available
- Triggers: `tel:` protocol

#### 2. **Nav Button** (Blue)
- Opens Google Maps with directions
- Uses marker coordinates as destination
- Opens in new tab: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`

#### 3. **Details Button** (Black)
- Opens full-screen modal with complete information
- Shows:
  - Emergency details (type, status, people count)
  - Location information (address, district, landmark)
  - Conditions (children, elderly, disabled, medical, food, water)
  - Description/remarks
  - Medical details (if available)
  - Timestamp
- Closable with X button or clicking outside

## Component Structure

```
EnhancedMapCard.tsx
├── Compact Card View
│   ├── Header (Priority badge, Close button)
│   ├── Icon & Title
│   ├── Content Section
│   │   ├── People count
│   │   ├── Location
│   │   ├── Quick stats grid
│   │   └── Condition tags
│   └── Action Buttons (Call, Nav, Details)
└── Detail Modal (conditional)
    ├── Header (Icon, Title, Reference, Close)
    ├── Emergency Details Section
    ├── Location Section
    ├── Conditions Section
    ├── Description Section
    └── Timestamp
```

## Updated Components

### CitizenMapPage.tsx
All marker types now use `EnhancedMapCard`:

1. **External SOS Markers** (FloodSupport API)
   - Type: `sos`
   - Priority: From API (`HIGHLY_CRITICAL`, `CRITICAL`, `HIGH`, etc.)
   - Shows: Full name, reference number, people count, conditions

2. **Local SOS Markers** (MongoDB)
   - Type: `sos`
   - Priority: From priority field
   - Shows: Message, status, timestamp

3. **Disaster Markers**
   - Type: `disaster`
   - Priority: Severity level
   - Shows: Disaster name, type, affected radius

4. **Flood Markers** (DMC Data)
   - Type: `flood`
   - Priority: Severity level
   - Shows: Station name, water level, rising/falling status

5. **Relief Camp Markers**
   - Type: `relief`
   - Priority: Urgency level
   - Shows: Camp name, people count, assistance types

## Popup Configuration

All Leaflet Popups updated with:
```tsx
<Popup maxWidth={400} minWidth={280} closeButton={false}>
  <EnhancedMapCard ... />
</Popup>
```

- `closeButton={false}`: Card has its own close button
- `maxWidth={400}`: Prevents oversized cards
- `minWidth={280}`: Ensures readability on mobile

## CSS Animations

Added to `index.css`:
```css
@layer utilities {
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
}
```

## Priority Mapping

```typescript
const priorityConfig = {
  'HIGH': { color: 'bg-red-50 text-red-700 border-red-200', label: 'HIGH' },
  'HIGHLY_CRITICAL': { color: 'bg-red-50 text-red-700 border-red-200', label: 'HIGH' },
  'CRITICAL': { color: 'bg-red-50 text-red-700 border-red-200', label: 'HIGH' },
  'URGENT': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'URGENT' },
  'MEDIUM': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'MEDIUM' },
  'LOW': { color: 'bg-green-50 text-green-700 border-green-200', label: 'LOW' },
};
```

## Type Configuration

```typescript
const typeConfig = {
  sos: { icon: '🚨', label: 'EMERGENCY', color: 'text-red-600' },
  flood: { icon: '💧', label: 'FLOOD', color: 'text-blue-600' },
  disaster: { icon: '⚠️', label: 'DISASTER', color: 'text-orange-600' },
  relief: { icon: '🏕️', label: 'RELIEF', color: 'text-green-600' },
};
```

## Props Interface

```typescript
interface EnhancedMapCardProps {
  type: 'sos' | 'flood' | 'disaster' | 'relief';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT' | 'CRITICAL' | 'HIGHLY_CRITICAL';
  title: string;
  reference?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  data: Record<string, any>; // Flexible data object for different marker types
  onClose?: () => void; // Optional close callback
}
```

## Usage Example

```tsx
<EnhancedMapCard
  type="sos"
  priority="HIGH"
  title="Emergency Request"
  reference="SOS-1764619463956-706"
  location={{
    lat: 6.9271,
    lng: 79.8612,
    address: "rajanganaya, Anuradhapura"
  }}
  data={{
    emergencyType: "Food/Water Needed",
    numberOfPeople: 16,
    phoneNumber: "+94771234567",
    waterLevel: "N/A",
    batteryPercentage: 0,
    safeForHours: 0,
    hasFood: false,
    hasWater: false,
    description: "Urgent assistance required"
  }}
/>
```

## Testing Checklist

- [ ] Click SOS marker → Card opens with Call/Nav/Details buttons
- [ ] Click Call button → Phone dialer opens (mobile) or shows number (desktop)
- [ ] Click Nav button → Google Maps opens with directions
- [ ] Click Details button → Full modal opens with all information
- [ ] Test on mobile device → Cards are responsive and buttons are touch-friendly
- [ ] Test all marker types (SOS, Disaster, Flood, Relief) → All use enhanced cards
- [ ] Close modal → Returns to compact card view
- [ ] Priority badges show correct colors
- [ ] Icons display correctly for each type

## Browser Compatibility

- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Performance Notes

- Cards lazy-load detail modal (only rendered when Details clicked)
- Animations are GPU-accelerated (transform/opacity)
- No external dependencies beyond existing stack
- Uses Tailwind CSS utility classes for minimal bundle impact

## Future Enhancements

- [ ] Add share button to share location/details
- [ ] Add report update button for status changes
- [ ] Add photo gallery in detail modal
- [ ] Add audio SOS playback if available
- [ ] Add estimated response time
- [ ] Add nearby responders count
- [ ] Add real-time status updates via WebSocket

## Files Modified

1. `src/web-dashboard/frontend/src/components/EnhancedMapCard.tsx` (NEW)
2. `src/web-dashboard/frontend/src/components/CitizenMapPage.tsx`
3. `src/web-dashboard/frontend/src/index.css`

## Branch

Feature branch: `feature-enhance-map-cards`

## Related Documentation

- [JWT Token Update](./JWT_TOKEN_UPDATE.md)
- [Automatic Token Refresh](./AUTOMATIC_TOKEN_REFRESH.md)
- [OAuth Setup Instructions](./OAUTH_SETUP_INSTRUCTIONS.md)
