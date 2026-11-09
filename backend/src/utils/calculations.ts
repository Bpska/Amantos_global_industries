/**
 * Business calculation rules:
 * - totalAmount, balanceDue, visitDay are always computed on the server.
 * - amountPaid cannot exceed totalAmount.
 * - quantity > 0, unitPrice > 0.
 * Example: quantity 100, unitPrice 5 -> totalAmount 500, amountPaid 200 -> balanceDue 300.
 */

export interface OrderCalculationInput {
  quantity: number;
  unitPrice: number;
  amountPaid?: number;
}

export interface OrderCalculationResult {
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
}

export function calculateOrderAmounts(input: OrderCalculationInput): OrderCalculationResult {
  const { quantity, unitPrice } = input;
  const amountPaid = input.amountPaid ?? 0;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be an integer greater than 0');
  }

  if (unitPrice <= 0 || isNaN(unitPrice)) {
    throw new Error('Unit price must be greater than 0');
  }

  // Calculate totalAmount with 2 decimal precision
  const totalAmount = Math.round(quantity * unitPrice * 100) / 100;

  if (amountPaid < 0 || isNaN(amountPaid)) {
    throw new Error('Amount paid cannot be negative');
  }

  const roundedAmountPaid = Math.round(amountPaid * 100) / 100;

  if (roundedAmountPaid > totalAmount) {
    throw new Error(`Amount paid (${roundedAmountPaid}) cannot exceed total amount (${totalAmount})`);
  }

  const balanceDue = Math.round((totalAmount - roundedAmountPaid) * 100) / 100;

  return {
    totalAmount,
    amountPaid: roundedAmountPaid,
    balanceDue,
  };
}

export function calculatePaymentUpdate(
  currentBalanceDue: number,
  currentAmountPaid: number,
  paymentAmount: number
): { newAmountPaid: number; newBalanceDue: number } {
  if (paymentAmount <= 0 || isNaN(paymentAmount)) {
    throw new Error('Payment amount must be greater than 0');
  }

  const roundedPayment = Math.round(paymentAmount * 100) / 100;
  const roundedBalance = Math.round(currentBalanceDue * 100) / 100;
  const roundedPaid = Math.round(currentAmountPaid * 100) / 100;

  if (roundedPayment > roundedBalance) {
    throw new Error(
      `Payment amount (${roundedPayment}) cannot exceed balance due (${roundedBalance})`
    );
  }

  const newBalanceDue = Math.round((roundedBalance - roundedPayment) * 100) / 100;
  const newAmountPaid = Math.round((roundedPaid + roundedPayment) * 100) / 100;

  return {
    newAmountPaid,
    newBalanceDue,
  };
}
