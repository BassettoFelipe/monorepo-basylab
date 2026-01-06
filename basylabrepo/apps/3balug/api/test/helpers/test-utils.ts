export async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateTestEmail(prefix = 'test'): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
}

export function randomString(length = 10): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length)
}

export function stripTime(date: Date): Date {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

export function addHours(date: Date, hours: number): Date {
	const result = new Date(date)
	result.setHours(result.getHours() + hours)
	return result
}

export function addMinutes(date: Date, minutes: number): Date {
	const result = new Date(date)
	result.setMinutes(result.getMinutes() + minutes)
	return result
}

export function addSeconds(date: Date, seconds: number): Date {
	const result = new Date(date)
	result.setSeconds(result.getSeconds() + seconds)
	return result
}

export function datesEqual(date1: Date, date2: Date): boolean {
	return Math.abs(date1.getTime() - date2.getTime()) < 1000
}

export function isErrorOfType<T extends Error>(
	error: unknown,
	errorClass: new (...args: never[]) => T,
): error is T {
	return error instanceof errorClass
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}
	return String(error)
}

export function assertDefined<T>(
	value: T | null | undefined,
	message = 'Value is not defined',
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(message)
	}
}

type AnyFunction = (...args: unknown[]) => unknown

export function createSpy<T extends Record<string, AnyFunction>>(
	obj: T,
): T & { _calls: Record<keyof T, unknown[][]> } {
	const calls: Record<keyof T, unknown[][]> = {} as Record<keyof T, unknown[][]>

	const proxy = new Proxy(obj, {
		get(target, prop) {
			if (prop === '_calls') return calls

			const original = target[prop as keyof T]
			if (typeof original === 'function') {
				return (...args: unknown[]) => {
					if (!calls[prop as keyof T]) {
						calls[prop as keyof T] = []
					}
					calls[prop as keyof T].push(args)
					return original.apply(target, args)
				}
			}
			return original
		},
	})

	return proxy as T & { _calls: Record<keyof T, unknown[][]> }
}
