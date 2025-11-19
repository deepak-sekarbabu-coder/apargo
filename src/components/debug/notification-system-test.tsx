'use client';

import { useAuth } from '@/context/auth-context';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';

import { useEffect, useState } from 'react';

import { db } from '@/lib/firebase/firebase';
import { getFirebaseSetupGuide, validateFirebaseConfig } from '@/lib/firebase/firebase-config-validator';
import { type ConnectionHealth, healthMonitor } from '@/lib/firebase/firebase-health-monitor';
import { NotificationListener } from '@/lib/notifications/notification-listener';
import type { Notification } from '@/lib/core/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export function NotificationSystemTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [health, setHealth] = useState<ConnectionHealth | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [listener, setListener] = useState<NotificationListener | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = healthMonitor.onHealthChange(setHealth);
    return unsubscribe;
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests: TestResult[] = [
      { name: 'Firebase Configuration', status: 'pending', message: 'Validating...' },
      { name: 'Authentication', status: 'pending', message: 'Checking...' },
      { name: 'Firestore Connection', status: 'pending', message: 'Testing...' },
      { name: 'Firestore Rules', status: 'pending', message: 'Validating...' },
      { name: 'Notification Query', status: 'pending', message: 'Testing...' },
      { name: 'Real-time Listener', status: 'pending', message: 'Setting up...' },
    ];

    setTestResults([...tests]);

    // Test 1: Firebase Configuration
    try {
      const configValidation = validateFirebaseConfig();
      if (configValidation.isValid) {
        tests[0] = {
          name: 'Firebase Configuration',
          status: 'success',
          message: 'Configuration valid',
          details:
            configValidation.warnings.length > 0
              ? `Warnings: ${configValidation.warnings.join(', ')}`
              : undefined,
        };
      } else {
        tests[0] = {
          name: 'Firebase Configuration',
          status: 'error',
          message: 'Configuration invalid',
          details: configValidation.errors.join(', '),
        };
      }
    } catch (error) {
      tests[0] = {
        name: 'Firebase Configuration',
        status: 'error',
        message: 'Validation failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
    setTestResults([...tests]);

    // Test 2: Authentication
    try {
      if (user) {
        tests[1] = {
          name: 'Authentication',
          status: 'success',
          message: `Authenticated as ${user.email}`,
          details: `Apartment: ${user.apartment || 'Not set'}, Role: ${user.role || 'Not set'}`,
        };
      } else {
        tests[1] = {
          name: 'Authentication',
          status: 'error',
          message: 'Not authenticated',
          details: 'User must be logged in to receive notifications',
        };
      }
    } catch (error) {
      tests[1] = {
        name: 'Authentication',
        status: 'error',
        message: 'Auth check failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
    setTestResults([...tests]);

    // Test 3: Firestore Connection
    try {
      const testDoc = doc(db, 'test', 'connection');
      await setDoc(testDoc, { timestamp: new Date(), test: true });
      tests[2] = {
        name: 'Firestore Connection',
        status: 'success',
        message: 'Connection successful',
      };
    } catch (error) {
      tests[2] = {
        name: 'Firestore Connection',
        status: 'error',
        message: 'Connection failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
    setTestResults([...tests]);

    // Test 4: Firestore Rules
    try {
      const notificationsRef = collection(db, 'notifications');
      const testQuery = query(notificationsRef, where('test', '==', true));
      await getDocs(testQuery);
      tests[3] = {
        name: 'Firestore Rules',
        status: 'success',
        message: 'Rules allow read access',
      };
    } catch (error) {
      tests[3] = {
        name: 'Firestore Rules',
        status: 'error',
        message: 'Rules deny access',
        details: error instanceof Error ? error.message : String(error),
      };
    }
    setTestResults([...tests]);

    // Test 5: Notification Query
    if (user?.apartment) {
      try {
        const notificationsRef = collection(db, 'notifications');
        const apartmentQuery = query(
          notificationsRef,
          where('toApartmentId', '==', user.apartment)
        );
        const snapshot = await getDocs(apartmentQuery);
        tests[4] = {
          name: 'Notification Query',
          status: 'success',
          message: `Found ${snapshot.size} notifications`,
          details: `Query for apartment ${user.apartment} executed successfully`,
        };
      } catch (error) {
        tests[4] = {
          name: 'Notification Query',
          status: 'error',
          message: 'Query failed',
          details: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      tests[4] = {
        name: 'Notification Query',
        status: 'error',
        message: 'No apartment assigned',
        details: 'User must have an apartment to receive notifications',
      };
    }
    setTestResults([...tests]);

    // Test 6: Real-time Listener
    if (user?.apartment) {
      try {
        const testListener = new NotificationListener({
          apartment: user.apartment,
          onNotifications: notifs => {
            setNotifications(notifs);
            tests[5] = {
              name: 'Real-time Listener',
              status: 'success',
              message: `Listener active, ${notifs.length} notifications`,
              details: 'Real-time updates working',
            };
            setTestResults([...tests]);
          },
          onError: error => {
            tests[5] = {
              name: 'Real-time Listener',
              status: 'error',
              message: 'Listener failed',
              details: error.message,
            };
            setTestResults([...tests]);
          },
          retryDelay: 1000,
          maxRetries: 3,
        });

        testListener.start();
        setListener(testListener);

        // Give the listener time to connect
        setTimeout(() => {
          if (tests[5].status === 'pending') {
            tests[5] = {
              name: 'Real-time Listener',
              status: 'error',
              message: 'Listener timeout',
              details: 'No response from listener after 5 seconds',
            };
            setTestResults([...tests]);
          }
        }, 5000);
      } catch (error) {
        tests[5] = {
          name: 'Real-time Listener',
          status: 'error',
          message: 'Setup failed',
          details: error instanceof Error ? error.message : String(error),
        };
        setTestResults([...tests]);
      }
    } else {
      tests[5] = {
        name: 'Real-time Listener',
        status: 'error',
        message: 'No apartment assigned',
        details: 'Cannot set up listener without apartment',
      };
      setTestResults([...tests]);
    }

    setIsRunning(false);
  };

  const stopListener = () => {
    if (listener) {
      listener.stop();
      setListener(null);
      setNotifications([]);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Test Notification System
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Notification System Diagnostics</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tests" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="notifications">Live Data</TabsTrigger>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runTests} disabled={isRunning}>
                {isRunning ? 'Running Tests...' : 'Run Diagnostic Tests'}
              </Button>
              {listener && (
                <Button onClick={stopListener} variant="outline">
                  Stop Listener
                </Button>
              )}
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {testResults.map((test, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getStatusIcon(test.status)}</span>
                      <span className="font-medium">{test.name}</span>
                      <span className={`text-sm ${getStatusColor(test.status)}`}>
                        {test.message}
                      </span>
                    </div>
                    {test.details && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                        {test.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            {health && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Connection Status</h4>
                  <p className={health.isConnected ? 'text-green-600' : 'text-red-600'}>
                    {health.isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Connection Type</h4>
                  <p>{health.connectionType}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Error Count</h4>
                  <p>{health.errorCount}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Last Success</h4>
                  <p className="text-sm">
                    {health.lastSuccessfulOperation?.toLocaleString() || 'Never'}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Live Notifications ({notifications.length})</h4>
              <ScrollArea className="h-48">
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                      >
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()} •
                          {typeof notification.isRead === 'boolean' && notification.isRead ? ' Read' : ' Unread'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No notifications received</p>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <ScrollArea className="h-64">
              <pre className="text-xs whitespace-pre-wrap">{getFirebaseSetupGuide()}</pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
