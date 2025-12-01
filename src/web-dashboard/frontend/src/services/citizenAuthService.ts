import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface CitizenUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'citizen';
  account_type: 'shadow' | 'verified';
  sos_submitted?: number;
  missing_persons_reported?: number;
  created_at?: string;
  last_active?: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  token?: string;
  citizen?: CitizenUser;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  citizen?: CitizenUser;
}

class CitizenAuthService {
  private tokenKey = 'citizen_token';
  private userKey = 'citizen_user';

  /**
   * Sign up a new citizen
   */
  async signup(name: string, phone: string, email: string, password: string): Promise<SignupResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/citizen-auth/signup`, {
        name,
        phone,
        email,
        password
      });
      
      if (response.data.success && response.data.token) {
        this.saveAuthData(response.data.token, response.data.citizen);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Login citizen
   */
  async login(identifier: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/citizen-auth/login`, {
        identifier, // Can be phone or email
        password
      });
      
      if (response.data.success && response.data.token) {
        this.saveAuthData(response.data.token, response.data.citizen);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Get citizen profile
   */
  async getProfile(): Promise<{ success: boolean; citizen?: CitizenUser; message?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      const response = await axios.get(`${API_URL}/api/citizen-auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.citizen) {
        this.saveUser(response.data.citizen);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Update citizen profile
   */
  async updateProfile(updates: { name?: string; email?: string; nic?: string }): Promise<{ success: boolean; citizen?: CitizenUser; message?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      const response = await axios.put(`${API_URL}/api/citizen-auth/profile`, updates, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.citizen) {
        this.saveUser(response.data.citizen);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Complete registration (upgrade shadow account)
   */
  async completeRegistration(password: string, email?: string): Promise<{ success: boolean; token?: string; citizen?: CitizenUser; message?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      const response = await axios.post(`${API_URL}/citizen-auth/complete-registration`, {
        password,
        email
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.token) {
        this.saveAuthData(response.data.token, response.data.citizen);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Save auth data to localStorage
   */
  saveAuthData(token: string, user: CitizenUser): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Save user to localStorage
   */
  saveUser(user: CitizenUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get user from localStorage
   */
  getUser(): CitizenUser | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const citizenAuthService = new CitizenAuthService();
