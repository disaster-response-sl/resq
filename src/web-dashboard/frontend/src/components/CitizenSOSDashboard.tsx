import React, { useState, useEffect } from 'react';
import { AlertTriangle, MessageSquare, MapPin, Clock, Send, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { citizenAuthService } from '../services/citizenAuthService';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface SOSSignal {
  _id: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  message: string;
  status: string;
  priority: string;
  created_at: string;
  victim_status_updates: Array<{
    _id: string;
    message: string;
    update_type: string;
    timestamp: string;
    sender_id?: string;
    sender_name?: string;
    sender_role?: string;
  }>;
}

const CitizenSOSDashboard: React.FC = () => {
  const [sosSignals, setSOSSignals] = useState<SOSSignal[]>([]);
  const [selectedSOS, setSelectedSOS] = useState<SOSSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMySOS();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMySOS, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMySOS = async () => {
    try {
      const token = citizenAuthService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/sos/citizen/my-sos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSOSSignals(response.data.data);
        
        // Update selected SOS if it's in the list
        if (selectedSOS) {
          const updated = response.data.data.find((s: SOSSignal) => s._id === selectedSOS._id);
          if (updated) {
            setSelectedSOS(updated);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching SOS:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedSOS || !messageText.trim()) return;

    setSending(true);
    try {
      const token = citizenAuthService.getToken();
      if (!token) {
        toast.error('Please log in to send messages');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/sos/${selectedSOS._id}/messages`,
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setMessageText('');
        toast.success('Message sent');
        fetchMySOS(); // Refresh to get new message
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateSOSStatus = async (status: string) => {
    if (!selectedSOS) return;

    try {
      const token = citizenAuthService.getToken();
      if (!token) {
        toast.error('Please log in to update status');
        return;
      }

      const response = await axios.put(
        `${API_URL}/api/sos/${selectedSOS._id}/status`,
        { status, notes: `Status updated to ${status}` },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Status updated');
        fetchMySOS();
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'responding': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_alarm': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sosSignals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active SOS</h3>
        <p className="text-gray-600">You haven't submitted any SOS signals yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SOS List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">My SOS Signals</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {sosSignals.map((sos) => (
              <button
                key={sos._id}
                onClick={() => setSelectedSOS(sos)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedSOS?._id === sos._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sos.status)}`}>
                    {sos.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(sos.priority)}`}>
                    {sos.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">{sos.message}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(sos.created_at)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SOS Details & Chat */}
      <div className="lg:col-span-2">
        {selectedSOS ? (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">SOS Details</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedSOS.status)}`}>
                    {selectedSOS.status}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedSOS.priority)}`}>
                    {selectedSOS.priority}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{selectedSOS.message}</p>
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                {selectedSOS.location.address || `${selectedSOS.location.lat}, ${selectedSOS.location.lng}`}
              </div>
            </div>

            {/* Action Buttons */}
            {selectedSOS.status !== 'resolved' && selectedSOS.status !== 'false_alarm' && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSOSStatus('resolved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => updateSOSStatus('false_alarm')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    False Alarm
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Updates & Messages
              </h4>
              <div className="space-y-3">
                {selectedSOS.victim_status_updates.map((update) => {
                  const isMessage = update.update_type === 'chat_message';
                  const isFromResponder = update.sender_role === 'responder' || update.sender_role === 'admin';
                  
                  return (
                    <div
                      key={update._id}
                      className={`p-3 rounded-lg ${
                        isMessage
                          ? isFromResponder
                            ? 'bg-blue-50 ml-4'
                            : 'bg-gray-100 mr-4'
                          : 'bg-yellow-50'
                      }`}
                    >
                      <p className="text-sm text-gray-900">{update.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(update.timestamp)}
                        {update.sender_name && ` • ${update.sender_name}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message Input */}
            {selectedSOS.status !== 'resolved' && selectedSOS.status !== 'false_alarm' && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !messageText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select an SOS to view details and messages</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenSOSDashboard;
