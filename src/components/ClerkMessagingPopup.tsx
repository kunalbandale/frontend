import React, { useState } from 'react';
import { X, FileText, Users } from 'lucide-react';
import type { Department, FileInfo } from '../types';
import SingleMessageForm from './SingleMessageForm';
import BulkMessageForm from './BulkMessageForm';

interface ClerkMessagingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  departments: Department[];
  onRefresh?: () => void;
}

const ClerkMessagingPopup: React.FC<ClerkMessagingPopupProps> = ({ 
  isOpen, 
  onClose, 
  department, 
  departments,
  onRefresh 
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [selectedPDF, setSelectedPDF] = useState<FileInfo | null>(null);

  if (!isOpen || !department) return null;

  const handlePDFSelect = (pdfFile: FileInfo | null) => {
    setSelectedPDF(pdfFile);
  };

  const handleDepartmentChange = (departmentCode: string) => {
    // This is handled by the parent component
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{department.name}</h2>
            <p className="text-sm text-gray-600">WhatsApp Messaging</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
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
                selectedDepartment={department.code}
                selectedPDF={selectedPDF}
                onDepartmentChange={handleDepartmentChange}
                onPDFSelect={handlePDFSelect}
                onRefresh={onRefresh}
              />
            ) : (
              <BulkMessageForm
                departments={departments}
                selectedDepartment={department.code}
                selectedPDF={selectedPDF}
                onDepartmentChange={handleDepartmentChange}
                onPDFSelect={handlePDFSelect}
                onRefresh={onRefresh}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkMessagingPopup;
