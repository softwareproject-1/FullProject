/**
 * Date utility functions for Time Management and other modules
 * Provides consistent date formatting and conversion across the application
 */

/**
 * Formats a date for display
 * Handles various date formats: Date objects, ISO strings, timestamps
 * @param date - Date to format (Date, string, number, or any date-like value)
 * @param format - Optional format string (default: 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export function formatDate(date: any, format: string = 'YYYY-MM-DD'): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    // Handle different input types
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else if (date?.date) {
      // Handle objects with date property
      dateObj = new Date(date.date);
    } else if (date?.dateObj) {
      dateObj = new Date(date.dateObj);
    } else if (date?.createdAt) {
      dateObj = new Date(date.createdAt);
    } else {
      dateObj = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    // Format based on requested format
    if (format === 'YYYY-MM-DD') {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (format === 'MM/DD/YYYY') {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${month}/${day}/${year}`;
    } else if (format === 'DD/MM/YYYY') {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    
    // Default: YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'N/A';
  }
}

/**
 * Formats time from a date
 * @param date - Date to extract time from
 * @returns Formatted time string (HH:MM:SS or HH:MM)
 */
export function formatTime(date: any, includeSeconds: boolean = false): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    if (includeSeconds) {
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time:', error, date);
    return 'N/A';
  }
}

/**
 * Converts a date to ISO 8601 format
 * Optionally sets time to start of day (00:00:00) or end of day (23:59:59)
 * @param date - Date to convert (string, Date, or date-like value)
 * @param timeOfDay - 'start' sets to 00:00:00, 'end' sets to 23:59:59, undefined keeps original time
 * @returns ISO 8601 formatted string
 */
export function toISO8601(date: any, timeOfDay?: 'start' | 'end'): string {
  if (!date) {
    const now = new Date();
    if (timeOfDay === 'start') {
      now.setHours(0, 0, 0, 0);
    } else if (timeOfDay === 'end') {
      now.setHours(23, 59, 59, 999);
    }
    return now.toISOString();
  }
  
  try {
    let dateObj: Date;
    
    // Handle different input types
    if (date instanceof Date) {
      dateObj = new Date(date);
    } else if (typeof date === 'string') {
      // If it's already an ISO string with time, use it
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        // If it's just a date string (YYYY-MM-DD), parse it
        dateObj = new Date(date);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      // Return current date if invalid
      dateObj = new Date();
    }
    
    // Set time based on timeOfDay parameter
    if (timeOfDay === 'start') {
      dateObj.setHours(0, 0, 0, 0);
    } else if (timeOfDay === 'end') {
      dateObj.setHours(23, 59, 59, 999);
    }
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error converting to ISO8601:', error, date);
    // Return current date as fallback
    const now = new Date();
    if (timeOfDay === 'start') {
      now.setHours(0, 0, 0, 0);
    } else if (timeOfDay === 'end') {
      now.setHours(23, 59, 59, 999);
    }
    return now.toISOString();
  }
}

/**
 * Converts an ISO string to local datetime string
 * @param isoString - ISO 8601 formatted string
 * @returns Local datetime string (YYYY-MM-DDTHH:MM:SS)
 */
export function isoToLocalDateTime(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error converting ISO to local datetime:', error, isoString);
    return '';
  }
}

/**
 * Converts a local datetime string to ISO format
 * @param localDateTime - Local datetime string (YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD HH:MM:SS)
 * @returns ISO 8601 formatted string
 */
export function localDateTimeToISO(localDateTime: string): string {
  if (!localDateTime) return '';
  
  try {
    // Handle different formats
    let dateStr = localDateTime;
    
    // Replace space with T if needed
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T');
    }
    
    // If no time component, add default time
    if (!dateStr.includes('T')) {
      dateStr = `${dateStr}T00:00:00`;
    }
    
    // If time is incomplete, pad it
    const timeMatch = dateStr.match(/T(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2].padStart(2, '0');
      const seconds = timeMatch[3] ? timeMatch[3].padStart(2, '0') : '00';
      dateStr = dateStr.replace(/T[\d:]+/, `T${hours}:${minutes}:${seconds}`);
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toISOString();
  } catch (error) {
    console.error('Error converting local datetime to ISO:', error, localDateTime);
    return '';
  }
}

/**
 * Gets the current date in YYYY-MM-DD format
 * @returns Current date string
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Gets the current datetime in ISO format
 * @returns Current datetime ISO string
 */
export function getCurrentDateTime(): string {
  return new Date().toISOString();
}

/**
 * Adds days to a date
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = date instanceof Date ? date : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Checks if a date is valid
 * @param date - Date to check
 * @returns True if date is valid
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}

