'use client';

import React, { useEffect, useState } from 'react';

export default function HeadMeta() {
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'rejected' | null>(null);

  useEffect(() => {
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

  return (
    <>
      {/* Fallback static title; Next.js metadata API will manage dynamic titles, but adding this ensures an immediate <title> for crawlers and Lighthouse during initial HTML streaming. */}
      <title>Apargo – Smart Property &amp; Maintenance Management</title>
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      {/* Enhanced mobile optimization */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="msapplication-tap-highlight" content="no" />
      {/* Fallback meta description (metadata API also injects one). Keeps backward compatibility. */}
      <meta
        name="description"
        content="Apargo platform for expense tracking, maintenance management, announcements, polls and admin workflows."
      />
      {/* Privacy and cookie policy */}
      <meta name="privacy-policy" content="/privacy" />
      <meta name="cookie-policy" content="/cookies" />
      {/* Preconnect to required origins for performance */}
      <link rel="preconnect" href="https://firestore.googleapis.com" />
      <link rel="preconnect" href="https://www.gstatic.com" />
      <link rel="preconnect" href="https://firebase.googleapis.com" />
      <link rel="preconnect" href="https://unicorndev-b532a.firebaseapp.com" />
      <link rel="dns-prefetch" href="https://unicorndev-b532a.firebaseapp.com" />
      <link rel="preconnect" href="https://apis.google.com" />
      <link rel="dns-prefetch" href="https://apis.google.com" />
      
      {/* Cookie Consent Banner */}
      {cookieConsent === null && (
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
            We use Firebase services for authentication and data storage. These may use cookies. 
            By continuing, you agree to our use of essential cookies for app functionality.
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
      )}
    </>
  );
}
