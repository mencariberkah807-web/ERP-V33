export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY PAID",
  PAID: "PAID",
};

function normalizeAmount(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, number);
}

function isActivePayment(payment) {
  if (!payment) {
    return false;
  }

  if (payment.active === "Inactive") {
    return false;
  }

  return normalizeAmount(payment.amount) > 0;
}

export function getNextPaymentNumber(payments) {
  const paymentNumbers = payments
    .map((payment) => {
      const match = String(payment.paymentNumber ?? "").match(/^PAY-(\d{5})$/);

      return match ? Number(match[1]) : 0;
    })
    .filter((number) => number > 0);

  const lastNumber =
    paymentNumbers.length > 0 ? Math.max(...paymentNumbers) : 0;

  return `PAY-${String(lastNumber + 1).padStart(5, "0")}`;
}

export function calculatePaymentSummary({
  soNumber,
  grandTotal,
  payments = [],
}) {
  const total = normalizeAmount(grandTotal);

  const relatedPayments = payments.filter(
    (payment) => payment.soNumber === soNumber && isActivePayment(payment)
  );

  const totalPaid = relatedPayments.reduce(
    (sum, payment) => sum + normalizeAmount(payment.amount),
    0
  );

  const balance = Math.max(0, total - totalPaid);

  let paymentStatus = PAYMENT_STATUS.UNPAID;

  if (totalPaid > 0 && balance > 0) {
    paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
  }

  if (total > 0 && balance === 0 && totalPaid >= total) {
    paymentStatus = PAYMENT_STATUS.PAID;
  }

  return {
    grandTotal: total,
    totalPaid,
    balance,
    paymentStatus,
    payments: relatedPayments,
  };
}

export function validatePaymentAmount({ amount, balance }) {
  const paymentAmount = Number(amount);

  const remainingBalance = normalizeAmount(balance);

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return {
      valid: false,
      message: "Payment Amount must be greater than zero.",
    };
  }

  if (paymentAmount > remainingBalance) {
    return {
      valid: false,
      message: "Payment Amount cannot exceed remaining Balance.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}
