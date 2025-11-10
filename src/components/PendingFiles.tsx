import React from 'react';
import type { Department, FileInfo } from '../types';
import { FileText, RefreshCw } from 'lucide-react';

interface PendingFilesProps {
  departments: Department[];
  pendingFiles: { [key: string]: FileInfo[] };
  onRefresh: () => void;
}

const PendingFiles: React.FC<PendingFilesProps> = ({
  departments,
  pendingFiles,
  onRefresh
}) => {
  const getTotalFiles = () => {
    return Object.values(pendingFiles).reduce((total, files) => total + files.length, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Pending Files</h3>
          <div className="flex items-center">
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {getTotalFiles()} files
            </span>
            <button
              onClick={onRefresh}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {departments.map((dept) => {
          const files = pendingFiles[dept.code] || [];
          if (files.length === 0) return null;

          return (
            <div key={dept.code} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">{dept.code}</h4>
                <span className="text-xs text-gray-500">{files.length} files</span>
              </div>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-900 truncate">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {getTotalFiles() === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No pending files</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingFiles;
