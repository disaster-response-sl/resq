const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    // Email transporter (you would configure with real SMTP settings)
    this.emailTransporter = nodemailer.createTransport({
      // For development, using console transport
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });

    // Mock responder contact information
    this.responderContacts = {
      'admin_seed': {
        email: 'admin@disaster-response.sl',
        phone: '+94771234567',
        name: 'Admin Coordinator'
      },
      'responder001': {
        email: 'responder001@disaster-response.sl', 
        phone: '+94771234568',
        name: 'Field Team Alpha'
      },
      'responder002': {
        email: 'responder002@disaster-response.sl',
        phone: '+94771234569', 
        name: 'Medical Team Lead'
      },
      'responder003': {
        email: 'responder003@disaster-response.sl',
        phone: '+94771234570',
        name: 'Fire Department'
      },
      'responder004': {
        email: 'responder004@disaster-response.sl',
        phone: '+94771234571',
        name: 'Police Unit'
      }
    };
  }

  /**
   * Send SOS assignment notification to responder
   */
  async notifyResponderAssignment(sosSignal, responderId, assignedBy, notes) {
    try {
      const responder = this.responderContacts[responderId];
      if (!responder) {
        console.warn(`[NOTIFICATION] No contact info for responder: ${responderId}`);
        return;
      }

      const notification = {
        type: 'SOS_ASSIGNMENT',
        sosSignalId: sosSignal._id,
        responderId: responderId,
        assignedBy: assignedBy,
        timestamp: new Date(),
        sosData: {
          location: sosSignal.location,
          message: sosSignal.message,
          priority: sosSignal.priority,
          emergencyType: sosSignal.emergency_type,
          escalationLevel: sosSignal.escalation_level,
          citizenId: sosSignal.user_id
        }
      };

      // Log notification (in production, this would send real notifications)
      console.log('\n🚨 [SOS ASSIGNMENT NOTIFICATION] 🚨');
      console.log('='.repeat(50));
      console.log(`📧 TO: ${responder.name} (${responder.email})`);
      console.log(`📱 PHONE: ${responder.phone}`);
      console.log(`🆔 SOS ID: ${sosSignal._id}`);
      console.log(`📍 LOCATION: ${sosSignal.location.address || `${sosSignal.location.lat}, ${sosSignal.location.lng}`}`);
      console.log(`⚠️  PRIORITY: ${sosSignal.priority.toUpperCase()}`);
      console.log(`🚑 TYPE: ${sosSignal.emergency_type || 'Unknown'}`);
      console.log(`💬 MESSAGE: ${sosSignal.message}`);
      console.log(`👤 CITIZEN ID: ${sosSignal.user_id}`);
      console.log(`📝 NOTES: ${notes || 'None'}`);
      console.log(`👮 ASSIGNED BY: ${assignedBy}`);
      console.log('='.repeat(50));

      // Simulate sending email
      await this.sendEmail(responder, sosSignal, notes, assignedBy);
      
      // Simulate sending SMS  
      await this.sendSMS(responder, sosSignal);

      // Simulate push notification to mobile app
      await this.sendPushNotification(responder, sosSignal);

      // Store in-app notification
      await this.storeInAppNotification(responderId, sosSignal, notes, assignedBy);

      return {
        success: true,
        message: 'Notifications sent successfully',
        channels: ['email', 'sms', 'push', 'in-app'],
        recipient: responder
      };

    } catch (error) {
      console.error('[NOTIFICATION ERROR]', error);
      return {
        success: false,
        message: 'Failed to send notifications',
        error: error.message
      };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(responder, sosSignal, notes, assignedBy) {
    const emailContent = `
🚨 EMERGENCY SOS ASSIGNMENT 🚨

Dear ${responder.name},

You have been assigned to respond to a new SOS emergency signal.

EMERGENCY DETAILS:
- SOS ID: ${sosSignal._id}
- Priority: ${sosSignal.priority.toUpperCase()}
- Type: ${sosSignal.emergency_type || 'Unknown'}
- Location: ${sosSignal.location.address || `${sosSignal.location.lat}, ${sosSignal.location.lng}`}
- Message: ${sosSignal.message}
- Citizen ID: ${sosSignal.user_id}
- Escalation Level: ${sosSignal.escalation_level}

ASSIGNMENT INFO:
- Assigned by: ${assignedBy}
- Notes: ${notes || 'None'}
- Assigned at: ${new Date().toLocaleString()}

IMMEDIATE ACTIONS REQUIRED:
1. Acknowledge this assignment in the NDX dashboard
2. Update signal status as you respond
3. Coordinate with other emergency services if needed
4. Provide status updates throughout the response

Access the full details at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard

This is an automated message from the National Disaster Exchange (NDX) Platform.
    `;

    console.log('📧 [EMAIL] Sending to:', responder.email);
    console.log('📧 [EMAIL] Subject: 🚨 URGENT: SOS Assignment - Priority ' + sosSignal.priority.toUpperCase());
    
    // In production, you would actually send the email here
    // await this.emailTransporter.sendMail({
    //   from: 'noreply@disaster-response.sl',
    //   to: responder.email,
    //   subject: `🚨 URGENT: SOS Assignment - Priority ${sosSignal.priority.toUpperCase()}`,
    //   text: emailContent
    // });
  }

  /**
   * Send SMS notification
   */
  async sendSMS(responder, sosSignal) {
    const smsContent = `🚨 EMERGENCY SOS ASSIGNED 🚨
ID: ${sosSignal._id}
Priority: ${sosSignal.priority.toUpperCase()}
Location: ${sosSignal.location.address || 'See dashboard for coordinates'}
Message: ${sosSignal.message}
Check NDX dashboard immediately: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    console.log('📱 [SMS] Sending to:', responder.phone);
    console.log('📱 [SMS] Content:', smsContent);
    
    // In production, you would integrate with SMS service (Twilio, etc.)
    // await smsService.send(responder.phone, smsContent);
  }

  /**
   * Send push notification to mobile app
   */
  async sendPushNotification(responder, sosSignal) {
    const pushPayload = {
      title: '🚨 Emergency SOS Assignment',
      body: `Priority ${sosSignal.priority} emergency at ${sosSignal.location.address || 'specified location'}`,
      data: {
        sosId: sosSignal._id,
        priority: sosSignal.priority,
        type: 'SOS_ASSIGNMENT'
      },
      recipient: responder.name
    };

    console.log('🔔 [PUSH] Sending to:', responder.name);
    console.log('🔔 [PUSH] Payload:', pushPayload);
    
    // In production, you would send to FCM/APNS
    // await pushNotificationService.send(responder.deviceToken, pushPayload);
  }

  /**
   * Send status update notification when SOS status changes
   */
  async notifyStatusUpdate(sosSignal, oldStatus, newStatus, updatedBy) {
    if (sosSignal.assigned_responder && this.responderContacts[sosSignal.assigned_responder]) {
      const responder = this.responderContacts[sosSignal.assigned_responder];
      
      console.log('\n📱 [STATUS UPDATE NOTIFICATION]');
      console.log(`📧 TO: ${responder.name}`);
      console.log(`🆔 SOS ID: ${sosSignal._id}`);
      console.log(`📊 STATUS: ${oldStatus} → ${newStatus}`);
      console.log(`👤 UPDATED BY: ${updatedBy}`);
    }
  }

  /**
   * Send escalation notification
   */
  async notifyEscalation(sosSignal, oldLevel, newLevel, escalatedBy) {
    const responder = this.responderContacts[sosSignal.assigned_responder];
    if (responder) {
      console.log('\n⚠️ [ESCALATION NOTIFICATION]');
      console.log(`📧 TO: ${responder.name}`);
      console.log(`🆔 SOS ID: ${sosSignal._id}`);
      console.log(`📈 ESCALATION: Level ${oldLevel} → Level ${newLevel}`);
      console.log(`👤 ESCALATED BY: ${escalatedBy}`);
    }
  }

  /**
   * Store in-app notification for responder
   */
  async storeInAppNotification(responderId, sosSignal, notes, assignedBy) {
    try {
      // Import the notification store
      const { storeNotificationForResponder } = require('./NotificationStore');
      
      const notification = {
        type: 'SOS_ASSIGNMENT',
        title: '🚨 New Emergency Assignment',
        message: `You have been assigned to emergency SOS #${sosSignal._id}`,
        priority: sosSignal.priority,
        sosId: sosSignal._id,
        data: {
          location: sosSignal.location,
          emergencyType: sosSignal.emergency_type,
          citizenMessage: sosSignal.message,
          assignedBy: assignedBy,
          notes: notes,
          assignmentTime: new Date()
        }
      };
      
      // Store the notification
      storeNotificationForResponder(responderId, notification);
      
      console.log('🔔 [IN-APP] Notification stored for responder:', responderId);
      
    } catch (error) {
      console.error('[IN-APP NOTIFICATION ERROR]', error);
    }
  }
}

module.exports = new NotificationService();
