/**
 * Date utilities for common date operations
 * @module dates
 */

/**
 * Utility functions for date manipulation
 */
export const DateUtils = {
	/**
	 * Gets the last day of a given month
	 * @param year - The year
	 * @param month - The month (1-12)
	 * @returns The last day of the month (28, 29, 30, or 31)
	 * @example
	 * DateUtils.getLastDayOfMonth(2024, 2) // 29 (leap year)
	 * DateUtils.getLastDayOfMonth(2023, 2) // 28 (non-leap year)
	 * DateUtils.getLastDayOfMonth(2024, 4) // 30
	 */
	getLastDayOfMonth(year: number, month: number): number {
		return new Date(year, month, 0).getDate()
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
	 * DateUtils.getPaymentDueDate(2024, 2, 31) // Returns Date for Feb 29, 2024
	 *
	 * // February 2023 (non-leap year) with preferred day 30 -> February 28, 2023
	 * DateUtils.getPaymentDueDate(2023, 2, 30) // Returns Date for Feb 28, 2023
	 *
	 * // April with preferred day 31 -> April 30
	 * DateUtils.getPaymentDueDate(2024, 4, 31) // Returns Date for Apr 30, 2024
	 *
	 * // March with preferred day 15 -> March 15 (no adjustment needed)
	 * DateUtils.getPaymentDueDate(2024, 3, 15) // Returns Date for Mar 15, 2024
	 */
	getPaymentDueDate(year: number, month: number, preferredDay: number): Date {
		const lastDay = this.getLastDayOfMonth(year, month)
		const actualDay = Math.min(preferredDay, lastDay)

		return new Date(year, month - 1, actualDay)
	},

	/**
	 * Generates an array of payment due dates for a contract period
	 *
	 * @param startDate - Contract start date
	 * @param endDate - Contract end date
	 * @param preferredDay - The preferred day of the month for payment (1-31)
	 * @returns Array of Date objects representing all payment due dates
	 *
	 * @example
	 * const start = new Date(2024, 0, 1) // Jan 1, 2024
	 * const end = new Date(2024, 5, 30) // Jun 30, 2024
	 * DateUtils.generatePaymentSchedule(start, end, 15)
	 * // Returns dates: Jan 15, Feb 15, Mar 15, Apr 15, May 15, Jun 15
	 */
	generatePaymentSchedule(startDate: Date, endDate: Date, preferredDay: number): Date[] {
		const schedule: Date[] = []

		let currentYear = startDate.getFullYear()
		let currentMonth = startDate.getMonth() + 1 // Convert to 1-based

		// If start date is after the preferred payment day, start from next month
		if (startDate.getDate() > preferredDay) {
			currentMonth++
			if (currentMonth > 12) {
				currentMonth = 1
				currentYear++
			}
		}

		while (true) {
			const dueDate = this.getPaymentDueDate(currentYear, currentMonth, preferredDay)

			// Stop if due date is after contract end date
			if (dueDate > endDate) {
				break
			}

			// Only include dates that are on or after the start date
			if (dueDate >= startDate) {
				schedule.push(dueDate)
			}

			// Move to next month
			currentMonth++
			if (currentMonth > 12) {
				currentMonth = 1
				currentYear++
			}
		}

		return schedule
	},

	/**
	 * Formats a date to Brazilian format (DD/MM/YYYY)
	 * @param date - The date to format
	 * @returns Formatted date string
	 * @example
	 * DateUtils.formatDateBR(new Date(2024, 0, 15)) // "15/01/2024"
	 */
	formatDateBR(date: Date): string {
		return date.toLocaleDateString('pt-BR')
	},

	/**
	 * Formats a date to ISO format (YYYY-MM-DD)
	 * @param date - The date to format
	 * @returns Formatted date string
	 * @example
	 * DateUtils.formatDateISO(new Date(2024, 0, 15)) // "2024-01-15"
	 */
	formatDateISO(date: Date): string {
		return date.toISOString().split('T')[0] as string
	},

	/**
	 * Adds days to a date
	 * @param date - The base date
	 * @param days - Number of days to add (can be negative)
	 * @returns New Date object
	 * @example
	 * DateUtils.addDays(new Date(2024, 0, 15), 10) // Jan 25, 2024
	 * DateUtils.addDays(new Date(2024, 0, 15), -5) // Jan 10, 2024
	 */
	addDays(date: Date, days: number): Date {
		const result = new Date(date)
		result.setDate(result.getDate() + days)
		return result
	},

	/**
	 * Adds months to a date
	 * @param date - The base date
	 * @param months - Number of months to add (can be negative)
	 * @returns New Date object
	 * @example
	 * DateUtils.addMonths(new Date(2024, 0, 31), 1) // Feb 29, 2024 (adjusted for leap year)
	 */
	addMonths(date: Date, months: number): Date {
		const result = new Date(date)
		result.setMonth(result.getMonth() + months)
		return result
	},

	/**
	 * Checks if a date is in the past
	 * @param date - The date to check
	 * @returns true if the date is before now
	 */
	isPast(date: Date): boolean {
		return date < new Date()
	},

	/**
	 * Checks if a date is in the future
	 * @param date - The date to check
	 * @returns true if the date is after now
	 */
	isFuture(date: Date): boolean {
		return date > new Date()
	},

	/**
	 * Checks if two dates are on the same day
	 * @param date1 - First date
	 * @param date2 - Second date
	 * @returns true if both dates are on the same day
	 */
	isSameDay(date1: Date, date2: Date): boolean {
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		)
	},

	/**
	 * Gets the difference in days between two dates
	 * @param date1 - First date
	 * @param date2 - Second date
	 * @returns Number of days between the dates (can be negative)
	 */
	diffInDays(date1: Date, date2: Date): number {
		const msPerDay = 24 * 60 * 60 * 1000
		return Math.round((date1.getTime() - date2.getTime()) / msPerDay)
	},

	/**
	 * Gets the start of the day (00:00:00.000)
	 * @param date - The date
	 * @returns New Date object at the start of the day
	 */
	startOfDay(date: Date): Date {
		const result = new Date(date)
		result.setHours(0, 0, 0, 0)
		return result
	},

	/**
	 * Gets the end of the day (23:59:59.999)
	 * @param date - The date
	 * @returns New Date object at the end of the day
	 */
	endOfDay(date: Date): Date {
		const result = new Date(date)
		result.setHours(23, 59, 59, 999)
		return result
	},

	/**
	 * Gets the start of the month
	 * @param date - The date
	 * @returns New Date object at the first day of the month
	 */
	startOfMonth(date: Date): Date {
		const result = new Date(date)
		result.setDate(1)
		result.setHours(0, 0, 0, 0)
		return result
	},

	/**
	 * Gets the end of the month
	 * @param date - The date
	 * @returns New Date object at the last day of the month
	 */
	endOfMonth(date: Date): Date {
		const result = new Date(date.getFullYear(), date.getMonth() + 1, 0)
		result.setHours(23, 59, 59, 999)
		return result
	},
}
