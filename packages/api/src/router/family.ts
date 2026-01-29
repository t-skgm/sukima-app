import { ORPCError } from '@orpc/server'
import * as familyUsecase from '../usecases/family'
import {
	createFamilyInputSchema,
	createFamilyOutputSchema,
	updateFamilyInputSchema,
	updateFamilyOutputSchema,
} from '../usecases/family'
import { base } from './base'

// routerのinput用にbody部分のみ抽出
const createFamilyBodySchema = createFamilyInputSchema.shape.data
const updateFamilyBodySchema = updateFamilyInputSchema.shape.data

export const familyRouter = {
	create: base
		.input(createFamilyBodySchema)
		.output(createFamilyOutputSchema)
		.handler(async ({ input, context }) => {
			return familyUsecase.createFamily(context.gateways, {
				appUrl: context.env.APP_URL,
			})({ data: input })
		}),

	update: base
		.input(updateFamilyBodySchema)
		.output(updateFamilyOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return familyUsecase.updateFamily(context.gateways)({
				where: { familyId },
				data: input,
			})
		}),
}
