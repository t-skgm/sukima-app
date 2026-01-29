import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as blockedPeriodsUsecase from '../usecases/blocked-periods'
import {
	blockedPeriodOutputSchema,
	createBlockedPeriodDataSchema,
	dateRangeRefinement,
	updateBlockedPeriodDataSchema,
} from '../usecases/blocked-periods'
import { base } from './base'

// routerのinput用（refineを適用）
const createBlockedPeriodBodySchema = createBlockedPeriodDataSchema.refine(
	dateRangeRefinement.full,
	{ message: dateRangeRefinement.message },
)
const updateBlockedPeriodBodySchema = updateBlockedPeriodDataSchema
	.extend({
		id: z.number().int().positive(),
	})
	.refine(dateRangeRefinement.partial, { message: dateRangeRefinement.message })
const deleteBlockedPeriodBodySchema = z.object({
	id: z.number().int().positive(),
})

export const blockedPeriodsRouter = {
	list: base
		.input(z.object({}))
		.output(z.object({ blockedPeriods: z.array(blockedPeriodOutputSchema) }))
		.handler(async ({ context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return {
				blockedPeriods: await blockedPeriodsUsecase.listBlockedPeriods(context.gateways)({
					where: { familyId },
				}),
			}
		}),

	create: base
		.input(createBlockedPeriodBodySchema)
		.output(blockedPeriodOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return blockedPeriodsUsecase.createBlockedPeriod(context.gateways)({
				where: { familyId },
				data: input,
			})
		}),

	update: base
		.input(updateBlockedPeriodBodySchema)
		.output(blockedPeriodOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			const { id, ...data } = input
			return blockedPeriodsUsecase.updateBlockedPeriod(context.gateways)({
				where: { familyId, id },
				data,
			})
		}),

	delete: base
		.input(deleteBlockedPeriodBodySchema)
		.output(z.object({ success: z.literal(true) }))
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			await blockedPeriodsUsecase.deleteBlockedPeriod(context.gateways)({
				where: { familyId, id: input.id },
			})
			return { success: true as const }
		}),
}
