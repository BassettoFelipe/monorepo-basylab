import { Elysia } from 'elysia'
import { loginController } from './login/login'
import { meController } from './me/me'
import { refreshController } from './refresh/refresh'

export const authRoutes = new Elysia().use(loginController).use(refreshController).use(meController)
