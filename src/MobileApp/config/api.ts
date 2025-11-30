
const getBaseURL = () => {
  // Try environment variable first (set in .env or via process.env)
  const envUrl = process.env.REACT_NATIVE_API_BASE_URL;
  if (envUrl) return envUrl;

  // Check if we're in development or production
  if (__DEV__) {
    // Development: Use localhost or your dev tunnel
    return 'http://localhost:5000/api';
  }

  // Production: This should be set via environment variable
  // If not set, this will fail intentionally to alert you to configure it
  console.error('REACT_NATIVE_API_BASE_URL not set! Please configure production API URL.');
  return 'https://YOUR_RENDER_APP.onrender.com/api'; // Replace with actual production URL
};

// Commercial Bank PayDPI Configuration
export const API_BASE_URL = getBaseURL();
export const PAYMENT_GATEWAY_URL = 'https://cbcmpgs.gateway.mastercard.com';
export const CHECKOUT_SCRIPT_URL = 'https://cbcmpgs.gateway.mastercard.com/checkout/version/100/checkout.js';

// Payment configuration
export const PAYMENT_CONFIG = {
  currency: 'LKR',
  merchantName: 'TESTITCALANKALKR',
  displayControl: {
    billingAddress: 'HIDE',
    customerEmail: 'HIDE',
    shipping: 'HIDE'
  },
  returnUrl: 'https://www.abcd.lk'
};
