import { NextRequest, NextResponse } from 'next/server';

import { FileMetadata } from '@/lib/core/types';
import { storageService } from '@/lib/storage/storage-enhanced';

// POST /api/storage/upload - Enhanced file upload with metadata
export async function POST(request: NextRequest) {
  try {
    // Check if request contains multipart data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as FileMetadata['category'];
    const userId = formData.get('userId') as string;
    const relatedId = formData.get('relatedId') as string | null;
    const apartmentId = formData.get('apartmentId') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate category
    const allowedCategories: FileMetadata['category'][] = [
      'receipt',
      'fault',
      'avatar',
      'announcement',
    ];
    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${allowedCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload file with metadata
    const fileMetadata = await storageService.uploadFileWithMetadata(
      file,
      category,
      userId,
      relatedId || undefined,
      apartmentId || undefined
    );

    return NextResponse.json({
      success: true,
      fileMetadata,
      downloadURL: fileMetadata.downloadURL,
    });
  } catch (error) {
    console.error('File upload API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Upload failed';

    // Handle specific error types
    if (errorMessage.includes('File size') || errorMessage.includes('exceeds')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 413 } // Payload Too Large
      );
    }

    if (errorMessage.includes('File type') || errorMessage.includes('not allowed')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 415 } // Unsupported Media Type
      );
    }

    if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
      return NextResponse.json(
        { error: 'Storage configuration error' },
        { status: 502 } // Bad Gateway
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}

// GET /api/storage/upload - Get upload configuration
export async function GET() {
  try {
    return NextResponse.json({
      maxFileSize: storageService['config'].maxFileSize,
      allowedMimeTypes: storageService['config'].allowedMimeTypes,
      categories: ['receipt', 'fault', 'avatar', 'announcement'],
    });
  } catch (error) {
    console.error('Upload config API error:', error);
    return NextResponse.json({ error: 'Failed to get upload configuration' }, { status: 500 });
  }
}
