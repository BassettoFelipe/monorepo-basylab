import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { setNavigationCallback } from '@/lib/api'

export function NavigationSetup() {
	const navigate = useNavigate()
	const location = useLocation()

	useEffect(() => {
		setNavigationCallback((path: string, replace?: boolean) => {
			navigate(path, { replace })
		})
	}, [navigate])

	// Scroll to top on route change
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [location.pathname])

	return null
}
