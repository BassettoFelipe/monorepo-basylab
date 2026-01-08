import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthState } from '@/hooks/useAuthState'
import { AffiliatesPage } from '@/pages/Admin/AffiliatesPage/Page'
import { ContractsPage } from '@/pages/Admin/ContractsPage/Page'
import { CustomersPage } from '@/pages/Admin/CustomersPage/Page'
import { DashboardPage } from '@/pages/Admin/DashboardPage/Page'
import { FinancePage } from '@/pages/Admin/FinancePage/Page'
import { InsurancePage } from '@/pages/Admin/InsurancePage/Page'
import { MyProfilePage } from '@/pages/Admin/MyProfilePage/Page'
import { PropertiesPage } from '@/pages/Admin/PropertiesPage/Page'
import { PropertyDetailsPage } from '@/pages/Admin/PropertyDetailsPage/Page'

import { PropertyOwnersPage } from '@/pages/Admin/PropertyOwnersPage/Page'
import { SchedulePage } from '@/pages/Admin/SchedulePage/Page'
import { SettingsPage } from '@/pages/Admin/SettingsPage/Page'
import { TeamPage } from '@/pages/Admin/TeamPage/Page'
import { TenantsPage } from '@/pages/Admin/TenantsPage/Page'
import { ConfirmEmailPage } from '@/pages/Auth/ConfirmEmailPage/ConfirmEmailPage'
import { ForgotPasswordPage } from '@/pages/Auth/ForgotPasswordPage/ForgotPasswordPage'
import { LoginPage } from '@/pages/Auth/LoginPage/LoginPage'
import { RegisterPage } from '@/pages/Auth/RegisterPage/RegisterPage'
import { ResetPasswordPage } from '@/pages/Auth/ResetPasswordPage/ResetPasswordPage'
import { SetupProfilePage } from '@/pages/Auth/SetupProfilePage/SetupProfilePage'
import { LandingPage } from '@/pages/Public/LandingPage/LandingPage'
import { PrivacyPage } from '@/pages/Public/PrivacyPage/PrivacyPage'
import { TermsPage } from '@/pages/Public/TermsPage/TermsPage'
import { PaymentCheckoutPage } from '@/pages/Subscription/PaymentCheckoutPage/PaymentCheckoutPage'
import { PaymentSuccessPage } from '@/pages/Subscription/PaymentSuccessPage/PaymentSuccessPage'
import { PendingPaymentPage } from '@/pages/Subscription/PendingPaymentPage/PendingPaymentPage'
import { RegistrationCheckoutPage } from '@/pages/Subscription/RegistrationCheckoutPage/RegistrationCheckoutPage'
import { RegistrationSuccessPage } from '@/pages/Subscription/RegistrationSuccessPage/RegistrationSuccessPage'
import { SubscriptionRequiredPage } from '@/pages/Subscription/SubscriptionRequiredPage/SubscriptionRequiredPage'
import { ProtectedRoute } from '@/routing/ProtectedRoute/ProtectedRoute'
import { storage } from '@/utils/storage'

/**
 * AppRouter - Roteamento baseado APENAS no localStorage
 *
 * Lógica:
 * 1. Confiamos no localStorage (token + status) para decidir rotas imediatamente
 * 2. A validação com API acontece em background nos componentes (useUser)
 * 3. Se token for inválido, o interceptor do axios faz logout e redireciona
 * 4. Nunca mostramos loading na tela inteira - dados de API usam skeletons nos componentes
 */
export const AppRouter = () => {
	const { isAuthenticated, sessionState } = useAuthState()
	const location = useLocation()

	// Verifica campos pendentes apenas do localStorage (validação instantânea)
	const hasPendingCustomFields = storage.getHasPendingCustomFields()
	const isOnSetupPage = location.pathname === '/setup-profile'

	// Rotas públicas compartilhadas
	const publicRoutes = (
		<>
			<Route path="/" element={<LandingPage />} />
			<Route path="/terms" element={<TermsPage />} />
			<Route path="/privacy" element={<PrivacyPage />} />
		</>
	)

	// Se autenticado com subscription ACTIVE mas tem campos pendentes
	if (isAuthenticated && sessionState === 'ACTIVE' && hasPendingCustomFields && !isOnSetupPage) {
		return (
			<Routes>
				{publicRoutes}
				<Route path="/setup-profile" element={<SetupProfilePage />} />
				<Route path="*" element={<Navigate to="/setup-profile" replace />} />
			</Routes>
		)
	}

	// Se autenticado com pagamento PENDING
	if (isAuthenticated && sessionState === 'PENDING') {
		return (
			<Routes>
				{publicRoutes}
				<Route path="/pending-payment" element={<PendingPaymentPage />} />
				<Route path="/payment" element={<PaymentCheckoutPage />} />
				<Route path="/payment-success" element={<PaymentSuccessPage />} />
				<Route path="/subscription-required" element={<SubscriptionRequiredPage />} />
				<Route path="*" element={<Navigate to="/pending-payment" replace />} />
			</Routes>
		)
	}

	// Se autenticado com subscription ACTIVE (fluxo principal logado)
	if (isAuthenticated && sessionState === 'ACTIVE') {
		return (
			<Routes>
				{publicRoutes}
				<Route path="/dashboard" element={<DashboardPage />} />
				<Route path="/properties" element={<PropertiesPage />} />
				<Route path="/properties/:id" element={<PropertyDetailsPage />} />
				<Route path="/property-owners" element={<PropertyOwnersPage />} />

				<Route path="/tenants" element={<TenantsPage />} />
				<Route path="/clients" element={<CustomersPage />} />
				<Route path="/contracts" element={<ContractsPage />} />
				<Route path="/finance" element={<FinancePage />} />
				<Route path="/schedule" element={<SchedulePage />} />
				<Route path="/insurance" element={<InsurancePage />} />
				<Route path="/affiliates" element={<AffiliatesPage />} />
				<Route
					path="/team"
					element={
						<ProtectedRoute requiredRoles={['owner', 'manager', 'admin']}>
							<TeamPage />
						</ProtectedRoute>
					}
				/>
				<Route path="/settings" element={<SettingsPage />} />
				<Route path="/profile" element={<MyProfilePage />} />
				<Route path="/setup-profile" element={<SetupProfilePage />} />
				<Route path="/payment-success" element={<PaymentSuccessPage />} />
				<Route path="/subscription-required" element={<SubscriptionRequiredPage />} />
				{/* Redireciona rotas de auth para dashboard quando já logado */}
				<Route path="/login" element={<Navigate to="/dashboard" replace />} />
				<Route path="/register" element={<Navigate to="/dashboard" replace />} />
				<Route path="/confirm-email" element={<Navigate to="/dashboard" replace />} />
				<Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
				<Route path="/reset-password" element={<Navigate to="/dashboard" replace />} />
				<Route path="/pending-payment" element={<Navigate to="/dashboard" replace />} />
				<Route path="/registration-checkout" element={<Navigate to="/dashboard" replace />} />
				<Route path="/registration-success" element={<Navigate to="/dashboard" replace />} />
				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
		)
	}

	// Não autenticado (PUBLIC) - rotas de auth
	return (
		<Routes>
			{publicRoutes}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/confirm-email" element={<ConfirmEmailPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />
			<Route path="/registration-checkout" element={<RegistrationCheckoutPage />} />
			<Route path="/registration-success" element={<RegistrationSuccessPage />} />
			<Route path="/payment-success" element={<PaymentSuccessPage />} />
			{/* Redireciona rotas protegidas para login quando não logado */}
			<Route path="/dashboard" element={<Navigate to="/login" replace />} />
			<Route path="/pending-payment" element={<Navigate to="/login" replace />} />
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	)
}
