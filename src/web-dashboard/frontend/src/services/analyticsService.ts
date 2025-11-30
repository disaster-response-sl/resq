// analyticsService.ts
// Service for National Disaster Platform Analytics API

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function getDashboardStatistics(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/analytics/statistics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

export async function getTimeline(token: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/admin/analytics/timeline${query ? '?' + query : ''}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

export async function getZonesOverlap(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/analytics/zones-overlap`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

export async function getResourceSummary(token: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/admin/analytics/resource-summary${query ? '?' + query : ''}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}
