'use client'

import { useEffect } from 'react';
import { toast } from 'sonner';

export function NotificationChecker() {
  useEffect(() => {
    const checkPendingNotifications = async () => {
      const pendingNotificationId = localStorage.getItem('notification_id');
      console.log('[NotificationChecker] Checking localStorage for notification_id:', pendingNotificationId);
      if (!pendingNotificationId) return;

      try {
        console.log(`Checking notification status for ID: ${pendingNotificationId}`);
        const response = await fetch(`http://localhost:3001/api/users/notification/${pendingNotificationId}`);
        
        if (!response.ok) {
          console.log(`[NotificationChecker] API error status: ${response.status}`);
          return;
        }
        const data = await response.json();
        console.log('Notification response:', data);
        
        if (data.is_sent && data.preview_url) {
          // Show toast with preview URL
          console.log('Email sent with preview URL:', data.preview_url);
          toast(
            <div>
              <p>Welcome email sent!</p>
              <p>
                <a 
                  href={data.preview_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="underline font-medium"
                >
                  View Preview Email
                </a>
              </p>
            </div>,
            {
              duration: 10000,
              action: {
                label: "Open",
                onClick: () => window.open(data.preview_url, '_blank')
              }
            }
          );
          
          // Clear the pending notification
          localStorage.removeItem('notification_id');
        }
      } catch (error) {
        console.error('Error checking notification:', error);
      }
    };
    
    // Check immediately and every 5 seconds
    checkPendingNotifications();
    const interval = setInterval(checkPendingNotifications, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // This component doesn't render anything
  return null;
}