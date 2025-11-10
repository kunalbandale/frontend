import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Department, FileInfo } from '../types';
import { departmentAPI } from '../services/api';
import { Bell, LogOut, FileText, Users, ArrowRight } from 'lucide-react';
import PDFSelectionModal from '../components/PDFSelectionModal';
import SingleMessageForm from '../components/SingleMessageForm';
import BulkMessageForm from '../components/BulkMessageForm';
import NotificationDropdown from '../components/NotificationDropdown';
import logoImage from '../assets/logo.jpg';

const ClerkDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<FileInfo | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{ [key: string]: FileInfo[] }>({});
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingFilesLoading, setPendingFilesLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      console.log('Loading departments...');
      const depts = await departmentAPI.getDepartments();
      console.log('Departments loaded:', depts);
      setDepartments(depts);
      // Don't pre-select any department - let user choose
    } catch (error) {
      console.error('Failed to load departments:', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingFiles = useCallback(async () => {
    try {
      setPendingFilesLoading(true);
      console.log('Loading all pending files with consolidated API call');
      
      // Use the new consolidated API endpoint
      const files = await departmentAPI.getAllPendingFiles();
      setPendingFiles(files);
      console.log('All pending files loaded:', files);
    } catch (error) {
      console.error('Failed to load pending files:', error);
      // Fallback to empty object if API fails
      setPendingFiles({});
    } finally {
      setPendingFilesLoading(false);
    }
  }, []); // No dependencies needed since we're using consolidated API

  // Load pending files when departments are loaded
  useEffect(() => {
    if (departments.length > 0) {
      loadPendingFiles();
    }
  }, [departments, loadPendingFiles]);

  const handleLogout = () => {
    logout();
  };

  const handlePDFSelect = (pdfFile: FileInfo | null) => {
    setSelectedPDF(pdfFile);
    setShowPDFModal(false);
  };

  const handleDepartmentChange = (departmentCode: string) => {
    setSelectedDepartment(departmentCode);
    // Show PDF modal when department is selected
    setShowPDFModal(true);
  };

  // Function to refresh pending files after operations
  const refreshPendingFiles = useCallback(() => {
    loadPendingFiles();
  }, [loadPendingFiles]);

  const getTotalPendingFiles = () => {
    return Object.values(pendingFiles).reduce((total, files) => total + files.length, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white relative">
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
                <p className="text-sm text-blue-100">Clerk Dashboard - WhatsApp Messaging</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2" />
                <span>{user?.fullName || 'Clerk'}</span>
              </div>
              <button
                onClick={() => navigate('/outward')}
                className="flex items-center text-white hover:text-blue-200 transition-colors bg-blue-700 px-3 py-1 rounded-md"
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Outward
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-1 text-white hover:text-blue-200 transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {getTotalPendingFiles() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getTotalPendingFiles()}
                    </span>
                  )}
                </button>
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
        
        {/* Notification Dropdown */}
        <NotificationDropdown
          isOpen={showNotificationDropdown}
          onClose={() => setShowNotificationDropdown(false)}
          departments={departments}
          pendingFiles={pendingFiles}
          onRefresh={refreshPendingFiles}
          loading={pendingFilesLoading}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('single')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'single'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Single WhatsApp Message
                  </button>
                  <button
                    onClick={() => setActiveTab('bulk')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'bulk'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Bulk WhatsApp Messages
                  </button>
                </nav>
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-lg shadow-sm">
              {activeTab === 'single' ? (
                <SingleMessageForm
                  departments={departments}
                  selectedDepartment={selectedDepartment}
                  selectedPDF={selectedPDF}
                  onDepartmentChange={handleDepartmentChange}
                  onPDFSelect={handlePDFSelect}
                  onRefresh={refreshPendingFiles}
                />
              ) : (
                <BulkMessageForm
                  departments={departments}
                  selectedDepartment={selectedDepartment}
                  selectedPDF={selectedPDF}
                  onDepartmentChange={handleDepartmentChange}
                  onPDFSelect={handlePDFSelect}
                  onRefresh={refreshPendingFiles}
                />
              )}
            </div>
        </div>
      </div>

      {/* PDF Selection Modal */}
      {showPDFModal && (
        <PDFSelectionModal
          department={selectedDepartment}
          onSelect={handlePDFSelect}
          onClose={() => setShowPDFModal(false)}
        />
      )}
    </div>
  );
};

export default ClerkDashboard;
