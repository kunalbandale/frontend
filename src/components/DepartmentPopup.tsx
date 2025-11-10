import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Send, Users, Calendar, Clock } from 'lucide-react';
import type { Department } from '../types';
import SingleMessageForm from './SingleMessageForm';
import BulkMessageForm from './BulkMessageForm';

interface SectionFile {
  id: string;
  name: string;
  recipient: string;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
}

interface DepartmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

const DepartmentPopup: React.FC<DepartmentPopupProps> = ({ isOpen, onClose, department }) => {
  const [files, setFiles] = useState<SectionFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SectionFile | null>(null);
  const [messageType, setMessageType] = useState<'single' | 'bulk'>('single');
  const [selectedPDF, setSelectedPDF] = useState<any>(null);

  useEffect(() => {
    if (isOpen && department) {
      loadFiles();
    }
  }, [isOpen, department]);

  const loadFiles = async () => {
    if (!department) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/admin/sections/${department.code}/pdfs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedFiles: SectionFile[] = data.map((file: any) => ({
          id: file._id,
          name: file.name,
          recipient: file.recipient || 'Unknown',
          uploadedBy: file.uploadedBy || 'Unknown',
          uploadedAt: new Date(file.uploadedAt).toLocaleString(),
          status: file.status || 'UPLOADED'
        }));
        setFiles(formattedFiles);
      } else {
        console.error('Failed to load files');
        setFiles([]);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: SectionFile) => {
    setSelectedFile(file);
    setSelectedPDF({
      id: file.id,
      name: file.name,
      path: '',
      size: 0,
      type: 'application/pdf'
    });
  };

  const handleRefresh = () => {
    loadFiles();
  };

  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{department.name}</h2>
            <p className="text-sm text-gray-600">Department Files & Messaging</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Section Files */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Section Files</h3>
              <p className="text-sm text-gray-600">Select a file to send</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No files found for this department</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2">
                  <div>File Name</div>
                  <div>Recipient</div>
                  <div>Uploaded By</div>
                  <div>Action</div>
                </div>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`grid grid-cols-4 gap-4 py-3 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedFile?.id === file.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="text-sm text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {file.recipient}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {file.uploadedBy}
                    </div>
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileSelect(file);
                        }}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Send Messages */}
          <div className="w-1/2 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Messages</h3>
              
              {/* Message Type Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setMessageType('single')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    messageType === 'single'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Single Message
                </button>
                <button
                  onClick={() => setMessageType('bulk')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    messageType === 'bulk'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bulk Message
                </button>
              </div>

              {/* Message Form */}
              {messageType === 'single' ? (
                <SingleMessageForm
                  departments={[department]}
                  selectedDepartment={department.code}
                  selectedPDF={selectedPDF}
                  onDepartmentChange={() => {}}
                  onPDFSelect={setSelectedPDF}
                  onRefresh={handleRefresh}
                />
              ) : (
                <BulkMessageForm
                  departments={[department]}
                  selectedDepartment={department.code}
                  selectedPDF={selectedPDF}
                  onDepartmentChange={() => {}}
                  onPDFSelect={setSelectedPDF}
                  onRefresh={handleRefresh}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPopup;
