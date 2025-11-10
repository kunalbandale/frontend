import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Users, Settings, LogOut, Activity, FileText } from 'lucide-react';
import MessagingLogs from '../components/admin/MessagingLogs';
import ClerkManagement from '../components/admin/ClerkManagement';
import WhatsAppSettings from '../components/admin/WhatsAppSettings';
import SectionStatus from '../components/admin/SectionStatus';
import LiveLogs from '../components/admin/LiveLogs';
import logoImage from '../assets/logo.jpg';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'sections' | 'logs' | 'live' | 'clerks' | 'settings'>('sections');

  const handleLogout = () => {
    logout();
  };

  const tabs = [
    { id: 'sections', label: 'Section Overview', icon: FileText },
    { id: 'logs', label: 'Messaging Logs', icon: BarChart3 },
    { id: 'live', label: 'Live Log', icon: Activity },
    { id: 'clerks', label: 'User Management', icon: Users },
    { id: 'settings', label: 'WhatsApp Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'sections':
        return <SectionStatus />;
      case 'logs':
        return <MessagingLogs />;
      case 'live':
        return <LiveLogs />;
      case 'clerks':
        return <ClerkManagement />;
      case 'settings':
        return <WhatsAppSettings />;
      default:
        return <SectionStatus />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 mr-3">
                <img 
                  src={logoImage} 
                  alt="The Speed Tapalwala Logo" 
                  className="h-full w-full object-contain rounded"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">The Speed Tapalwala - e-Tapalwala</h1>
                <p className="text-sm text-blue-100">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2" />
                <span>{user?.fullName || 'Admin'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="h-1 bg-yellow-400"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
