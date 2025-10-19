import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { Bell, X } from 'lucide-react';

const GV_NotificationsPanel: React.FC = () => {
  // Zustand store selectors
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Ref for detecting clicks outside the panel
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle panel visibility
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };
  
  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <>
      <div className="relative" ref={panelRef}>
        {/* Notification Bell Icon */}
        <button
          onClick={togglePanel}
          className="p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
          aria-label="Notifications"
          aria-expanded={isPanelOpen}
        >
          <Bell className="h-6 w-6" />
          {/* Placeholder for notification badge - would show count in future */}
          <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
        </button>
        
        {/* Notifications Panel Dropdown */}
        {isPanelOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">الإشعارات</h3>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close notifications"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="p-4">
              {/* Empty State */}
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد إشعارات</h3>
                <p className="mt-1 text-gray-500">
                  سيتم عرض الإشعارات هنا عندما تتاح
                </p>
              </div>
              
              {/* Future notification items would go here */}
              {/* 
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
              */}
            </div>
            
            {/* Panel Footer */}
            <div className="border-t border-gray-200 p-4">
              <p className="text-xs text-gray-500 text-center">
                نظام الإشعارات قادم في تحديث لاحق
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GV_NotificationsPanel;