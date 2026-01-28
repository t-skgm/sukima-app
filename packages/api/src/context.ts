import type { Env } from './env'
import type { Gateways } from './usecases/types'

/** oRPCコンテキスト */
export interface Context {
	env: Env
	familyId?: string
	gateways: Gateways
}
