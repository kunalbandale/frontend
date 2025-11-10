import React, { useState, useEffect } from 'react';
import type { Department } from '../../types';
import { departmentAPI } from '../../services/api';
import { Download, RefreshCw } from 'lucide-react';
import Pagination from '../Pagination';

interface SectionStats {
  sectionName: string;
  sectionCode: string;
  sentToday: number;
  totalSent: number;
  failed: number;
  lastActivity: string;
}

const SectionStatus: React.FC = () => {
  const [sections, setSections] = useState<Department[]>([]);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const depts = await departmentAPI.getDepartments();
      setSections(depts);
      
      // Load stats for each section
      const statsPromises = depts.map(async (dept) => {
        try {
          // Get today's date range
          const today = new Date();
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);

          // Get message logs for this section
          const response = await fetch(`http://localhost:4000/send/messages?department=${dept.code}&dateFrom=${startOfDay.toISOString()}&dateTo=${endOfDay.toISOString()}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const messages = data.messages || [];
            
            const sentToday = messages.filter((msg: any) => msg.status === 'SENT').length;
            const totalSent = messages.filter((msg: any) => msg.status === 'SENT').length;
            const failed = messages.filter((msg: any) => msg.status === 'FAILED').length;
            
            // Get last activity time
            const lastMessage = messages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const lastActivity = lastMessage ? getTimeAgo(new Date(lastMessage.createdAt)) : 'No activity';

            return {
              sectionName: dept.name,
              sectionCode: dept.code,
              sentToday,
              totalSent,
              failed,
              lastActivity
            };
          } else {
            return {
              sectionName: dept.name,
              sectionCode: dept.code,
              sentToday: 0,
              totalSent: 0,
              failed: 0,
              lastActivity: 'No activity'
            };
          }
        } catch (error) {
          console.error(`Failed to load stats for ${dept.code}:`, error);
          return {
            sectionName: dept.name,
            sectionCode: dept.code,
            sentToday: 0,
            totalSent: 0,
            failed: 0,
            lastActivity: 'No activity'
          };
        }
      });

      const stats = await Promise.all(statsPromises);
      setSectionStats(stats);
      
      // Update pagination
      const total = stats.length;
      const pages = Math.ceil(total / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total,
        pages
      }));
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getPaginatedStats = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return sectionStats.slice(startIndex, endIndex);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Section Name', 'Section Code', 'Sent Today', 'Total Sent', 'Failed', 'Last Activity'],
      ...sectionStats.map(stat => [
        stat.sectionName,
        stat.sectionCode,
        stat.sentToday.toString(),
        stat.totalSent.toString(),
        stat.failed.toString(),
        stat.lastActivity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `section-status-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading section status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">All Sections Status</h2>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        <p className="text-gray-600">Real-time overview of file delivery across all sections</p>
      </div>

      {/* Section Status Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedStats().length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No sections found
                  </td>
                </tr>
              ) : (
                getPaginatedStats().map((stat, index) => (
                  <tr key={stat.sectionCode} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.sectionName} ({stat.sectionCode})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {stat.sentToday}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-green-600 font-medium">
                        {stat.totalSent}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.failed > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {stat.failed}
                        </span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.lastActivity}
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

export default SectionStatus;
