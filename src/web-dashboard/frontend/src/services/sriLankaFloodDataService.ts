import axios from 'axios';

const FLOOD_API_BASE_URL = 'https://lk-flood-api.vercel.app';

export interface WaterLevelReading {
  station_name: string;
  river_name: string;
  water_level: number;
  previous_water_level: number;
  alert_status: 'MAJOR' | 'MINOR' | 'ALERT' | 'NORMAL';
  flood_score: number;
  rising_or_falling: string;
  rainfall_mm: number;
  remarks: string;
  timestamp: string;
}

export interface GaugingStation {
  name: string;
  river_name: string;
  lat_lng: [number, number];
  alert_level: number;
  minor_flood_level: number;
  major_flood_level: number;
}

export interface StationWithLevel {
  station: GaugingStation;
  latest_reading: WaterLevelReading;
}

export interface AlertSummary {
  alert_level: 'MAJOR' | 'MINOR' | 'ALERT' | 'NORMAL';
  count: number;
  stations: string[];
}

export const sriLankaFloodDataService = {
  /**
   * Get all gauging stations with metadata
   */
  async getStations(): Promise<GaugingStation[]> {
    const response = await axios.get(`${FLOOD_API_BASE_URL}/stations`);
    return response.data;
  },

  /**
   * Get latest water level readings for all stations
   */
  async getLatestLevels(): Promise<WaterLevelReading[]> {
    const response = await axios.get(`${FLOOD_API_BASE_URL}/levels/latest`);
    return response.data;
  },

  /**
   * Get all stations currently in ALERT, MINOR, or MAJOR status
   */
  async getActiveAlerts(): Promise<WaterLevelReading[]> {
    const response = await axios.get(`${FLOOD_API_BASE_URL}/alerts`);
    return response.data;
  },

  /**
   * Get alert summary with counts by level
   */
  async getAlertSummary(): Promise<AlertSummary[]> {
    const response = await axios.get(`${FLOOD_API_BASE_URL}/alerts/summary`);
    return response.data;
  },

  /**
   * Get specific station with latest reading
   */
  async getStation(stationName: string): Promise<StationWithLevel> {
    const response = await axios.get(`${FLOOD_API_BASE_URL}/stations/${stationName}`);
    return response.data;
  },

  /**
   * Get historical readings for a station
   */
  async getStationHistory(stationName: string, limit: number = 50): Promise<WaterLevelReading[]> {
    const response = await axios.get(`${FLOOD_API_BASE_URL}/levels/history/${stationName}`, {
      params: { limit }
    });
    return response.data;
  }
};
