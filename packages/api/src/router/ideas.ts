import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as ideasUsecase from '../usecases/ideas'
import {
	confirmMonthlyIdeaDataSchema,
	confirmMonthlyIdeaOutputSchema,
	confirmTripIdeaDataSchema,
	confirmTripIdeaOutputSchema,
	createMonthlyIdeaDataSchema,
	createTripIdeaDataSchema,
	dateRangeRefinement,
	monthlyIdeaOutputSchema,
	tripIdeaOutputSchema,
	updateMonthlyIdeaDataSchema,
	updateTripIdeaDataSchema,
} from '../usecases/ideas'
import { base } from './index'

// === Trip Ideas ===

const createTripIdeaBodySchema = createTripIdeaDataSchema
const updateTripIdeaBodySchema = updateTripIdeaDataSchema.extend({
	id: z.number().int().positive(),
})
const deleteTripIdeaBodySchema = z.object({
	id: z.number().int().positive(),
})
const confirmTripIdeaBodySchema = confirmTripIdeaDataSchema
	.extend({
		id: z.number().int().positive(),
	})
	.refine(dateRangeRefinement.full, { message: dateRangeRefinement.message })

// === Monthly Ideas ===

const createMonthlyIdeaBodySchema = createMonthlyIdeaDataSchema
const updateMonthlyIdeaBodySchema = updateMonthlyIdeaDataSchema.extend({
	id: z.number().int().positive(),
})
const deleteMonthlyIdeaBodySchema = z.object({
	id: z.number().int().positive(),
})
const confirmMonthlyIdeaBodySchema = confirmMonthlyIdeaDataSchema
	.extend({
		id: z.number().int().positive(),
	})
	.refine(dateRangeRefinement.full, { message: dateRangeRefinement.message })

export const ideasRouter = {
	// === Trip Ideas ===
	trips: {
		list: base
			.input(z.object({}))
			.output(z.object({ tripIdeas: z.array(tripIdeaOutputSchema) }))
			.handler(async ({ context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				return {
					tripIdeas: await ideasUsecase.listTripIdeas(context.gateways)({
						where: { familyId },
					}),
				}
			}),

		create: base
			.input(createTripIdeaBodySchema)
			.output(tripIdeaOutputSchema)
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				return ideasUsecase.createTripIdea(context.gateways)({
					where: { familyId },
					data: input,
				})
			}),

		update: base
			.input(updateTripIdeaBodySchema)
			.output(tripIdeaOutputSchema)
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				const { id, ...data } = input
				return ideasUsecase.updateTripIdea(context.gateways)({
					where: { familyId, id },
					data,
				})
			}),

		delete: base
			.input(deleteTripIdeaBodySchema)
			.output(z.object({ success: z.literal(true) }))
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				await ideasUsecase.deleteTripIdea(context.gateways)({
					where: { familyId, id: input.id },
				})
				return { success: true as const }
			}),

		confirm: base
			.input(confirmTripIdeaBodySchema)
			.output(confirmTripIdeaOutputSchema)
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				const { id, ...data } = input
				return ideasUsecase.confirmTripIdea(context.gateways)({
					where: { familyId, id },
					data,
				})
			}),
	},

	// === Monthly Ideas ===
	monthly: {
		list: base
			.input(z.object({}))
			.output(z.object({ monthlyIdeas: z.array(monthlyIdeaOutputSchema) }))
			.handler(async ({ context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				return {
					monthlyIdeas: await ideasUsecase.listMonthlyIdeas(context.gateways)({
						where: { familyId },
					}),
				}
			}),

		create: base
			.input(createMonthlyIdeaBodySchema)
			.output(monthlyIdeaOutputSchema)
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				return ideasUsecase.createMonthlyIdea(context.gateways)({
					where: { familyId },
					data: input,
				})
			}),

		update: base
			.input(updateMonthlyIdeaBodySchema)
			.output(monthlyIdeaOutputSchema)
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				const { id, ...data } = input
				return ideasUsecase.updateMonthlyIdea(context.gateways)({
					where: { familyId, id },
					data,
				})
			}),

		delete: base
			.input(deleteMonthlyIdeaBodySchema)
			.output(z.object({ success: z.literal(true) }))
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				await ideasUsecase.deleteMonthlyIdea(context.gateways)({
					where: { familyId, id: input.id },
				})
				return { success: true as const }
			}),

		confirm: base
			.input(confirmMonthlyIdeaBodySchema)
			.output(confirmMonthlyIdeaOutputSchema)
			.handler(async ({ input, context }) => {
				const familyId = context.familyId
				if (!familyId) {
					throw new ORPCError('BAD_REQUEST', {
						message: 'Family ID is required',
					})
				}

				const { id, ...data } = input
				return ideasUsecase.confirmMonthlyIdea(context.gateways)({
					where: { familyId, id },
					data,
				})
			}),
	},
}
