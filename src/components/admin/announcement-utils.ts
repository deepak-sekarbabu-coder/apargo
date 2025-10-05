export const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'low':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getPriorityIconColor = (priority?: string) => {
  return priority === 'high'
    ? 'text-red-600'
    : priority === 'medium'
      ? 'text-blue-600'
      : 'text-gray-600';
};
