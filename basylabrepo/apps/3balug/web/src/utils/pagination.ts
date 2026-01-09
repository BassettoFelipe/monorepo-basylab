/**
 * Generate an array of page numbers and ellipsis indicators for pagination UI
 *
 * @param currentPage - The current active page (1-indexed)
 * @param totalPages - The total number of pages
 * @returns An array containing page numbers and 'ellipsis' strings
 *
 * @example
 * getPaginationPages(1, 10) // [1, 2, 3, 'ellipsis', 10]
 * getPaginationPages(5, 10) // [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 * getPaginationPages(10, 10) // [1, 'ellipsis', 8, 9, 10]
 */
export function getPaginationPages(
	currentPage: number,
	totalPages: number,
): (number | 'ellipsis')[] {
	const pages: (number | 'ellipsis')[] = []
	const showEllipsisThreshold = 7

	if (totalPages <= showEllipsisThreshold) {
		for (let i = 1; i <= totalPages; i++) {
			pages.push(i)
		}
		return pages
	}

	// Always show first page
	pages.push(1)

	if (currentPage > 3) {
		pages.push('ellipsis')
	}

	// Pages around current
	const start = Math.max(2, currentPage - 1)
	const end = Math.min(totalPages - 1, currentPage + 1)

	for (let i = start; i <= end; i++) {
		pages.push(i)
	}

	if (currentPage < totalPages - 2) {
		pages.push('ellipsis')
	}

	// Always show last page
	if (totalPages > 1) {
		pages.push(totalPages)
	}

	return pages
}
