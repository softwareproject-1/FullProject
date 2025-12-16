/**
 * Utility functions for Time Management module
 * These functions help handle API responses and errors consistently
 */

/**
 * Extracts array data from API responses
 * Handles different response structures from the backend
 */
export function extractArrayData(response: any): any[] {
  if (!response || !response.data) {
    return [];
  }

  let data = response.data;

  // If it's already an array, return it
  if (Array.isArray(data)) {
    return data;
  }

  // Check common wrapper properties
  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  // Check for specific array properties
  const arrayProperties = ['items', 'results', 'list', 'records', 'shifts', 'shiftTypes', 
    'scheduleRules', 'shiftAssignments', 'attendanceRecords', 'timeExceptions', 
    'overtimeRules', 'latenessRules', 'holidays', 'correctionRequests', 'employees'];
  
  for (const prop of arrayProperties) {
    if (data[prop] && Array.isArray(data[prop])) {
      return data[prop];
    }
  }

  // If it's an object, try to find any array property
  if (typeof data === 'object' && data !== null) {
    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
    if (arrayKey) {
      return data[arrayKey];
    }
  }

  // If no array found, return empty array
  console.warn('extractArrayData: No array found in response data:', data);
  return [];
}

/**
 * Handles errors from Time Management API calls
 * Provides user-friendly error messages and logging
 */
export function handleTimeManagementError(error: any, context: string): void {
  console.error(`Error ${context}:`, error);

  // Extract error message
  let errorMessage = `Failed to ${context}. `;

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        errorMessage += data?.message || 'Invalid request. Please check your input.';
        break;
      case 401:
        errorMessage += 'You are not authenticated. Please log in.';
        // Redirect to login will be handled by ApiClient interceptor
        break;
      case 403:
        errorMessage += 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage += 'Resource not found. It may have been deleted or does not exist.';
        break;
      case 409:
        errorMessage += data?.message || 'Conflict. This resource may already exist.';
        break;
      case 500:
        errorMessage += 'Server error. Please try again later or contact support.';
        break;
      default:
        errorMessage += data?.message || `Server returned status ${status}.`;
    }
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
    errorMessage += 'Cannot connect to server. Please check your connection and ensure the backend is running.';
  } else if (error.message) {
    errorMessage += error.message;
  } else {
    errorMessage += 'An unexpected error occurred.';
  }

  // Log detailed error for debugging
  console.error('Error details:', {
    context,
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
    url: error.config?.url,
    fullError: error
  });

  // You can add toast notification here if you have a toast library
  // For now, we'll just log to console
  // Example: toast.error(errorMessage);
}

