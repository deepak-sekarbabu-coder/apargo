import { useState } from 'react';

import { createAnnouncement, validateAnnouncementForm } from './announcement-api';

export function useAnnouncementForm(onSuccess?: () => void) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setPriority('medium');
    setExpiryDate(undefined);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      validateAnnouncementForm(title, message);
      setLoading(true);

      await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        priority,
        expiresAt: expiryDate?.toISOString(),
      });

      setSuccess('Announcement created and sent to all users.');
      onSuccess?.();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to create announcement. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    title,
    setTitle,
    message,
    setMessage,
    priority,
    setPriority,
    expiryDate,
    setExpiryDate,
    loading,
    error,
    success,
    handleSubmit,
    resetForm,
  };
}
