import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as settingsUsecase from '../usecases/settings'
import { settingsOutputSchema } from '../usecases/settings'
import { base } from './index'

export const settingsRouter = {
	get: base
		.input(z.object({}))
		.output(settingsOutputSchema)
		.handler(async ({ context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return settingsUsecase.getSettings(context.gateways, { appUrl: context.env.APP_URL })({
				where: { familyId },
			})
		}),
}
