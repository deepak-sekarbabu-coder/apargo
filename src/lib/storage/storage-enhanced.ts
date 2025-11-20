import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  UploadResult,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

import log from '../core/logger';
import {
  FileMetadata,
  FileUploadProgress,
  FileValidationResult,
  StorageConfig,
  StorageStats,
} from '../core/types';
import { app, db } from '../firebase/firebase';

// Firebase Storage instance
const storage = getStorage(app);

// Storage Configuration - Centralized for Firebase free tier optimization
const STORAGE_CONFIG: StorageConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB in bytes
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  bucket: 'unicorndev-b532a.firebasestorage.app', // Centralized bucket
  baseUploadPath: 'uploads', // Base path for all uploads
};

/**
 * Enhanced Storage Service Class
 * Provides centralized file upload, validation, and metadata management
 */
class StorageService {
  private readonly config: StorageConfig;

  constructor(config: StorageConfig = STORAGE_CONFIG) {
    this.config = config;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): FileValidationResult {
    const warnings: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        isValid: false,
        error: `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}`,
      };
    }

    // Check MIME type
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not allowed. Supported types: ${this.config.allowedMimeTypes.join(', ')}`,
      };
    }

    // Check for potential issues
    if (file.size > 1 * 1024 * 1024) {
      // > 1MB
      warnings.push('Large file detected. Consider optimizing for faster upload.');
    }

    // Validate filename
    if (file.name.length > 100) {
      warnings.push('Very long filename detected. Consider shortening for better compatibility.');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Generate unique file path with timestamp
   */
  private generateFilePath(file: File, category: FileMetadata['category'], userId: string): string {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;

    switch (category) {
      case 'avatar':
        return `${this.config.baseUploadPath}/avatars/${userId}_${fileName}`;
      case 'receipt':
        return `${this.config.baseUploadPath}/receipts/${fileName}`;
      case 'fault':
        return `${this.config.baseUploadPath}/faults/${fileName}`;
      case 'announcement':
        return `${this.config.baseUploadPath}/announcements/${fileName}`;
      case 'maintenance':
        return `${this.config.baseUploadPath}/maintenance/${fileName}`;
      default:
        return `${this.config.baseUploadPath}/misc/${fileName}`;
    }
  }

  /**
   * Create file metadata object
   */
  private createFileMetadata(
    file: File,
    storagePath: string,
    downloadURL: string,
    category: FileMetadata['category'],
    userId: string,
    relatedId?: string,
    apartmentId?: string
  ): Omit<FileMetadata, 'id'> {
    return {
      originalName: file.name,
      fileName: storagePath.split('/').pop() || file.name,
      storagePath,
      downloadURL,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      category,
      ...(relatedId !== undefined && { relatedId }),
      ...(apartmentId !== undefined && { apartmentId }),
    };
  }

  /**
   * Handle upload error
   */
  private handleUploadError(error: unknown, fileName: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
      throw new Error(
        `Upload failed for ${fileName}. Verify Firebase Storage bucket configuration and rules allow authenticated writes.`
      );
    }

    throw new Error(`Upload failed for ${fileName}: ${errorMessage}`);
  }

  /**
   * Upload file with metadata storage
   */
  async uploadFileWithMetadata(
    file: File,
    category: FileMetadata['category'],
    userId: string,
    relatedId?: string,
    apartmentId?: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileMetadata> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'File validation failed');
    }

    try {
      // Generate storage path
      const storagePath = this.generateFilePath(file, category, userId);
      const storageRef = ref(storage, storagePath);

      // Upload file to Firebase Storage
      log.info(`Uploading file to path: ${storagePath}`);

      // Report initial progress
      onProgress?.({
        uploadedBytes: 0,
        totalBytes: file.size,
        percentage: 0,
        fileName: file.name,
      });

      const uploadResult: UploadResult = await uploadBytes(storageRef, file);

      // Report completion
      onProgress?.({
        uploadedBytes: file.size,
        totalBytes: file.size,
        percentage: 100,
        fileName: file.name,
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Create file metadata
      const fileMetadata = this.createFileMetadata(
        file,
        storagePath,
        downloadURL,
        category,
        userId,
        relatedId,
        apartmentId
      );

      // Store metadata in Firestore
      const metadataCollection = collection(db, 'fileMetadata');
      const metadataDoc = await addDoc(metadataCollection, fileMetadata);

      const finalMetadata: FileMetadata = {
        id: metadataDoc.id,
        ...fileMetadata,
      };

      log.info(`File uploaded successfully: ${file.name} -> ${downloadURL}`);
      return finalMetadata;
    } catch (error) {
      log.error('File upload failed:', error);
      this.handleUploadError(error, file.name);
    }
  }

  /**
   * Delete file and its metadata
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file metadata
      const fileDoc = doc(db, 'fileMetadata', fileId);
      const fileSnapshot = await getDoc(fileDoc);

      if (!fileSnapshot.exists()) {
        throw new Error('File metadata not found');
      }

      const metadata = fileSnapshot.data() as FileMetadata;

      // Delete from Firebase Storage
      const storageRef = ref(storage, metadata.storagePath);
      await deleteObject(storageRef);

      // Delete metadata from Firestore
      await deleteDoc(fileDoc);

      log.info(`File deleted successfully: ${metadata.originalName}`);
    } catch (error) {
      log.error('File deletion failed:', error);
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get files by category
   */
  async getFilesByCategory(category: FileMetadata['category']): Promise<FileMetadata[]> {
    try {
      const metadataQuery = query(
        collection(db, 'fileMetadata'),
        where('category', '==', category),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(metadataQuery);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FileMetadata
      );
    } catch (error) {
      log.error('Failed to fetch files by category:', error);
      throw error;
    }
  }

  /**
   * Get files older than specified months
   */
  async getFilesByAge(months: number): Promise<FileMetadata[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      const cutoffISO = cutoffDate.toISOString();

      const metadataQuery = query(
        collection(db, 'fileMetadata'),
        where('uploadedAt', '<', cutoffISO),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(metadataQuery);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FileMetadata
      );
    } catch (error) {
      log.error('Failed to fetch files by age:', error);
      throw error;
    }
  }

  /**
   * Get files by uploader
   */
  async getFilesByUploader(userId: string): Promise<FileMetadata[]> {
    try {
      const metadataQuery = query(
        collection(db, 'fileMetadata'),
        where('uploadedBy', '==', userId),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(metadataQuery);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FileMetadata
      );
    } catch (error) {
      log.error('Failed to fetch files by uploader:', error);
      throw error;
    }
  }

  /**
   * Get all file metadata with optional filtering
   */
  async getAllFiles(limitCount?: number): Promise<FileMetadata[]> {
    try {
      let metadataQuery = query(collection(db, 'fileMetadata'), orderBy('uploadedAt', 'desc'));

      if (limitCount) {
        metadataQuery = query(metadataQuery, limit(limitCount));
      }

      const snapshot = await getDocs(metadataQuery);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FileMetadata
      );
    } catch (error) {
      log.error('Failed to fetch all files:', error);
      throw error;
    }
  }

  /**
   * Bulk delete files
   */
  async bulkDeleteFiles(fileIds: string[]): Promise<{
    deleted: string[];
    failed: string[];
  }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId);
        deleted.push(fileId);
      } catch (error) {
        log.error(`Failed to delete file ${fileId}:`, error);
        failed.push(fileId);
      }
    }

    return { deleted, failed };
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const files = await this.getAllFiles();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const cutoffISO = threeMonthsAgo.toISOString();

      const stats: StorageStats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
        categoryCounts: {},
        oldFileCount: 0,
        oldFileSize: 0,
      };

      // Calculate category counts and old file stats
      files.forEach(file => {
        // Category counts
        stats.categoryCounts[file.category] = (stats.categoryCounts[file.category] || 0) + 1;

        // Old file stats
        if (file.uploadedAt < cutoffISO) {
          stats.oldFileCount++;
          stats.oldFileSize += file.fileSize;
        }
      });

      return stats;
    } catch (error) {
      log.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Default instance
export const storageService = new StorageService();

// Legacy function wrapper for backward compatibility

