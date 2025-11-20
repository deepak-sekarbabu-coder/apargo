export interface CreateAnnouncementData {
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
}

export const createAnnouncement = async (data: CreateAnnouncementData) => {
  const response = await fetch(`${window.location.origin}/api/core/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  // Get response text first, then parse appropriately
  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = 'Failed to create announcement';

    try {
      // Try to parse as JSON first
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If JSON parsing fails, it might be HTML error page
      if (responseText.includes('<!DOCTYPE')) {
        errorMessage = `Server error (${response.status}). Please check your connection and try again.`;
      } else {
        errorMessage = responseText || errorMessage;
      }
    }

    throw new Error(errorMessage);
  }

  // Parse successful response as JSON
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error('Invalid response format from server');
  }
};

export const validateAnnouncementForm = (title: string, message: string) => {
  if (!title.trim() || !message.trim()) {
    throw new Error('Please fill in all required fields.');
  }
};
