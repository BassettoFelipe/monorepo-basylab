import { Skeleton } from '@/components/Skeleton/Skeleton'
import * as styles from './PlanCardSkeleton.css'

const SKELETON_FEATURE_IDS = Array.from({ length: 6 }, (_, i) => `skeleton-feature-${i}`)

export function PlanCardSkeleton() {
	return (
		<div className={styles.skeletonCard} data-testid="plan-skeleton">
			<div className={styles.skeletonContent}>
				<div className={styles.skeletonHeader}>
					<Skeleton width="120px" height="20px" variant="rounded" />
					<Skeleton width="60%" height="24px" variant="rounded" />
					<Skeleton width="100%" height="36px" variant="rounded" />
				</div>

				<div className={styles.skeletonPricing}>
					<Skeleton width="150px" height="32px" variant="rounded" />
				</div>

				<div className={styles.skeletonFeatures}>
					{SKELETON_FEATURE_IDS.map((id) => (
						<div key={id} className={styles.skeletonFeature}>
							<Skeleton width="16px" height="16px" variant="rectangular" />
							<Skeleton width="80%" height="14px" variant="rounded" />
						</div>
					))}
				</div>

				<Skeleton width="100%" height="44px" variant="rounded" className={styles.skeletonButton} />
			</div>
		</div>
	)
}
