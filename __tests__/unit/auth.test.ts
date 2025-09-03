import { validateEmail, validatePassword, validatePasswordConfirmation, getAuthErrorMessage } from '@/lib/utils/auth';

describe('Authentication Utilities', () => {
    describe('validateEmail', () => {
        it('should return null for valid email', () => {
            expect(validateEmail('test@example.com')).toBeNull();
            expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull();
        });

        it('should return error for invalid email', () => {
            expect(validateEmail('')).toBe('Email is required');
            expect(validateEmail('invalid-email')).toBe('Please enter a valid email address');
            expect(validateEmail('test@')).toBe('Please enter a valid email address');
            expect(validateEmail('@domain.com')).toBe('Please enter a valid email address');
        });
    });

    describe('validatePassword', () => {
        it('should return null for valid password', () => {
            expect(validatePassword('password123')).toBeNull();
            expect(validatePassword('123456')).toBeNull();
        });

        it('should return error for invalid password', () => {
            expect(validatePassword('')).toBe('Password is required');
            expect(validatePassword('12345')).toBe('Password must be at least 6 characters long');
        });
    });

    describe('validatePasswordConfirmation', () => {
        it('should return null for matching passwords', () => {
            expect(validatePasswordConfirmation('password123', 'password123')).toBeNull();
        });

        it('should return error for non-matching passwords', () => {
            expect(validatePasswordConfirmation('password123', '')).toBe('Please confirm your password');
            expect(validatePasswordConfirmation('password123', 'different')).toBe('Passwords do not match');
        });
    });

    describe('getAuthErrorMessage', () => {
        it('should return custom message for known errors', () => {
            expect(getAuthErrorMessage('Invalid login credentials')).toBe(
                'Invalid email or password. Please check your credentials and try again.'
            );
            expect(getAuthErrorMessage('Email not confirmed')).toBe(
                'Please check your email and click the confirmation link before signing in.'
            );
        });

        it('should return original message for unknown errors', () => {
            expect(getAuthErrorMessage('Unknown error')).toBe('Unknown error');
            expect(getAuthErrorMessage('')).toBe('An unexpected error occurred. Please try again.');
        });
    });
});