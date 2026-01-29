import { ORPCError } from '@orpc/server'
import {
	familyCreateInputSchema,
	familyCreateOutputSchema,
	familyUpdateInputSchema,
	familyUpdateOutputSchema,
} from '@sukima/shared'
import * as familyUsecase from '../usecases/family'
import { base } from './base'

export const familyRouter = {
	create: base
		.input(familyCreateInputSchema)
		.output(familyCreateOutputSchema)
		.handler(async ({ input, context }) => {
			return familyUsecase.createFamily(context.gateways, {
				appUrl: context.env.APP_URL,
			})(input)
		}),

	update: base
		.input(familyUpdateInputSchema)
		.output(familyUpdateOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return familyUsecase.updateFamily(context.gateways)(familyId, input)
		}),
}
