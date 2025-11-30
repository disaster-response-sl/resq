// donationService.ts
// Service for Donation/Payment Statistics API

import { DonationStatsResponse, DonationListResponse, DonationQueryParams } from '../types/donation';

export async function getDonationStats(token: string, startDate?: string, endDate?: string): Promise<DonationStatsResponse> {
  // Donation API disabled - return empty stats
  // Payment/donation features removed to focus on disaster response
  return {
    success: true,
    data: {
      total_donations: 0,
      total_amount: 0,
      average_donation: 0,
      total_donors: 0,
      recent_donations: 0,
      by_currency: {},
      by_payment_method: {},
      monthly_trend: []
    }
  };
}

export async function getDonations(
  token: string,
  params: DonationQueryParams = {}
): Promise<DonationListResponse> {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, value.toString());
    }
  });

  const url = `/api/donations${query.toString() ? '?' + query.toString() : ''}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch donations: ${res.statusText}`);
  }

  return res.json();
}

export async function getDonationById(token: string, donationId: string) {
  const res = await fetch(`/api/donations/${donationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch donation: ${res.statusText}`);
  }

  return res.json();
}

export async function updateDonationStatus(
  token: string,
  donationId: string,
  status: string,
  notes?: string
) {
  const res = await fetch(`/api/donations/${donationId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status, notes })
  });

  if (!res.ok) {
    throw new Error(`Failed to update donation status: ${res.statusText}`);
  }

  return res.json();
}

export async function getPaymentAnalytics(token: string, timeframe: string = '30d') {
  const res = await fetch(`/api/donations/analytics?timeframe=${timeframe}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch payment analytics: ${res.statusText}`);
  }

  return res.json();
}
