import React, { useState, useEffect } from 'react';
import { Key, Phone, Save, Shield } from 'lucide-react';
import { adminAPI } from '../../services/api';

const WhatsAppSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    accessToken: '',
    phoneNumberId: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    apiStatus: 'Not Set',
    phoneNumber: 'Not Set',
    serviceStatus: 'Inactive'
  });

  // Load current settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await adminAPI.getWhatsAppSettings();
        setSettings({
          accessToken: currentSettings.accessToken || '',
          phoneNumberId: currentSettings.phoneNumberId || ''
        });
        
        // Update connection status based on current settings
        if (currentSettings.accessToken && currentSettings.phoneNumberId) {
          setConnectionStatus({
            apiStatus: 'Connected',
            phoneNumber: 'Set',
            serviceStatus: 'Active'
          });
        }
      } catch (err) {
        console.error('Failed to load WhatsApp settings:', err);
      }
    };
    
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await adminAPI.updateWhatsAppSettings(settings);
      setSaved(true);
      setConnectionStatus({
        apiStatus: 'Connected',
        phoneNumber: 'Set',
        serviceStatus: 'Active'
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Settings</h2>
        <p className="text-gray-600">Configure your WhatsApp Business API credentials</p>
      </div>

      <div className="space-y-8">
        {/* API Configuration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Key className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">WhatsApp Cloud API Configuration</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Configure your WhatsApp Business API credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                name="accessToken"
                value={settings.accessToken}
                onChange={handleChange}
                placeholder="Enter WhatsApp Cloud API Access Token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Get this from your Meta for Developers account.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                name="phoneNumberId"
                value={settings.phoneNumberId}
                onChange={handleChange}
                placeholder="Enter WhatsApp Phone Number ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">The unique identifier for your WhatsApp Business phone number.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <Shield className="h-5 w-5 text-blue-400 mr-2" />
                <p className="text-sm text-blue-700">
                  Your API credentials are encrypted and stored securely. Only authorized government personnel can access this configuration.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                Configuration saved successfully!
              </div>
            )}
          </form>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Phone className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Connection Status</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Current API connection status.</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                connectionStatus.apiStatus === 'Connected' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {connectionStatus.apiStatus === 'Connected' ? (
                  <span className="text-green-600 text-sm">✓</span>
                ) : (
                  <span className="text-gray-500 text-sm">!</span>
                )}
              </div>
              <div className={`text-sm font-medium ${
                connectionStatus.apiStatus === 'Connected' ? 'text-green-900' : 'text-gray-900'
              }`}>
                {connectionStatus.apiStatus}
              </div>
              <div className="text-xs text-gray-500">API Status</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                connectionStatus.phoneNumber === 'Set' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Phone className={`h-4 w-4 ${
                  connectionStatus.phoneNumber === 'Set' ? 'text-green-600' : 'text-gray-500'
                }`} />
              </div>
              <div className={`text-sm font-medium ${
                connectionStatus.phoneNumber === 'Set' ? 'text-green-900' : 'text-gray-900'
              }`}>
                {connectionStatus.phoneNumber}
              </div>
              <div className="text-xs text-gray-500">Phone Number</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                connectionStatus.serviceStatus === 'Active' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {connectionStatus.serviceStatus === 'Active' ? (
                  <span className="text-green-600 text-sm">✓</span>
                ) : (
                  <span className="text-gray-500 text-sm">!</span>
                )}
              </div>
              <div className={`text-sm font-medium ${
                connectionStatus.serviceStatus === 'Active' ? 'text-green-900' : 'text-gray-900'
              }`}>
                {connectionStatus.serviceStatus}
              </div>
              <div className="text-xs text-gray-500">Service Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
