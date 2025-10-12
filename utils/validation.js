// utils/validation.js

export const sanitizeInput = (text) => {
  if (!text) return '';
  
  // Remove excessive whitespace
  let sanitized = text.trim().replace(/\s+/g, ' ');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

export const validateText = (text, maxLength = 500) => {
  if (!text || text.trim().length === 0) return false;
  if (text.length > maxLength) return false;
  return true;
};

export const validateCategoryName = (name) => {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 50) return false;
  return true;
};