import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Pagination from '../Pagination';

interface AdminLog {
  id: string;
  timestamp: string;
  action: string;
  type: 'ADD' | 'DELETE' | 'MODIFY' | 'SEND';
  performedBy: string;
  details: string;
}

const LiveLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadLogs();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      
      const response = await fetch(`https://backend-obnm.onrender.com/admin/admin-logs?limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allLogs = data.logs || [];
        
        // Client-side pagination
        const startIndex = (page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedLogs = allLogs.slice(startIndex, endIndex);
        
        setLogs(paginatedLogs);
        
        // Update pagination
        const total = allLogs.length;
        const pages = Math.ceil(total / pagination.limit);
        setPagination(prev => ({
          ...prev,
          page,
          total,
          pages
        }));
      } else {
        console.error('Failed to load admin logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ADD':
        return 'bg-green-100 text-green-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'MODIFY':
        return 'bg-blue-100 text-blue-800';
      case 'SEND':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadLogs(newPage);
    }
  };


  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Live System Log</h2>
          <button
            onClick={(e: React.MouseEvent) => loadLogs()}
            disabled={loading}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className="text-gray-600">Real-time tracking of all system activities</p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No admin activities logged yet. Activities will appear here when admins perform actions like creating/updating users or sections.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(log.type)}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.performedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        )}
      </div>
    </div>
  );
};

export default LiveLogs;
