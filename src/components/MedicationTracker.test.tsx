import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MedicationTracker from '../src/MedicationTracker';

describe('MedicationTracker', () => {
  describe('Handle Mark Taken', () => {
    it('marks medication as taken when mark taken button is clicked', () => {
      const mockOnMarkTaken = vi.fn();
      const medications = [
        {
          id: 1,
          name: 'Aspirin',
          dosage: '100mg',
          frequency: 'Once daily',
          taken: false
        }
      ];

      render(<MedicationTracker medications={medications} onMarkTaken={mockOnMarkTaken} />);

      // Verify initial state
      expect(screen.getByTestId('medication-status')).toHaveTextContent('Not Taken');
      expect(screen.getByTestId('mark-taken-button')).toBeInTheDocument();

      // Click mark taken button
      fireEvent.click(screen.getByTestId('mark-taken-button'));

      // Verify medication is marked as taken
      expect(screen.getByTestId('medication-status')).toHaveTextContent('Taken');
      expect(screen.queryByTestId('mark-taken-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('last-taken')).toBeInTheDocument();
      
      // Verify callback was called
      expect(mockOnMarkTaken).toHaveBeenCalledWith(1);
    });
  });
});