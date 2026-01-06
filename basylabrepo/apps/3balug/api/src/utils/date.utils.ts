/**
 * Utility functions for date manipulation
 */
export const DateUtils = {
  /**
   * Gets the last day of a given month
   * @param year - The year
   * @param month - The month (1-12)
   * @returns The last day of the month (28, 29, 30, or 31)
   */
  getLastDayOfMonth(year: number, month: number): number {
    // Create a date for the first day of the next month, then subtract one day
    return new Date(year, month, 0).getDate();
  },

  /**
   * Calculates the actual payment due date for a given month.
   * If the preferred payment day doesn't exist in that month (e.g., day 31 in February),
   * it falls back to the last day of the month.
   *
   * This follows the standard approach used by banks and billing systems.
   *
   * @param year - The year of the payment
   * @param month - The month of the payment (1-12)
   * @param preferredDay - The preferred day of the month for payment (1-31)
   * @returns A Date object representing the actual payment due date
   *
   * @example
   * // February 2024 (leap year) with preferred day 31 -> February 29, 2024
   * getPaymentDueDate(2024, 2, 31) // Returns Date for Feb 29, 2024
   *
   * // February 2023 (non-leap year) with preferred day 30 -> February 28, 2023
   * getPaymentDueDate(2023, 2, 30) // Returns Date for Feb 28, 2023
   *
   * // April with preferred day 31 -> April 30
   * getPaymentDueDate(2024, 4, 31) // Returns Date for Apr 30, 2024
   *
   * // March with preferred day 15 -> March 15 (no adjustment needed)
   * getPaymentDueDate(2024, 3, 15) // Returns Date for Mar 15, 2024
   */
  getPaymentDueDate(year: number, month: number, preferredDay: number): Date {
    const lastDay = this.getLastDayOfMonth(year, month);
    const actualDay = Math.min(preferredDay, lastDay);

    return new Date(year, month - 1, actualDay);
  },

  /**
   * Generates an array of payment due dates for a contract period
   *
   * @param startDate - Contract start date
   * @param endDate - Contract end date
   * @param preferredDay - The preferred day of the month for payment (1-31)
   * @returns Array of Date objects representing all payment due dates
   */
  generatePaymentSchedule(startDate: Date, endDate: Date, preferredDay: number): Date[] {
    const schedule: Date[] = [];

    let currentYear = startDate.getFullYear();
    let currentMonth = startDate.getMonth() + 1; // Convert to 1-based

    // If start date is after the preferred payment day, start from next month
    if (startDate.getDate() > preferredDay) {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    while (true) {
      const dueDate = this.getPaymentDueDate(currentYear, currentMonth, preferredDay);

      // Stop if due date is after contract end date
      if (dueDate > endDate) {
        break;
      }

      // Only include dates that are on or after the start date
      if (dueDate >= startDate) {
        schedule.push(dueDate);
      }

      // Move to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return schedule;
  },

  /**
   * Formats a date to Brazilian format (DD/MM/YYYY)
   */
  formatDateBR(date: Date): string {
    return date.toLocaleDateString("pt-BR");
  },

  /**
   * Formats a date to ISO format (YYYY-MM-DD)
   */
  formatDateISO(date: Date): string {
    return date.toISOString().split("T")[0];
  },
};
