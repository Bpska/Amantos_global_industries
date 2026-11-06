import {
  calculateOrderAmounts,
  calculatePaymentUpdate,
} from '../src/utils/calculations';
import { getISTDayOfWeek, parseISTDate } from '../src/utils/date';

describe('Baki & Order Calculations Unit Tests', () => {
  describe('calculateOrderAmounts', () => {
    it('calculates totalAmount 500, balanceDue 300 when quantity=100, unitPrice=5, amountPaid=200', () => {
      const result = calculateOrderAmounts({
        quantity: 100,
        unitPrice: 5,
        amountPaid: 200,
      });

      expect(result.totalAmount).toBe(500);
      expect(result.amountPaid).toBe(200);
      expect(result.balanceDue).toBe(300);
    });

    it('handles zero initial amount paid (unpaid order)', () => {
      const result = calculateOrderAmounts({
        quantity: 50,
        unitPrice: 12.5,
        amountPaid: 0,
      });

      expect(result.totalAmount).toBe(625);
      expect(result.amountPaid).toBe(0);
      expect(result.balanceDue).toBe(625);
    });

    it('handles fully paid order (balanceDue = 0)', () => {
      const result = calculateOrderAmounts({
        quantity: 20,
        unitPrice: 15,
        amountPaid: 300,
      });

      expect(result.totalAmount).toBe(300);
      expect(result.amountPaid).toBe(300);
      expect(result.balanceDue).toBe(0);
    });

    it('throws error when amountPaid exceeds totalAmount', () => {
      expect(() => {
        calculateOrderAmounts({
          quantity: 10,
          unitPrice: 5,
          amountPaid: 60, // total is 50
        });
      }).toThrow('cannot exceed total amount');
    });

    it('throws error when quantity is zero or negative', () => {
      expect(() => {
        calculateOrderAmounts({
          quantity: 0,
          unitPrice: 10,
          amountPaid: 0,
        });
      }).toThrow('Quantity must be an integer greater than 0');

      expect(() => {
        calculateOrderAmounts({
          quantity: -5,
          unitPrice: 10,
          amountPaid: 0,
        });
      }).toThrow('Quantity must be an integer greater than 0');
    });

    it('throws error when unitPrice is zero or negative', () => {
      expect(() => {
        calculateOrderAmounts({
          quantity: 10,
          unitPrice: 0,
          amountPaid: 0,
        });
      }).toThrow('Unit price must be greater than 0');

      expect(() => {
        calculateOrderAmounts({
          quantity: 10,
          unitPrice: -5,
          amountPaid: 0,
        });
      }).toThrow('Unit price must be greater than 0');
    });

    it('throws error when amountPaid is negative', () => {
      expect(() => {
        calculateOrderAmounts({
          quantity: 10,
          unitPrice: 10,
          amountPaid: -10,
        });
      }).toThrow('Amount paid cannot be negative');
    });
  });

  describe('calculatePaymentUpdate (Collecting Baki)', () => {
    it('correctly updates balanceDue and amountPaid on subsequent payment', () => {
      // Current: total=500, paid=200, balanceDue=300
      // Paying 100 now:
      const result = calculatePaymentUpdate(300, 200, 100);

      expect(result.newAmountPaid).toBe(300);
      expect(result.newBalanceDue).toBe(200);
    });

    it('clears balance completely when exact balance is paid', () => {
      const result = calculatePaymentUpdate(200, 300, 200);

      expect(result.newAmountPaid).toBe(500);
      expect(result.newBalanceDue).toBe(0);
    });

    it('throws error when payment amount exceeds balanceDue', () => {
      expect(() => {
        calculatePaymentUpdate(150, 350, 200);
      }).toThrow('cannot exceed balance due');
    });

    it('throws error when payment amount is zero or negative', () => {
      expect(() => {
        calculatePaymentUpdate(200, 100, 0);
      }).toThrow('Payment amount must be greater than 0');

      expect(() => {
        calculatePaymentUpdate(200, 100, -50);
      }).toThrow('Payment amount must be greater than 0');
    });
  });

  describe('IST Date & Day Calculation', () => {
    it('derives correct day of week in Asia/Kolkata timezone', () => {
      // 2026-10-22 is Thursday
      const day = getISTDayOfWeek('2026-10-22T10:00:00+05:30');
      expect(day).toBe('Thursday');
    });

    it('parses YYYY-MM-DD into IST calendar date and day', () => {
      const parsed = parseISTDate('2026-10-22');
      expect(parsed.dayName).toBe('Thursday');
      expect(parsed.formatted).toBe('2026-10-22');
    });
  });
});
