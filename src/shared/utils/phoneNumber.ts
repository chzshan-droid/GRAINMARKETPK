const ADMIN_MOBILE_NUMBER = '03006608811';

/** Converts supported Pakistan phone formats to the local 03XXXXXXXXX form. */
export function toLocalMobileNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.startsWith('92') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith('3') && digits.length === 10) {
    return `0${digits}`;
  }

  return digits;
}

export function isAdminMobileNumber(phoneNumber: string): boolean {
  return toLocalMobileNumber(phoneNumber) === ADMIN_MOBILE_NUMBER;
}

/** Returns the same 92XXXXXXXXXX key used by Firestore user documents. */
export function toUserDocumentId(phoneNumber: string): string {
  const localNumber = toLocalMobileNumber(phoneNumber);
  return `92${localNumber.replace(/^0/, '')}`;
}
