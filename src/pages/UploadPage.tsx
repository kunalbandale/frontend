import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import logoImage from '../assets/logo.jpg';

interface LogEntry {
  id: string;
  fileName: string;
  recipient: string;
  uploadedAt: string;
  status: 'UPLOADED' | 'SENT' | 'FAILED';
  sentAt: string;
  uploadedBy: string;
}

const UploadPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'logs'>('upload');
  const [formData, setFormData] = useState({
    mobileNumber: '',
    pdfFile: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, sent: 0, failed: 0 });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const department = user?.department;
      if (!department) {
        setError('Department not found');
        setLogsLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:4000/admin/sections/${department}/logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const sectionPDFs = await response.json();
        const convertedLogs: LogEntry[] = sectionPDFs.map((pdf: any) => ({
          id: pdf.id,
          fileName: pdf.name,
          recipient: pdf.recipient,
          uploadedAt: new Date(pdf.uploadedAt).toLocaleString(),
          status: pdf.status,
          sentAt: pdf.sentAt ? new Date(pdf.sentAt).toLocaleString() : '-',
          uploadedBy: pdf.uploadedBy || 'Unknown'
        }));
        setLogs(convertedLogs);
        
        // Calculate stats
        const pending = convertedLogs.filter(log => log.status === 'UPLOADED').length;
        const sent = convertedLogs.filter(log => log.status === 'SENT').length;
        const failed = convertedLogs.filter(log => log.status === 'FAILED').length;
        setStats({ pending, sent, failed });
      } else {
        console.error('Failed to load logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (file.size > 1024 * 1024) { // 1MB limit
        setError('File size must be less than 1MB');
        return;
      }
      setFormData(prev => ({ ...prev, pdfFile: file }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mobileNumber || !formData.pdfFile) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('mobileNumber', formData.mobileNumber);
      formDataToSend.append('pdfFile', formData.pdfFile);
      formDataToSend.append('department', user?.department || '');

      const response = await fetch('http://localhost:4000/send/section-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        setSuccess('PDF uploaded successfully!');
        setFormData({ mobileNumber: '', pdfFile: null });
        // Reset file input
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Reload logs to update stats
        loadLogs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'UPLOADED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="h-4 w-4" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4" />;
      case 'UPLOADED':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

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
                <h1 className="text-xl font-bold">E-Tapalwala</h1>
                <p className="text-sm text-blue-100">{user?.department} - Section Clerk</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center text-sm">
                  <span className="mr-2">👤</span>
                  <span>{user?.fullName || 'Section User'}</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex space-x-8 px-6 py-4">
            <button 
              onClick={() => setActiveTab('upload')}
              className={`flex items-center pb-2 ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload PDF for Outward
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex items-center pb-2 ${
                activeTab === 'logs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              My Logs
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {activeTab === 'upload' ? (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload PDF</h2>
              <p className="text-gray-600 mb-6">Upload document to send via WhatsApp</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="+91-XXXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF Document (Max 1MB)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {formData.pdfFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="text-sm font-medium text-gray-900">{formData.pdfFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(formData.pdfFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, pdfFile: null }))}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div className="text-sm text-gray-600">
                          <label htmlFor="pdfFile" className="cursor-pointer">
                            <span className="font-medium text-blue-600 hover:text-blue-500">
                              Upload PDF
                            </span>
                            <input
                              type="file"
                              id="pdfFile"
                              accept=".pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    File will be renamed to recipient mobile number
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Submit'}
                </button>

                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm flex items-center">
                  <span className="mr-2">ℹ️</span>
                  File will be sent to Outward Section for WhatsApp delivery
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">My Upload Logs</h2>
                <p className="text-gray-600">Complete history of uploaded files</p>
              </div>

              {logsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading logs...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">{log.fileName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.recipient}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.uploadedAt}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                              {getStatusIcon(log.status)}
                              <span className="ml-1">{log.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.sentAt}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.uploadedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No uploads found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
            {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
