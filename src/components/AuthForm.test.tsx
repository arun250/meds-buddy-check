import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthForm from '../src/AuthForm';

describe('AuthForm - Form Submission', () => {
  it('submits login form with valid data', () => {
    const mockOnSubmit = vi.fn();
    render(<AuthForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('submits signup form with valid data', () => {
    const mockOnSubmit = vi.fn();
    render(<AuthForm onSubmit={mockOnSubmit} initialMode="signup" />);
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
  });
});