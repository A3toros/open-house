// Tab with Refresh Component for Teacher Cabinet Optimization
// Provides reusable tab component with refresh functionality

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useDataCache } from '../hooks/useDataCache';
import LoadingSpinner from './ui/LoadingSpinner';

export const TabWithRefresh = ({ 
  tabName, 
  loader, 
  children, 
  classKey = null,
  onDataUpdate = null 
}) => {
  const [lastRefresh, setLastRefresh] = useState(null);
  const { data, loading, error, loadData, isCached } = useDataCache(tabName, loader, classKey);

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    await loadData(true);
    setLastRefresh(new Date());
    
    // Notify parent component of data update
    if (onDataUpdate) {
      onDataUpdate(data);
    }
  };

  // Format last refresh time
  const formatLastRefresh = (date) => {
    if (!date) return null;
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Tab Header with Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold capitalize">{tabName} Management</h2>
          {isCached() && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              📦 Cached
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-sm text-gray-500">
              Last updated: {formatLastRefresh(lastRefresh)}
            </span>
          )}
          
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading {tabName} data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab Content */}
      {children(data, loading, error)}
    </div>
  );
};

export default TabWithRefresh;
