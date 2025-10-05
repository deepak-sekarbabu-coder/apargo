import React from 'react';

export default function HeadMeta() {
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
        content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=yes"
      />
      {/* Fallback meta description (metadata API also injects one). Keeps backward compatibility. */}
      <meta
        name="description"
        content="Apargo platform for expense tracking, maintenance management, announcements, polls and admin workflows."
      />
      {/* Preconnect to required origins for performance */}
      <link rel="preconnect" href="https://firestore.googleapis.com" />
      <link rel="preconnect" href="https://www.gstatic.com" />
      <link rel="preconnect" href="https://firebase.googleapis.com" />
      <link rel="preconnect" href="https://unicorndev-b532a.firebaseapp.com" />
      <link rel="dns-prefetch" href="https://unicorndev-b532a.firebaseapp.com" />
      <link rel="preconnect" href="https://apis.google.com" />
      <link rel="dns-prefetch" href="https://apis.google.com" />
    </>
  );
}
