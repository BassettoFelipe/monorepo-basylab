import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import * as styles from './PropertyMap.css'

interface Coordinates {
	lat: number
	lng: number
}

interface PropertyMapProps {
	address: string
	city?: string | null
	state?: string | null
	neighborhood?: string | null
	zipCode?: string | null
}

interface GeocodingResult {
	lat: string
	lon: string
	display_name: string
}

async function geocodeAddress(fullAddress: string): Promise<Coordinates | null> {
	try {
		const encodedAddress = encodeURIComponent(fullAddress)
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`,
			{
				headers: {
					'User-Agent': '3balug-property-app',
				},
			},
		)

		if (!response.ok) {
			throw new Error('Geocoding request failed')
		}

		const data: GeocodingResult[] = await response.json()

		if (data.length > 0) {
			return {
				lat: Number.parseFloat(data[0].lat),
				lng: Number.parseFloat(data[0].lon),
			}
		}

		return null
	} catch (error) {
		console.error('Geocoding error:', error)
		return null
	}
}

export function PropertyMap({ address, city, state, neighborhood, zipCode }: PropertyMapProps) {
	const mapContainerRef = useRef<HTMLDivElement>(null)
	const mapInstanceRef = useRef<any>(null)
	const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isMapReady, setIsMapReady] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Geocode address
	useEffect(() => {
		let cancelled = false

		async function fetchCoordinates() {
			// Build full address for geocoding
			const addressParts = [address]
			if (neighborhood) addressParts.push(neighborhood)
			if (city) addressParts.push(city)
			if (state) addressParts.push(state)
			if (zipCode) addressParts.push(zipCode)
			addressParts.push('Brasil')

			const fullAddress = addressParts.filter(Boolean).join(', ')

			// Try with full address first
			let result = await geocodeAddress(fullAddress)

			// If no result, try with just city and state
			if (!result && city && state) {
				result = await geocodeAddress(`${city}, ${state}, Brasil`)
			}

			// If still no result, try with just city
			if (!result && city) {
				result = await geocodeAddress(`${city}, Brasil`)
			}

			if (!cancelled) {
				if (result) {
					setCoordinates(result)
				} else {
					setError('Nao foi possivel encontrar a localizacao no mapa')
				}
				setIsLoading(false)
			}
		}

		if (address || city) {
			fetchCoordinates()
		} else {
			setIsLoading(false)
			setError('Endereco nao informado')
		}

		return () => {
			cancelled = true
		}
	}, [address, city, state, neighborhood, zipCode])

	// Load Leaflet and initialize map only when we have coordinates
	useEffect(() => {
		if (!coordinates || !mapContainerRef.current || mapInstanceRef.current) return

		const coords = coordinates
		let cancelled = false

		async function initMap() {
			try {
				// Dynamic import of leaflet
				const L = (await import('leaflet')).default
				await import('leaflet/dist/leaflet.css')

				if (cancelled || !mapContainerRef.current) return

				// Fix for default marker icon
				const defaultIcon = L.icon({
					iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
					iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
					shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
					iconSize: [25, 41],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34],
					shadowSize: [41, 41],
				})

				// Create map
				const map = L.map(mapContainerRef.current, {
					scrollWheelZoom: false,
				}).setView([coords.lat, coords.lng], 15)

				// Add tile layer
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
				}).addTo(map)

				// Add marker
				L.marker([coords.lat, coords.lng], { icon: defaultIcon })
					.addTo(map)
					.bindPopup(
						`<div style="display:flex;align-items:center;gap:4px"><span>${address}</span></div>`,
					)

				mapInstanceRef.current = map
				setIsMapReady(true)
			} catch (err) {
				console.error('Failed to load map:', err)
				if (!cancelled) {
					setError('Falha ao carregar o mapa')
				}
			}
		}

		initMap()

		return () => {
			cancelled = true
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove()
				mapInstanceRef.current = null
			}
		}
	}, [coordinates, address])

	if (isLoading) {
		return (
			<div className={styles.loadingContainer}>
				<Loader2 size={24} className={styles.spinner} />
				<span>Carregando mapa...</span>
			</div>
		)
	}

	if (error || !coordinates) {
		return (
			<div className={styles.errorContainer}>
				<AlertCircle size={20} />
				<span>{error || 'Localizacao nao disponivel'}</span>
			</div>
		)
	}

	return (
		<div className={styles.mapWrapper}>
			{!isMapReady && (
				<div className={styles.mapOverlayLoading}>
					<Loader2 size={24} className={styles.spinner} />
					<span>Carregando mapa...</span>
				</div>
			)}
			<div ref={mapContainerRef} className={styles.mapContainer} />
		</div>
	)
}
