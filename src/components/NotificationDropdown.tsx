import React, { useEffect, useRef } from 'react';
import type { Department, FileInfo } from '../types';
import { FileText, X, RefreshCw } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  pendingFiles: { [key: string]: FileInfo[] };
  onRefresh: () => void;
  loading?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  departments,
  pendingFiles,
  onRefresh,
  loading = false
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getTotalPendingFiles = () => {
    return Object.values(pendingFiles).reduce((total, files) => total + files.length, 0);
  };

  // Don't automatically refresh when dropdown opens - use already loaded data
  // The parent component (ClerkDashboard) will load data on page load and when needed

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <>
      <div ref={dropdownRef} className="absolute right-4 top-16 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900">Pending Files</h3>
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {getTotalPendingFiles()} files
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`p-1 text-gray-400 hover:text-gray-600 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading pending files...</p>
            </div>
          ) : getTotalPendingFiles() === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending files</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {departments.map((dept) => {
                const files = pendingFiles[dept.code] || [];
                if (files.length === 0) return null;

                return (
                  <div key={dept.code} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-1">
                      {dept.name} ({dept.code})
                    </h4>
                    <div className="space-y-1">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {getTotalPendingFiles() > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              {getTotalPendingFiles()} files pending across {departments.filter(d => pendingFiles[d.code]?.length > 0).length} departments
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDropdown;
