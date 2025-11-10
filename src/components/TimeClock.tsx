import React, { useState, useEffect } from 'react';
import { Clock, Timer } from 'lucide-react';

interface TimeClockProps {
  startTime?: Date;
  estimatedDuration?: number; // in seconds
  totalItems?: number;
  processedItems?: number;
  className?: string;
}

const TimeClock: React.FC<TimeClockProps> = ({ 
  startTime, 
  estimatedDuration, 
  totalItems = 0, 
  processedItems = 0,
  className = ""
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);

        // Calculate remaining time based on progress
        if (totalItems > 0 && processedItems > 0) {
          const progress = processedItems / totalItems;
          const estimatedTotal = elapsed / progress;
          const remaining = Math.max(0, estimatedTotal - elapsed);
          setRemainingTime(Math.floor(remaining));
        } else if (estimatedDuration) {
          setRemainingTime(Math.max(0, estimatedDuration - elapsed));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, totalItems, processedItems, estimatedDuration]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (totalItems === 0) return 0;
    return Math.min(100, (processedItems / totalItems) * 100);
  };

  const getStatusColor = (): string => {
    const progress = getProgressPercentage();
    if (progress < 30) return 'text-red-600';
    if (progress < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = (): string => {
    const progress = getProgressPercentage();
    if (progress === 0) return 'Starting...';
    if (progress < 30) return 'In Progress';
    if (progress < 70) return 'Almost Halfway';
    if (progress < 100) return 'Almost Done';
    return 'PDF sent successfully';
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border-2 border-blue-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${getProgressPercentage() === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
            {getProgressPercentage() === 100 ? (
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <Clock className="h-6 w-6 text-white" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {getProgressPercentage() === 100 ? '✅ PDF Sent Successfully' : '🚀 Processing Status'}
          </h3>
        </div>
        <div className="text-sm font-medium text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm">
          ⏰ {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
          <span className="flex items-center">
            {getProgressPercentage() === 100 ? '✅ Status' : '📊 Progress'}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getProgressPercentage() === 100 ? 'bg-green-100 text-green-600' : `${getStatusColor().replace('text-', 'bg-').replace('-600', '-100')} ${getStatusColor()}`}`}>
            {getStatusText()}
          </span>
        </div>
        <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-4 shadow-inner">
          <div 
            className={`h-4 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden ${
              getProgressPercentage() === 100 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs font-medium text-gray-600 mt-2">
          <span className="flex items-center">
            📦 {processedItems} of {totalItems} items
          </span>
          <span className="text-blue-600 font-bold">
            {getProgressPercentage().toFixed(1)}% Complete
          </span>
        </div>
      </div>

      {/* Time Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center bg-white rounded-lg p-4 shadow-sm border-2 border-blue-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Timer className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">⏱️ Elapsed</span>
          </div>
          <div className="text-xl font-mono font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        <div className="text-center bg-white rounded-lg p-4 shadow-sm border-2 border-green-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="p-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">🎯 Remaining</span>
          </div>
          <div className="text-xl font-mono font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {remainingTime !== null ? formatTime(remainingTime) : 'Calculating...'}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {startTime && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Started at {startTime.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeClock;
