import { Poll } from '@/lib/types';

export const calculatePollResults = (poll: Poll) => {
  const totalVotes = Object.keys(poll.votes || {}).length;
  const optionCounts = poll.options.map(option => {
    const count = Object.values(poll.votes || {}).filter(vote => vote === option.id).length;
    return {
      ...option,
      count,
      percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
    };
  });
  return { totalVotes, optionCounts };
};

export const isExpired = (poll: Poll) => {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt) < new Date();
};
