Public Data API
Access relief camp and contribution data programmatically. This REST API provides real-time access to help requests and volunteer contributions with comprehensive filtering, sorting, and location-based search capabilities.

This API is publicly accessible and does not require authentication. Perfect for integrating relief data into your own applications, dashboards, or services.
Base URL
https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api
Query Parameters
type
string
Filter by data type - fetch help requests, contributions, or both.

Values: all, requests, contributions

Default: all

status
string
Filter by status - pending/resolved for requests, available/engaged/unavailable for contributions.

Values: all, pending, resolved, available

Default: all

urgency
string
Filter help requests by urgency level (only applies to type=requests).

Values: all, emergency, high, medium, low

Default: all

establishment
string
Filter by establishment type (School, Temple, Kitchen, etc.).

Values: all, School, Temple, Kitchen, Dispensary, Tent, Private Land, Other

Default: all

assistance_type
string
Filter by specific assistance type needed.

Examples: Food, Medicine, Clothing

contribution_type
string
Filter by specific contribution type offered.

Examples: Medical Supplies, Transportation

verified
string
Filter contributions by verification status. Only verified listings have been confirmed by coordinators.

Values: all, true, false

Default: all

pickup_required
string
Filter contributions by whether pickup service is needed for donated items.

Values: all, true, false

Default: all

search
string
Text search across names, addresses, notes, and item types.

lat, lng, radius_km
number
Location-based filtering with distance calculation. Provide all three parameters to enable radius filtering and distance sorting.

Example: ?lat=6.9271&lng=79.8612&radius_km=30

When location parameters are provided, results include a distance_km field showing distance from the specified point.

sort
string
Sort results by date, urgency, or distance.

Values: newest, oldest, urgency, distance

Default: newest

limit, offset
number
Control result pagination.

limit Default: 100 (max 500)

offset Default: 0

Example Requests
Get all emergency help requests
GET https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=requests&urgency=emergency
Find contributions within 30km radius
GET https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?lat=6.9271&lng=79.8612&radius_km=30&sort=distance
Search for food-related contributions
GET https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?search=food&type=contributions
Get temple-based relief camps
GET https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?establishment=Temple&limit=50
Response Format
{
  "requests": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "mobile_number": "+94771234567",
      "mobile_number_2": "+94771234568",
      "email": "john@example.com",
      "address": "123 Main St, Colombo",
      "latitude": 6.9271,
      "longitude": 79.8612,
      "establishment_type": "School",
      "num_men": 10,
      "num_women": 15,
      "num_children": 20,
      "urgency": "high",
      "status": "pending",
      "assistance_types": ["Food", "Medicine", "Water"],
      "additional_notes": "Urgent need for supplies",
      "image_urls": ["https://..."],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "resolved_at": null,
      "resolved_by_name": null,
      "resolved_by_user_id": null,
      "distance_km": 5.2
    }
  ],
  "contributions": [
    {
      "id": "uuid",
      "full_name": "Jane Smith",
      "mobile_number": "+94779876543",
      "mobile_number_2": null,
      "email": "jane@example.com",
      "address": "456 Park Ave, Kandy",
      "latitude": 7.2906,
      "longitude": 80.6337,
      "contribution_types": ["Goods", "Services"],
      "goods_types": ["Food", "Medicine"],
      "services_types": ["Medical", "Transportation"],
      "labor_types": null,
      "coverage_radius_km": 50,
      "status": "available",
      "verified": true,
      "verified_by_name": "Admin User",
      "verified_by_user_id": "uuid",
      "verified_at": "2024-01-16T09:30:00Z",
      "pickup_required": false,
      "availability_notes": "Available weekdays 9-5",
      "additional_notes": "Can provide transport",
      "created_at": "2024-01-15T11:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z",
      "distance_km": 15.8
    }
  ],
  "meta": {
    "total_requests": 150,
    "total_contributions": 75,
    "filters_applied": {
      "type": "all",
      "status": "all",
      "urgency": null,
      "establishment": null,
      "assistance_type": null,
      "contribution_type": null,
      "search": null,
      "location": {
        "lat": 6.9271,
        "lng": 79.8612,
        "radius_km": 30
      },
      "sort": "newest"
    },
    "pagination": {
      "limit": 100,
      "offset": 0,
      "returned_requests": 100,
      "returned_contributions": 75
    }
  }
}
JavaScript Example
// Fetch emergency help requests
async function fetchEmergencyRequests() {
  const url = 'https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=requests&urgency=emergency';
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Found ${data.meta.total_requests} emergency requests`);
    console.log(data.requests);
    
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Fetch nearby contributions within 20km
async function fetchNearbyHelp(lat, lng) {
  const url = `https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?type=contributions&lat=${lat}&lng=${lng}&radius_km=20&sort=distance`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.contributions;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
Use Cases
Public Relief Dashboard
Create public-facing dashboards showing real-time relief needs and available resources without requiring authentication.

Mobile Apps
Build native mobile applications that display nearby shelters, contributions, and help requests with GPS integration.

Data Analytics
Analyze relief patterns, urgency trends, and resource distribution across regions for better coordination.

Third-Party Integration
Integrate relief data into existing disaster management systems, news portals, or government platforms.

Important Notes
• CORS is enabled - you can call this API directly from web browsers.

• Maximum 500 results per request. Use pagination for larger datasets.

• Distance calculations use the Haversine formula and return results in kilometers.

• Data is real-time - reflects the current state of help requests and contributions.

External Data Integration
FloodSupport.org SOS Requests
In addition to our local database, this platform integrates verified SOS emergency requests from FloodSupport.org. These external requests are displayed with purple markers on the map and marked with an "External" badge.

Data Source

FloodSupport.org verified SOS requests (status: VERIFIED)

Refresh Rate

External data is cached and refreshes every 5 minutes

Data Transformation

Emergency types are mapped to our assistance types, and water levels/priority are converted to urgency levels

Location Filter

Only requests with valid GPS coordinates are displayed


