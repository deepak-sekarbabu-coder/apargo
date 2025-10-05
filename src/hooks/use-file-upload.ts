import { useAuth } from '@/context/auth-context';

import { useCallback, useState } from 'react';

import { storageService } from '@/lib/storage-enhanced';
import { FileMetadata, FileUploadProgress, FileValidationResult } from '@/lib/types';

import { useToast } from './use-toast';

interface UseFileUploadOptions {
  category: FileMetadata['category'];
  relatedId?: string;
  apartmentId?: string;
  onUploadComplete?: (file: FileMetadata) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
}

interface UseFileUploadReturn {
  // State
  isUploading: boolean;
  uploadProgress: FileUploadProgress | null;
  uploadedFiles: FileMetadata[];
  error: string | null;

  // Actions
  validateFile: (file: File) => FileValidationResult;
  uploadFile: (file: File) => Promise<FileMetadata | null>;
  uploadMultipleFiles: (files: File[]) => Promise<FileMetadata[]>;
  clearError: () => void;
  clearUploadedFiles: () => void;

  // Utils
  formatFileSize: (bytes: number) => string;
  isValidFileType: (file: File) => boolean;
  getMaxFileSize: () => number;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear uploaded files
  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Validate single file
  const validateFile = useCallback(
    (file: File): FileValidationResult => {
      const validation = storageService.validateFile(file);

      // Additional validations based on options
      if (options.maxFiles && uploadedFiles.length >= options.maxFiles) {
        return {
          isValid: false,
          error: `Maximum ${options.maxFiles} files allowed`,
        };
      }

      // Check for duplicate files
      const isDuplicate = uploadedFiles.some(
        uploaded => uploaded.originalName === file.name && uploaded.fileSize === file.size
      );

      if (isDuplicate) {
        return {
          isValid: false,
          error: 'File with same name and size already uploaded',
        };
      }

      return validation;
    },
    [uploadedFiles, options.maxFiles]
  );

  // Upload single file
  const uploadFile = useCallback(
    async (file: File): Promise<FileMetadata | null> => {
      if (!user) {
        const errorMsg = 'User must be authenticated to upload files';
        setError(errorMsg);
        options.onUploadError?.(errorMsg);
        return null;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'File validation failed');
        options.onUploadError?.(validation.error || 'File validation failed');
        return null;
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast({
            title: 'Upload Warning',
            description: warning,
            variant: 'default',
          });
        });
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(null);

      try {
        const fileMetadata = await storageService.uploadFileWithMetadata(
          file,
          options.category,
          user.id,
          options.relatedId,
          options.apartmentId || user.apartment,
          progress => {
            setUploadProgress(progress);
          }
        );

        // Add to uploaded files
        setUploadedFiles(prev => [...prev, fileMetadata]);

        // Success notification
        toast({
          title: 'Upload Successful',
          description: `${file.name} uploaded successfully`,
          variant: 'default',
        });

        // Call completion callback
        options.onUploadComplete?.(fileMetadata);

        return fileMetadata;
      } catch (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
        setError(errorMessage);
        options.onUploadError?.(errorMessage);

        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        return null;
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [user, validateFile, options, toast]
  );

  // Upload multiple files
  const uploadMultipleFiles = useCallback(
    async (files: File[]): Promise<FileMetadata[]> => {
      const uploadedMetadata: FileMetadata[] = [];

      for (const file of files) {
        const result = await uploadFile(file);
        if (result) {
          uploadedMetadata.push(result);
        }
      }

      return uploadedMetadata;
    },
    [uploadFile]
  );

  // Utility functions
  const formatFileSize = useCallback((bytes: number): string => {
    return storageService.formatFileSize(bytes);
  }, []);

  const isValidFileType = useCallback((file: File): boolean => {
    const validation = storageService.validateFile(file);
    return validation.isValid;
  }, []);

  const getMaxFileSize = useCallback((): number => {
    return storageService['config'].maxFileSize;
  }, []);

  return {
    // State
    isUploading,
    uploadProgress,
    uploadedFiles,
    error,

    // Actions
    validateFile,
    uploadFile,
    uploadMultipleFiles,
    clearError,
    clearUploadedFiles,

    // Utils
    formatFileSize,
    isValidFileType,
    getMaxFileSize,
  };
}

// File upload validation hook for reactive validation
export function useFileValidation() {
  const [validationResults, setValidationResults] = useState<{
    [fileName: string]: FileValidationResult;
  }>({});

  const validateFiles = useCallback((files: File[]): FileValidationResult[] => {
    const results: FileValidationResult[] = [];
    const newValidationResults: { [fileName: string]: FileValidationResult } = {};

    files.forEach(file => {
      const validation = storageService.validateFile(file);
      results.push(validation);
      newValidationResults[file.name] = validation;
    });

    setValidationResults(newValidationResults);
    return results;
  }, []);

  const getValidationResult = useCallback(
    (fileName: string): FileValidationResult | null => {
      return validationResults[fileName] || null;
    },
    [validationResults]
  );

  const clearValidationResults = useCallback(() => {
    setValidationResults({});
  }, []);

  return {
    validationResults,
    validateFiles,
    getValidationResult,
    clearValidationResults,
  };
}

// File drop zone hook for drag and drop functionality
export function useFileDropZone(options: {
  onFilesDrop: (files: File[]) => void;
  accept?: string[];
  maxFiles?: number;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if leaving the drop zone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);

      // Filter by accepted types if specified
      const filteredFiles = options.accept
        ? files.filter(file => options.accept!.some(type => file.type.includes(type)))
        : files;

      // Limit number of files if specified
      const finalFiles = options.maxFiles
        ? filteredFiles.slice(0, options.maxFiles)
        : filteredFiles;

      if (finalFiles.length > 0) {
        options.onFilesDrop(finalFiles);
      }
    },
    [options]
  );

  return {
    isDragOver,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
