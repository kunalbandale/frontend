import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, ArrowLeft } from 'lucide-react';
import logoImage from '../assets/logo.jpg';

interface LogEntry {
  id: string;
  fileName: string;
  recipient: string;
  uploadedAt: string;
  status: 'Pending' | 'Sent' | 'Delivered';
  sentAt: string;
  senderName: string;
}

const LogsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Load section PDFs for the user's department only
      const department = user?.department;
      if (!department) {
        setError('Department not found');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:4000/admin/sections/${department}/pdfs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const sectionPDFs = await response.json();
        // Convert section PDFs to LogEntry format
        const convertedLogs: LogEntry[] = sectionPDFs.map((pdf: any) => ({
          id: pdf.id,
          fileName: pdf.name,
          recipient: pdf.recipient,
          uploadedAt: new Date(pdf.uploadedAt).toLocaleString(),
          status: pdf.status === 'UPLOADED' ? 'Pending' : 
                  pdf.status === 'SENT' ? 'Sent' : 
                  pdf.status === 'FAILED' ? 'Failed' : 'Pending',
          sentAt: pdf.status === 'UPLOADED' ? '-' : 
                  pdf.sentAt ? new Date(pdf.sentAt).toLocaleString() : '-',
          senderName: pdf.uploadedBy || 'Unknown'
        }));
        setLogs(convertedLogs);
      } else {
        console.error('Failed to load logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs([]);
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
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                  <span>{user?.email}</span>
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
            <button className="flex items-center text-gray-500 hover:text-gray-700 pb-2">
              <Upload className="h-5 w-5 mr-2" />
              Upload PDF for Outward
            </button>
            <button className="flex items-center text-blue-600 border-b-2 border-blue-600 pb-2">
              <FileText className="h-5 w-5 mr-2" />
              My Logs
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Upload Logs</h2>
            <p className="text-gray-600">Complete history of uploaded files</p>
          </div>

          {loading ? (
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
                      Sender Name
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.sentAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.senderName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
