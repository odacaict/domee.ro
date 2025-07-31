export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const validatePhone = (phone: string): boolean => {
    // Romanian phone number format
    const phoneRegex = /^(\+4|0)([237]\d{8}|[89]00\d{6})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };
  
  export const validateIBAN = (iban: string): boolean => {
    // Basic IBAN validation for Romania
    const ibanRegex = /^RO\d{2}[A-Z]{4}\d{16}$/;
    return ibanRegex.test(iban.replace(/\s/g, '').toUpperCase());
  };
  
  export const validatePassword = (password: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Parola trebuie să aibă cel puțin 8 caractere');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Parola trebuie să conțină cel puțin o literă mare');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Parola trebuie să conțină cel puțin o literă mică');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Parola trebuie să conțină cel puțin o cifră');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const validateFiscalCode = (code: string): boolean => {
    // Romanian fiscal code validation (CUI)
    if (!/^\d+$/.test(code)) return false;
    
    const digits = code.split('').map(Number);
    const controlDigit = digits.pop();
    const weights = [7, 5, 3, 2, 1, 7, 5, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < digits.length && i < weights.length; i++) {
      sum += digits[i] * weights[i];
    }
    
    const calculatedControl = (sum * 10) % 11;
    const expectedControl = calculatedControl === 10 ? 0 : calculatedControl;
    
    return controlDigit === expectedControl;
  };
  
  export const validateCryptoAddress = (address: string, type: 'bitcoin' | 'ethereum' = 'bitcoin'): boolean => {
    if (type === 'bitcoin') {
      // Basic Bitcoin address validation
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
    } else {
      // Basic Ethereum address validation
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
  };
  
  export const validateTimeSlot = (time: string): boolean => {
    // HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  };
  
  export const validateCoordinates = (coords: string): boolean => {
    // Format: "lat, lng" e.g., "44.4268, 26.1025"
    const parts = coords.split(',').map(p => p.trim());
    if (parts.length !== 2) return false;
    
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };
  