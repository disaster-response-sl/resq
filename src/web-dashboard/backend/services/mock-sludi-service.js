// mock-sludi-service.js
class MockSLUDIService {
  constructor() {
    this.mockUsers = [
      {
        individualId: "citizen001",
        name: "John Doe",
        email: "john@example.com",
        phone: "0771234567",
        role: "citizen",
        location: { lat: 6.9271, lng: 79.8612 }
      },
      {
        individualId: "responder001", 
        name: "Jane Smith",
        email: "jane@emergency.gov.lk",
        phone: "0779876543",
        role: "responder",
        location: { lat: 6.9319, lng: 79.8478 }
      },
      {
        individualId: "admin001",
        name: "Admin User",
        email: "admin@disaster.gov.lk", 
        phone: "0771111111",
        role: "admin",
        location: { lat: 6.9271, lng: 79.8612 }
      }
    ];
  }

  // Mock authentication endpoint
  async authenticate(authRequest) {
    const { individualId, request } = authRequest;
    
    // Simulate MOSIP response structure
    const user = this.mockUsers.find(u => u.individualId === individualId);
    
    // IMPORTANT: This is a MOCK service for development/testing only
    // In production, this should be replaced with actual SLUDI/eSignet integration
    // TODO: Move test credentials to environment variables
    if (user && request.otp === "80888275Ab") { // Mock OTP validation
      return {
        id: authRequest.id,
        version: authRequest.version,
        transactionID: authRequest.transactionID,
        responseTime: new Date().toISOString(),
        response: {
          authStatus: true,
          authToken: this.generateMockToken(user)
        },
        errors: null
      };
    }
    
    return {
      id: authRequest.id,
      version: authRequest.version, 
      transactionID: authRequest.transactionID,
      responseTime: new Date().toISOString(),
      response: {
        authStatus: false
      },
      errors: [{
        errorCode: "IDA-AUTH-001",
        message: "Authentication failed"
      }]
    };
  }

  // Mock eKYC endpoint
  async performKYC(kycRequest) {
    const { individualId, allowedKycAttributes } = kycRequest;
    const user = this.mockUsers.find(u => u.individualId === individualId);
    
    if (user) {
      const kycData = {};
      
      // Return only requested attributes
      if (allowedKycAttributes.includes('name')) kycData.name = user.name;
      if (allowedKycAttributes.includes('email')) kycData.email = user.email;
      if (allowedKycAttributes.includes('phone')) kycData.phone = user.phone;
      if (allowedKycAttributes.includes('role')) kycData.role = user.role;
      
      return {
        id: kycRequest.id,
        version: kycRequest.version,
        transactionID: kycRequest.transactionID,
        responseTime: new Date().toISOString(),
        response: {
          kycStatus: true,
          authToken: this.generateMockToken(user),
          identity: kycData
        },
        errors: null
      };
    }
    
    return {
      id: kycRequest.id,
      version: kycRequest.version,
      transactionID: kycRequest.transactionID, 
      responseTime: new Date().toISOString(),
      response: {
        kycStatus: false
      },
      errors: [{
        errorCode: "IDA-KYC-001", 
        message: "KYC failed"
      }]
    };
  }

  generateMockToken(user) {
    return `mock_token_${user.individualId}_${Date.now()}`;
  }
}

module.exports = MockSLUDIService;
