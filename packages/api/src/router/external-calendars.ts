import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as externalCalendarsUsecase from '../usecases/external-calendars'
import {
	createExternalCalendarInputSchema,
	externalCalendarOutputSchema,
	syncResultOutputSchema,
} from '../usecases/external-calendars'
import { base } from './base'

const createBodySchema = createExternalCalendarInputSchema.shape.data
const deleteBodySchema = z.object({ id: z.number().int().positive() })
const syncBodySchema = z.object({ id: z.number().int().positive() })

export const externalCalendarsRouter = {
	list: base
		.input(z.object({}))
		.output(z.object({ calendars: z.array(externalCalendarOutputSchema) }))
		.handler(async ({ context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', { message: 'Family ID is required' })
			}

			return {
				calendars: await externalCalendarsUsecase.listExternalCalendars(context.gateways)({
					where: { familyId },
				}),
			}
		}),

	create: base
		.input(createBodySchema)
		.output(externalCalendarOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', { message: 'Family ID is required' })
			}

			return externalCalendarsUsecase.createExternalCalendar(context.gateways)({
				where: { familyId },
				data: input,
			})
		}),

	delete: base
		.input(deleteBodySchema)
		.output(z.object({ success: z.literal(true) }))
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', { message: 'Family ID is required' })
			}

			await externalCalendarsUsecase.deleteExternalCalendar(context.gateways)({
				where: { familyId, id: input.id },
			})
			return { success: true as const }
		}),

	sync: base
		.input(syncBodySchema)
		.output(syncResultOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', { message: 'Family ID is required' })
			}

			return externalCalendarsUsecase.syncExternalCalendar(context.gateways)({
				where: { familyId, id: input.id },
			})
		}),
}
