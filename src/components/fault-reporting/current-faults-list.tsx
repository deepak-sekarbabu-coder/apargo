'use client';

import { useAuth } from '@/context/auth-context';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { deleteFault, getFaults, updateFault } from '@/lib/firestore';
import type { Fault } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CurrentFaultsList() {
  const { user, loading: authLoading } = useAuth();
  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFaults = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await getFaults();

      const currentFaults = all.filter(f => !f.fixed);

      setFaults(currentFaults);
    } catch (err) {
      console.error('❌ Error fetching faults:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load faults';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch faults when auth context is loaded
    if (!authLoading) {
      fetchFaults();
    }
  }, [authLoading, user]);

  const handleMarkFixed = async (id: string) => {
    await updateFault(id, { fixed: true, fixedAt: new Date().toISOString() });
    fetchFaults();
  };
  const handleDelete = async (id: string) => {
    await deleteFault(id);
    fetchFaults();
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Current Faults</CardTitle>
        </CardHeader>
        <CardContent>
          {authLoading || loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : faults.length === 0 ? (
            <div>No current faults reported.</div>
          ) : (
            <div className="space-y-6">
              {faults.map(fault => (
                <div key={fault.id} className="border rounded-lg p-4 bg-muted">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {fault.images.map((fileUrl, i) => {
                      const isPdf = /\.pdf($|\?)/i.test(fileUrl);
                      return isPdf ? (
                        <a
                          key={i}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline"
                        >
                          PDF {i + 1}
                        </a>
                      ) : (
                        <Image
                          key={i}
                          src={fileUrl}
                          alt="Fault"
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      );
                    })}
                  </div>
                  <div className="font-semibold">Location:</div>
                  <div className="mb-1">{fault.location}</div>
                  <div className="font-semibold">Description:</div>
                  <div className="mb-1">{fault.description}</div>
                  <div className="text-xs text-gray-500 mb-2" suppressHydrationWarning={true}>
                    Reported at: {new Date(fault.reportedAt).toLocaleString()}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleMarkFixed(fault.id)}>
                        Mark as Fixed
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(fault.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
