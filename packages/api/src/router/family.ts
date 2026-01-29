import {
	familyCreateInputSchema,
	familyCreateOutputSchema,
	familyUpdateInputSchema,
	familyUpdateOutputSchema,
} from '@sukima/shared'
import * as familyUsecase from '../usecases/family'
import { pub } from './base'

export const familyRouter = {
	create: pub
		.input(familyCreateInputSchema)
		.output(familyCreateOutputSchema)
		.handler(async ({ input, context }) => {
			return familyUsecase.createFamily(context.gateways, {
				appUrl: context.env.APP_URL,
			})(input)
		}),

	update: pub
		.input(familyUpdateInputSchema)
		.output(familyUpdateOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new Error('Family ID is required')
			}

			return familyUsecase.updateFamily(context.gateways)(familyId, input)
		}),
}
