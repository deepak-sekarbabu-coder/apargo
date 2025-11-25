'use client';

import { useEffect, useState } from 'react';

import { getLogger } from '@/lib/core/logger';
import {
  type ConnectionHealth,
  diagnostics,
  healthMonitor,
} from '@/lib/firebase/firebase-health-monitor';

const logger = getLogger('Component');

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FirebaseDebugPanelProps {
  className?: string;
}

export function FirebaseDebugPanel({ className }: FirebaseDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<ConnectionHealth | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const unsubscribe = healthMonitor.onHealthChange(setHealth);
    return unsubscribe;
  }, []);

  const generateDiagnosticReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await diagnostics.generateReport();
      setDiagnosticReport(report);
    } catch (error) {
      setDiagnosticReport(`Error generating report: ${error}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const copyReportToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticReport);
      alert('Diagnostic report copied to clipboard!');
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
    }
  };

  if (!health) {
    return null;
  }

  // Only show debug panel if there are issues or in development mode
  const hasIssues = !health.isConnected || health.errorCount > 0 || health.lastError;
  if (process.env.NODE_ENV === 'production' && !hasIssues) {
    return null;
  }

  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'websocket':
        return 'text-blue-600 dark:text-blue-400';
      case 'long-polling':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${className} ${getStatusColor(health.isConnected)}`}
        >
          Firebase: {health.isConnected ? 'Connected' : 'Disconnected'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Firebase Connection Debug</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="font-semibold mb-2">Connection Status</h3>
              <p className={`text-sm ${getStatusColor(health.isConnected)}`}>
                {health.isConnected ? '✅ Connected' : '❌ Disconnected'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Connection Type</h3>
              <p className={`text-sm ${getConnectionTypeColor(health.connectionType)}`}>
                {health.connectionType}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Error Count</h3>
              <p className="text-sm">{health.errorCount}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Last Success</h3>
              <p className="text-sm">
                {health.lastSuccessfulOperation
                  ? health.lastSuccessfulOperation.toLocaleTimeString()
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Last Error */}
          {health.lastError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Last Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                {health.lastError.message}
              </p>
            </div>
          )}

          {/* Diagnostic Report */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={generateDiagnosticReport} disabled={isGeneratingReport} size="sm">
                {isGeneratingReport ? 'Generating...' : 'Generate Diagnostic Report'}
              </Button>
              {diagnosticReport && (
                <Button onClick={copyReportToClipboard} variant="outline" size="sm">
                  Copy Report
                </Button>
              )}
            </div>

            {diagnosticReport && (
              <ScrollArea className="h-64 w-full border rounded-md p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono">{diagnosticReport}</pre>
              </ScrollArea>
            )}
          </div>

          {/* Quick Fixes */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Quick Fixes</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>{'•'} Try refreshing the page</li>
              <li>{'•'} Check your internet connection</li>
              <li>{'•'} Disable browser extensions temporarily</li>
              <li>{'•'} Try incognito/private browsing mode</li>
              <li>
                {'•'} Check if you{`'`}re behind a corporate firewall
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
