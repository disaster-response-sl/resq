// eSignet Environment Configuration for Mobile App
// Based on SLUDI App configuration

export const ESIGNET_ENV_CONFIG = {
  ESIGNET_UI_BASE_URL: "https://sludiauth.icta.gov.lk",
  MOCK_RELYING_PARTY_SERVER_URL: process.env.REACT_NATIVE_API_BASE_URL?.replace('/api', '') || "https://YOUR_RENDER_APP.onrender.com", // Use same backend URL
  REDIRECT_URI_USER_PROFILE: "ndp://dashboard",
  REDIRECT_URI_REGISTRATION: "ndp://dashboard",
  REDIRECT_URI: "ndp://dashboard",
  CLIENT_ID: "IIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgMEyx", // Fixed: Correct CLIENT_ID from SLUDI app
  ACRS: "mosip:idp:acr:generated-code%20mosip:idp:acr:biometrics%20mosip:idp:acr:static-code",
  SCOPE_USER_PROFILE: "openid%20profile%20resident-service",
  SCOPE_REGISTRATION: "openid%20profile",
  CLAIMS_USER_PROFILE: "%7B%22userinfo%22:%7B%22given_name%22:%7B%22essential%22:true%7D,%22phone_number%22:%7B%22essential%22:false%7D,%22email%22:%7B%22essential%22:true%7D,%22picture%22:%7B%22essential%22:false%7D,%22gender%22:%7B%22essential%22:false%7D,%22birthdate%22:%7B%22essential%22:false%7D,%22address%22:%7B%22essential%22:false%7D%7D,%22id_token%22:%7B%7D%7D",
  CLAIMS_REGISTRATION: "%7B%22userinfo%22:%7B%22given_name%22:%7B%22essential%22:true%7D,%22phone_number%22:%7B%22essential%22:false%7D,%22email%22:%7B%22essential%22:true%7D,%22picture%22:%7B%22essential%22:false%7D,%22gender%22:%7B%22essential%22:false%7D,%22birthdate%22:%7B%22essential%22:false%7D,%22address%22:%7B%22essential%22:false%7D%7D,%22id_token%22:%7B%7D%7D",
  SIGN_IN_BUTTON_PLUGIN_URL: "https://sludiauth.icta.gov.lk/plugins/sign-in-button-plugin.js",
  DISPLAY: "page",
  PROMPT: "consent",
  GRANT_TYPE: "authorization_code",
  MAX_AGE: 21,
  CLAIMS_LOCALES: "en",
  DEFAULT_LANG: "en",
  FALLBACK_LANG: "%7B%22label%22%3A%22English%22%2C%22value%22%3A%22en%22%7D",
  // Additional required URLs
  authorizeUri: "https://sludiauth.icta.gov.lk/authorize",
  tokenUri: "https://sludiauth.icta.gov.lk/service/oauth/v2/token",
  userInfoUri: "https://sludiauth.icta.gov.lk/service/oidc/userinfo"
};

// Helper function to check non-empty and non-null values
const checkEmptyNullValue = (initialValue: any, defaultValue: any): any =>
  initialValue && initialValue !== "" ? initialValue : defaultValue;

// Generate random string for state/nonce
const generateRandomString = (strLength: number = 16): string => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < strLength; i++) {
    const randomInd = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomInd);
  }
  return result;
};

// Client details configuration (matching SLUDI app structure)
export const ESIGNET_CLIENT_DETAILS = {
  state: "eree2311",
  nonce: generateRandomString(),
  responseType: "code",
  scopeUserProfile: checkEmptyNullValue(
    ESIGNET_ENV_CONFIG.SCOPE_USER_PROFILE,
    "openid profile"
  ),
  scopeRegistration: checkEmptyNullValue(
    ESIGNET_ENV_CONFIG.SCOPE_REGISTRATION,
    "openid profile"
  ),
  display: checkEmptyNullValue(ESIGNET_ENV_CONFIG.DISPLAY, "page"),
  prompt: checkEmptyNullValue(ESIGNET_ENV_CONFIG.PROMPT, "consent"),
  grantType: checkEmptyNullValue(
    ESIGNET_ENV_CONFIG.GRANT_TYPE,
    "authorization_code"
  ),
  maxAge: ESIGNET_ENV_CONFIG.MAX_AGE,
  claimsLocales: checkEmptyNullValue(ESIGNET_ENV_CONFIG.CLAIMS_LOCALES, "en"),
  authorizeEndpoint: "/authorize",
  clientId: ESIGNET_ENV_CONFIG.CLIENT_ID,
  uibaseUrl: ESIGNET_ENV_CONFIG.ESIGNET_UI_BASE_URL,
  redirect_uri_userprofile: checkEmptyNullValue(
    ESIGNET_ENV_CONFIG.REDIRECT_URI_USER_PROFILE,
    ESIGNET_ENV_CONFIG.REDIRECT_URI
  ),
  redirect_uri_registration: checkEmptyNullValue(
    ESIGNET_ENV_CONFIG.REDIRECT_URI_REGISTRATION,
    ESIGNET_ENV_CONFIG.REDIRECT_URI
  ),
  acr_values: ESIGNET_ENV_CONFIG.ACRS,
  userProfileClaims: checkEmptyNullValue(
    ESIGNET_ENV_CONFIG.CLAIMS_USER_PROFILE,
    "{}"
  ),
  registrationClaims: checkEmptyNullValue(
    ESIGNET_ENV_CONFIG.CLAIMS_REGISTRATION,
    "{}"
  ),
  signInButtonPluginUrl: ESIGNET_ENV_CONFIG.SIGN_IN_BUTTON_PLUGIN_URL,
  // Standard OIDC parameters for mobile button
  redirectUri: "safelanka://auth/callback",
  scope: "openid profile",
  acrValues: ESIGNET_ENV_CONFIG.ACRS,
  claims: {
    userinfo: {
      given_name: { essential: true },
      phone_number: { essential: false },
      email: { essential: true },
      picture: { essential: false },
      gender: { essential: false },
      birthdate: { essential: false },
      address: { essential: false }
    },
    id_token: {}
  }
};
