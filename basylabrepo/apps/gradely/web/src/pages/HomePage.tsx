import { FeaturesSection } from '@components/landing/FeaturesSection/FeaturesSection'
import { HeroSection } from '@components/landing/HeroSection/HeroSection'
import { HowItWorksSection } from '@components/landing/HowItWorksSection/HowItWorksSection'

export function HomePage() {
	return (
		<main>
			<HeroSection />
			<HowItWorksSection />
			<FeaturesSection />
		</main>
	)
}
