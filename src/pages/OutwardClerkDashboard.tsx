import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder, FileText, Users, ArrowRight } from 'lucide-react';
import logoImage from '../assets/logo.jpg';
import type { Department, FileInfo } from '../types';
import { departmentAPI } from '../services/api';
import SingleMessageForm from '../components/SingleMessageForm';
import BulkMessageForm from '../components/BulkMessageForm';

interface DepartmentWithCount extends Department {
  pdfCount: number;
}

interface SectionFile {
  id: string;
  name: string;
  filename: string;
  recipient: string;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
  size: number;
}

const OutwardClerkDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepartmentView, setShowDepartmentView] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [files, setFiles] = useState<SectionFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<FileInfo | null>(null);
  const [filePage, setFilePage] = useState(1);
  const [filesPerPage] = useState(12);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const depts = await departmentAPI.getDepartments();
      
      // Get PDF counts for each department
      const departmentsWithCounts = await Promise.all(
        depts.map(async (dept) => {
          try {
            const response = await fetch(`http://localhost:4000/admin/sections/${dept.code}/pdfs`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            const pdfs = response.ok ? await response.json() : [];
            return { ...dept, pdfCount: pdfs.length };
          } catch (error) {
            console.error(`Failed to load PDF count for ${dept.code}:`, error);
            return { ...dept, pdfCount: 0 };
          }
        })
      );
      
      setDepartments(departmentsWithCounts);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB');
    const time = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return { date, time };
  };

  const { date, time } = getCurrentDateTime();

  const loadFiles = async (department: Department) => {
    try {
      setFilesLoading(true);
      resetFilePagination(); // Reset pagination when loading new files
      const response = await fetch(`http://localhost:4000/admin/sections/${department.code}/pdfs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedFiles: SectionFile[] = data.map((file: any) => ({
          id: file.id,
          name: file.originalName || file.name,
          filename: file.name, // Store the actual filename for fetching
          recipient: file.recipient || 'Unknown',
          uploadedBy: file.uploadedBy || 'Unknown',
          uploadedAt: new Date(file.uploadedAt).toLocaleString(),
          status: 'UPLOADED',
          size: file.size || 0
        }));
        setFiles(formattedFiles);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load files:', errorData);
        setFiles([]);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleDepartmentClick = (department: DepartmentWithCount) => {
    setSelectedDepartment(department);
    setShowDepartmentView(true);
    loadFiles(department);
  };

  const handleBackToDepartments = () => {
    setShowDepartmentView(false);
    setSelectedDepartment(null);
    setFiles([]);
    setSelectedPDF(null);
  };

  const handleFileSelect = (file: SectionFile) => {
    setSelectedPDF({
      id: file.id,
      name: file.filename, // Use filename for fetching
      path: '', // This will be handled by the messaging forms
      size: file.size,
      type: 'application/pdf'
    });
  };

  const handlePDFSelect = (pdfFile: FileInfo | null) => {
    setSelectedPDF(pdfFile);
  };

  const handleRefresh = () => {
    if (selectedDepartment) {
      loadFiles(selectedDepartment);
    }
  };

  // Pagination functions
  const getPaginatedFiles = () => {
    const startIndex = (filePage - 1) * filesPerPage;
    const endIndex = startIndex + filesPerPage;
    return files.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(files.length / filesPerPage);
  };

  const handleFilePageChange = (newPage: number) => {
    setFilePage(newPage);
  };

  const resetFilePagination = () => {
    setFilePage(1);
  };

  // Smooth tab switching handler
  const handleTabChange = (tab: 'single' | 'bulk') => {
    if (tab === activeTab) return;
    setIsSwitchingTab(true);
    setActiveTab(tab);
    // end fade-in after a short delay
    setTimeout(() => setIsSwitchingTab(false), 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
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
              {/* {showDepartmentView && (
                <button
                  onClick={handleBackToDepartments}
                  className="mr-4 flex items-center text-white hover:text-blue-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  Back
                </button>
              )} */}
              <div className="h-10 w-10 mr-3">
                <img 
                  src={logoImage} 
                  alt="The Speed Tapalwala Logo" 
                  className="h-full w-full object-contain rounded"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">E-Tapalwala</h1>
                <p className="text-sm text-blue-100">
                  {showDepartmentView && selectedDepartment 
                    ? `${selectedDepartment.name} - Outward Section`
                    : 'Outward Clerk Dashboard'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {showDepartmentView && (
                <button
                  onClick={handleBackToDepartments}
                  className="mr-4 flex items-center text-white hover:text-blue-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  Back to Sections
                </button>
              )}
              <div className="text-right">
                <div className="flex items-center text-sm">
                  <span className="mr-2">👤</span>
                  <span>{user?.email || user?.fullName || 'Clerk'}</span>
                </div>
                <div className="text-xs text-blue-100">
                  Login: {date}, {time}
                </div>
                <div className="text-xs text-blue-100">
                  Date: {date}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="h-1 bg-yellow-400"></div>
      </div>

      {!showDepartmentView ? (
        // Department Selection View - Folder Cards
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Section</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {departments.map((dept) => (
                <div
                  key={dept.code}
                  onClick={() => handleDepartmentClick(dept)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-400 hover:scale-105"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-2 border-blue-200">
                      <Folder className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{dept.name}</h3>
                    <span className="bg-blue-600 text-white text-xs px-4 py-2 rounded-full font-medium">
                      {dept.pdfCount} files
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Department Files and Messaging View
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Panel - Section Files */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Section Files</h3>
                <p className="text-xs text-gray-600">Select a file to send</p>
              </div>

              {filesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading files...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No files found for this department</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                    <div>File Name</div>
                    <div>Recipient</div>
                    <div>Uploaded By</div>
                    <div>Action</div>
                  </div>
                  
                  {/* Table Rows */}
                  {getPaginatedFiles().map((file) => (
                    <div
                      key={file.id}
                      className={`grid grid-cols-4 gap-3 py-2 px-2 rounded hover:bg-gray-50 cursor-pointer transition-all duration-200 border ${
                        selectedPDF?.id === file.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'border-transparent hover:border-gray-200'
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {file.recipient}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {file.uploadedBy}
                      </div>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSelect(file);
                          }}
                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            selectedPDF?.id === file.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {selectedPDF?.id === file.id ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        Showing {((filePage - 1) * filesPerPage) + 1} to {Math.min(filePage * filesPerPage, files.length)} of {files.length} files
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFilePageChange(filePage - 1)}
                          disabled={filePage === 1}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded">
                          {filePage} of {getTotalPages()}
                        </span>
                        <button
                          onClick={() => handleFilePageChange(filePage + 1)}
                          disabled={filePage === getTotalPages()}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Send Messages */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Send Messages</h3>
                
                {/* Message Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => handleTabChange('single')}
                    className={`flex-1 py-2 px-4 rounded-md text-xs font-semibold transition-all duration-200 ${
                      activeTab === 'single'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Single Message
                  </button>
                  <button
                    onClick={() => handleTabChange('bulk')}
                    className={`flex-1 py-2 px-4 rounded-md text-xs font-semibold transition-all duration-200 ${
                      activeTab === 'bulk'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Bulk Message
                  </button>
                </div>

                {/* Message Form - render without inner scroll to match design */}
                <div className={`transition-opacity duration-300 ease-in-out ${isSwitchingTab ? 'opacity-0' : 'opacity-100'}`}>
                  {!selectedDepartment ? (
                    <div className="text-sm text-gray-600">Please select a department and a file to begin.</div>
                  ) : activeTab === 'single' ? (
                    <SingleMessageForm
                      departments={[selectedDepartment]}
                      selectedDepartment={selectedDepartment.code}
                      selectedPDF={selectedPDF}
                      onDepartmentChange={() => {}}
                      onPDFSelect={handlePDFSelect}
                      onRefresh={handleRefresh}
                    />
                  ) : (
                    <BulkMessageForm
                      departments={[selectedDepartment]}
                      selectedDepartment={selectedDepartment.code}
                      selectedPDF={selectedPDF}
                      onDepartmentChange={() => {}}
                      onPDFSelect={handlePDFSelect}
                      onRefresh={handleRefresh}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutwardClerkDashboard;
