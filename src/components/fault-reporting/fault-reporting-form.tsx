'use client';

import { useAuth } from '@/context/auth-context';
import { File } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { addFault } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';
import type { FaultSeverity } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Removed unused Progress import to satisfy lint rule
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/hooks/use-toast';

export function FaultReportingForm({ onReport }: { onReport?: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<FaultSeverity>('warning');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // File upload state (like add expense)
  const MAX_FILE_SIZE_MB = 2;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ACCEPTED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileError('');
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        newErrors.push(`File "${file.name}" is not a supported type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        newErrors.push(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      // Prevent duplicates
      if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        newErrors.push(`File "${file.name}" already selected.`);
        continue;
      }
      validFiles.push(file);
    }
    if (newErrors.length > 0) {
      setFileError(newErrors.join('\n'));
      return;
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
    // Create preview URLs for display
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    // Reset the input
    e.target.value = '';
  };

  // Remove file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      // Clean up object URL
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Note: File removal functionality would require updating the hook
  // For now, this is just a placeholder

  // Form is ready when required text fields complete, auth resolved, and user present
  const isFormReady = !!(location.trim() && description.trim() && !authLoading && user);

  // Clean up preview URLs on unmount
  // Cleanup object URLs on unmount. We intentionally omit previewUrls from deps so that
  // the cleanup runs only once; each URL is revoked individually when removed. Including
  // previewUrls would cause effect re-runs and double revocations.
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed auto-submit to prevent clearing user-entered text fields upon file upload.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFileError('');
    setIsUploading(true);
    try {
      if (authLoading) throw new Error('Authentication still loading, please wait');
      if (!user) throw new Error('Not authenticated');
      if (!user.id) throw new Error('User ID is missing');
      if (!location.trim() || !description.trim()) throw new Error('All fields required');

      // Upload files to Firebase Storage (if any)
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file, idx) => {
          const path = `faults/${Date.now()}_${idx}_${file.name}`;
          return uploadImage(file, path);
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      const faultData = {
        images: imageUrls,
        location,
        description,
        reportedBy: user.id,
        severity,
        status: 'open' as const,
        priority: severity === 'critical' ? 5 : severity === 'warning' ? 3 : 1,
        fixed: false,
      };

      await addFault(faultData); // result unused; awaiting to ensure completion

      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));

      // Reset form
      setLocation('');
      setDescription('');
      setSeverity('warning');
      setSelectedFiles([]);
      setPreviewUrls([]);

      toast({
        title: 'Fault Reported',
        description: 'Your fault report has been submitted successfully.',
      });

      if (onReport) onReport();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to report fault';
      setFileError(errorMessage);
      toast({
        title: 'Report Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Report a Fault</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium mb-1">Location</label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. 2nd Floor, Kitchen, Room 5"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the fault in detail"
              required
            />
          </div>

          <div>
            <Label htmlFor="severity" className="block font-medium mb-1">
              Severity
            </Label>
            <Select value={severity} onValueChange={(value: FaultSeverity) => setSeverity(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Critical - Requires immediate attention</span>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Warning - Moderate priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Low - Minor issue</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced File Upload Section */}
          <div>
            <label className="block font-medium mb-1">
              Attach Files{' '}
              <span className="text-xs text-muted-foreground">
                (Max {MAX_FILE_SIZE_MB}MB per file, images and PDFs only, up to 5 files)
              </span>
            </label>
            <Input
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              multiple
              onChange={handleFileChange}
              disabled={isUploading || submitting}
              className="cursor-pointer"
            />
            <div className="mt-4 space-y-2">
              {previewUrls.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Selected Files ({previewUrls.length}/5):</p>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        {selectedFiles[i]?.type.startsWith('image/') ? (
                          <div className="relative">
                            <Image
                              src={url}
                              alt={selectedFiles[i]?.name}
                              width={120}
                              height={120}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                              {Math.round(selectedFiles[i].size / 1024)} KB
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 border rounded bg-muted">
                            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium block truncate underline"
                                title={selectedFiles[i]?.name}
                              >
                                {selectedFiles[i]?.name}
                              </a>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(selectedFiles[i].size / 1024)} KB
                              </p>
                            </div>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFile(i)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {fileError && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded border whitespace-pre-line">
              {fileError}
            </div>
          )}

          <Button
            type="submit"
            disabled={!isFormReady || authLoading || isUploading || submitting}
            className="w-full"
          >
            {authLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <Spinner className="w-4 h-4" /> Loading...
              </span>
            ) : submitting || isUploading ? (
              <span className="flex items-center gap-2 justify-center">
                <Spinner className="w-4 h-4" /> Reporting...
              </span>
            ) : (
              'Report Fault'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
