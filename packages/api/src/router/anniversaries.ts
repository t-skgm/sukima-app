import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as anniversariesUsecase from '../usecases/anniversaries'
import {
	anniversaryOutputSchema,
	createAnniversaryInputSchema,
	updateAnniversaryInputSchema,
} from '../usecases/anniversaries'
import { base } from './base'

const createAnniversaryBodySchema = createAnniversaryInputSchema.shape.data
const updateAnniversaryBodySchema = updateAnniversaryInputSchema.shape.data.extend({
	id: z.number().int().positive(),
})
const deleteAnniversaryBodySchema = z.object({
	id: z.number().int().positive(),
})

export const anniversariesRouter = {
	list: base
		.input(z.object({}))
		.output(z.object({ anniversaries: z.array(anniversaryOutputSchema) }))
		.handler(async ({ context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return {
				anniversaries: await anniversariesUsecase.listAnniversaries(context.gateways)({
					where: { familyId },
				}),
			}
		}),

	create: base
		.input(createAnniversaryBodySchema)
		.output(anniversaryOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return anniversariesUsecase.createAnniversary(context.gateways)({
				where: { familyId },
				data: input,
			})
		}),

	update: base
		.input(updateAnniversaryBodySchema)
		.output(anniversaryOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			const { id, ...data } = input
			return anniversariesUsecase.updateAnniversary(context.gateways)({
				where: { familyId, id },
				data,
			})
		}),

	delete: base
		.input(deleteAnniversaryBodySchema)
		.output(z.object({ success: z.literal(true) }))
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			await anniversariesUsecase.deleteAnniversary(context.gateways)({
				where: { familyId, id: input.id },
			})
			return { success: true as const }
		}),
}
