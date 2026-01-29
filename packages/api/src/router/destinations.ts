import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as destinationsUsecase from '../usecases/destinations'
import {
	createDestinationDataSchema,
	destinationOutputSchema,
	listDestinationsOutputSchema,
	updateDestinationDataSchema,
} from '../usecases/destinations'
import { base } from './base'

// routerのinput用
const createDestinationBodySchema = createDestinationDataSchema
const updateDestinationBodySchema = updateDestinationDataSchema.extend({
	id: z.number().int().positive(),
})
const deleteDestinationBodySchema = z.object({
	id: z.number().int().positive(),
})

export const destinationsRouter = {
	list: base
		.input(z.object({}))
		.output(listDestinationsOutputSchema)
		.handler(async ({ context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return destinationsUsecase.listDestinations(context.gateways)({
				where: { familyId },
			})
		}),

	create: base
		.input(createDestinationBodySchema)
		.output(destinationOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return destinationsUsecase.createDestination(context.gateways)({
				where: { familyId },
				data: input,
			})
		}),

	update: base
		.input(updateDestinationBodySchema)
		.output(destinationOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			const { id, ...data } = input
			return destinationsUsecase.updateDestination(context.gateways)({
				where: { familyId, id },
				data,
			})
		}),

	delete: base
		.input(deleteDestinationBodySchema)
		.output(z.object({ success: z.literal(true) }))
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			await destinationsUsecase.deleteDestination(context.gateways)({
				where: { familyId, id: input.id },
			})
			return { success: true as const }
		}),
}
