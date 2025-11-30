const mongoose = require('mongoose');
const RouteStatus = require('./models/RouteStatus');
require('dotenv').config();

const sriLankaRoutes = [
  {
    route_id: 'A1',
    route_name: 'Colombo-Kandy Highway (A1)',
    route_number: 'A1',
    route_type: 'highway',
    start_location: {
      name: 'Colombo',
      coordinates: [79.8612, 6.9271]
    },
    end_location: {
      name: 'Kandy',
      coordinates: [80.6337, 7.2906]
    },
    districts: ['Colombo', 'Gampaha', 'Kandy'],
    provinces: ['Western', 'Central'],
    distance_km: 115,
    typical_travel_time_minutes: 180,
    current_travel_time_minutes: 180,
    status: 'open',
    severity: 'normal',
    description: 'Main highway connecting Colombo and Kandy - Clear',
    traffic_density: 'moderate',
    average_speed_kmh: 60,
    emergency_vehicles_accessible: true,
    alternative_routes_available: true,
    alternative_routes: [
      {
        route_id: 'B1',
        route_name: 'Via Kadugannawa',
        additional_distance_km: 12,
        additional_time_minutes: 25
      }
    ],
    risk_level: 'low',
    last_updated_by: 'system',
    is_active: true
  },
  {
    route_id: 'A2',
    route_name: 'Southern Expressway (E01)',
    route_number: 'E01',
    route_type: 'highway',
    start_location: {
      name: 'Colombo (Kottawa)',
      coordinates: [79.9603, 6.8414]
    },
    end_location: {
      name: 'Matara',
      coordinates: [80.5353, 5.9549]
    },
    districts: ['Colombo', 'Kalutara', 'Galle', 'Matara'],
    provinces: ['Western', 'Southern'],
    distance_km: 126,
    typical_travel_time_minutes: 90,
    current_travel_time_minutes: 90,
    status: 'open',
    severity: 'normal',
    description: 'Southern Expressway - Operating normally',
    traffic_density: 'light',
    average_speed_kmh: 100,
    emergency_vehicles_accessible: true,
    alternative_routes_available: true,
    risk_level: 'low',
    last_updated_by: 'system',
    is_active: true
  },
  {
    route_id: 'A3',
    route_name: 'Colombo-Negombo Road (A3)',
    route_number: 'A3',
    route_type: 'main_road',
    start_location: {
      name: 'Colombo',
      coordinates: [79.8612, 6.9271]
    },
    end_location: {
      name: 'Negombo',
      coordinates: [79.8358, 7.2086]
    },
    districts: ['Colombo', 'Gampaha'],
    provinces: ['Western'],
    distance_km: 37,
    typical_travel_time_minutes: 60,
    current_travel_time_minutes: 75,
    status: 'partially_blocked',
    severity: 'moderate',
    description: 'Heavy traffic due to road repairs near Ja-Ela',
    traffic_density: 'heavy',
    average_speed_kmh: 30,
    emergency_vehicles_accessible: true,
    alternative_routes_available: true,
    alternative_routes: [
      {
        route_id: 'B372',
        route_name: 'Via Katunayake',
        additional_distance_km: 8,
        additional_time_minutes: 15
      }
    ],
    risk_level: 'medium',
    warnings: ['Heavy traffic', 'Road works ahead'],
    last_updated_by: 'traffic_authority',
    is_active: true
  },
  {
    route_id: 'A4',
    route_name: 'Colombo-Batticaloa Highway (A4)',
    route_number: 'A4',
    route_type: 'highway',
    start_location: {
      name: 'Colombo',
      coordinates: [79.8612, 6.9271]
    },
    end_location: {
      name: 'Batticaloa',
      coordinates: [81.6924, 7.7310]
    },
    districts: ['Colombo', 'Gampaha', 'Kurunegala', 'Polonnaruwa', 'Batticaloa'],
    provinces: ['Western', 'North Western', 'North Central', 'Eastern'],
    distance_km: 314,
    typical_travel_time_minutes: 360,
    current_travel_time_minutes: 420,
    status: 'hazardous',
    severity: 'severe',
    description: 'Flooding reported near Polonnaruwa section - Drive with extreme caution',
    traffic_density: 'moderate',
    average_speed_kmh: 45,
    weather_conditions: 'heavy_rain',
    visibility: 'poor',
    emergency_vehicles_accessible: true,
    alternative_routes_available: false,
    risk_level: 'high',
    risk_factors: ['Flooding', 'Poor visibility', 'Slippery road'],
    warnings: ['Heavy rain', 'Flooding', 'Drive slowly'],
    last_updated_by: 'police',
    is_active: true
  },
  {
    route_id: 'A9',
    route_name: 'Kandy-Jaffna Highway (A9)',
    route_number: 'A9',
    route_type: 'highway',
    start_location: {
      name: 'Kandy',
      coordinates: [80.6337, 7.2906]
    },
    end_location: {
      name: 'Jaffna',
      coordinates: [80.0255, 9.6615]
    },
    districts: ['Kandy', 'Matale', 'Anuradhapura', 'Vavuniya', 'Kilinochchi', 'Jaffna'],
    provinces: ['Central', 'North Central', 'Northern'],
    distance_km: 385,
    typical_travel_time_minutes: 420,
    current_travel_time_minutes: 420,
    status: 'open',
    severity: 'normal',
    description: 'Clear passage - Main northern route operational',
    traffic_density: 'light',
    average_speed_kmh: 70,
    emergency_vehicles_accessible: true,
    alternative_routes_available: false,
    risk_level: 'low',
    last_updated_by: 'system',
    is_active: true
  },
  {
    route_id: 'A6',
    route_name: 'Ambepussa-Trincomalee Road (A6)',
    route_number: 'A6',
    route_type: 'main_road',
    start_location: {
      name: 'Ambepussa',
      coordinates: [80.2069, 7.2647]
    },
    end_location: {
      name: 'Trincomalee',
      coordinates: [81.2334, 8.5874]
    },
    districts: ['Kurunegala', 'Matale', 'Polonnaruwa', 'Trincomalee'],
    provinces: ['North Western', 'Central', 'North Central', 'Eastern'],
    distance_km: 185,
    typical_travel_time_minutes: 240,
    current_travel_time_minutes: 240,
    status: 'open',
    severity: 'normal',
    description: 'Eastern route - Normal conditions',
    traffic_density: 'light',
    average_speed_kmh: 55,
    emergency_vehicles_accessible: true,
    alternative_routes_available: true,
    risk_level: 'low',
    last_updated_by: 'system',
    is_active: true
  },
  {
    route_id: 'A7',
    route_name: 'Galle Road (A7)',
    route_number: 'A7',
    route_type: 'main_road',
    start_location: {
      name: 'Colombo',
      coordinates: [79.8612, 6.9271]
    },
    end_location: {
      name: 'Galle',
      coordinates: [80.2170, 6.0535]
    },
    districts: ['Colombo', 'Kalutara', 'Galle'],
    provinces: ['Western', 'Southern'],
    distance_km: 116,
    typical_travel_time_minutes: 150,
    current_travel_time_minutes: 150,
    status: 'open',
    severity: 'normal',
    description: 'Coastal road to Galle - Clear',
    traffic_density: 'moderate',
    average_speed_kmh: 50,
    emergency_vehicles_accessible: true,
    alternative_routes_available: true,
    risk_level: 'low',
    last_updated_by: 'system',
    is_active: true
  },
  {
    route_id: 'BRIDGE_KELANI',
    route_name: 'Kelani Bridge (Colombo)',
    route_type: 'bridge',
    start_location: {
      name: 'Peliyagoda',
      coordinates: [79.8985, 6.9588]
    },
    end_location: {
      name: 'Kiribathgoda',
      coordinates: [79.9297, 6.9808]
    },
    districts: ['Gampaha', 'Colombo'],
    provinces: ['Western'],
    distance_km: 0.5,
    typical_travel_time_minutes: 5,
    current_travel_time_minutes: 5,
    status: 'open',
    severity: 'normal',
    description: 'Major bridge crossing - Operating normally',
    traffic_density: 'moderate',
    emergency_vehicles_accessible: true,
    alternative_routes_available: true,
    risk_level: 'low',
    last_updated_by: 'system',
    is_active: true
  }
];

async function seedRouteStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_response', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing route status data
    await RouteStatus.deleteMany({});
    console.log('🗑️  Cleared existing route status data');

    // Insert seed data
    const result = await RouteStatus.insertMany(sriLankaRoutes);
    console.log(`✅ Successfully seeded ${result.length} routes`);

    // Display summary
    console.log('\n📊 Route Status Summary:');
    console.log(`- Total Routes: ${result.length}`);
    console.log(`- Open: ${result.filter(r => r.status === 'open').length}`);
    console.log(`- Partially Blocked: ${result.filter(r => r.status === 'partially_blocked').length}`);
    console.log(`- Hazardous: ${result.filter(r => r.status === 'hazardous').length}`);
    console.log(`- Blocked: ${result.filter(r => r.status === 'blocked').length}`);

    console.log('\n🛣️  Routes seeded:');
    result.forEach(route => {
      console.log(`   - ${route.route_name} (${route.route_id}): ${route.status.toUpperCase()}`);
    });

  } catch (error) {
    console.error('❌ Error seeding route status:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the seed function
seedRouteStatus();
