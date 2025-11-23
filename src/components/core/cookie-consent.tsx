'use client';

import React, { useEffect, useState } from 'react';

export function CookieConsent() {
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'rejected' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to avoid hydration mismatch
    setMounted(true);

    // Check for existing cookie consent
    const stored = localStorage.getItem('cookie-consent');
    if (stored) {
      setCookieConsent(stored as 'accepted' | 'rejected');
    }
  }, []);

  const handleCookieConsent = (choice: 'accepted' | 'rejected') => {
    setCookieConsent(choice);
    localStorage.setItem('cookie-consent', choice);

    if (choice === 'rejected') {
      // Clear existing third-party cookies
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
        if (name.includes('firebase') || name.includes('google')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
      });
    }
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted || cookieConsent !== null) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1f2937',
        color: 'white',
        padding: '16px',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <p style={{ margin: 0, fontSize: '14px', flex: 1, minWidth: '200px' }}>
        We use Firebase services for authentication and data storage. These may use cookies. By
        continuing, you agree to our use of essential cookies for app functionality.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => handleCookieConsent('rejected')}
          style={{
            padding: '8px 16px',
            border: '1px solid #6b7280',
            background: 'transparent',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reject Non-Essential
        </button>
        <button
          onClick={() => handleCookieConsent('accepted')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
