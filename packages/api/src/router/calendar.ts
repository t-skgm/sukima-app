import { ORPCError } from '@orpc/server'
import { dateSchema } from '@sukima/shared'
import { z } from 'zod'
import * as calendarUsecase from '../usecases/calendar'
import { calendarOutputSchema } from '../usecases/calendar'
import { base } from './base'

export const calendarRouter = {
	get: base
		.input(z.object({ rangeStart: dateSchema }))
		.output(calendarOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return calendarUsecase.getCalendar(context.gateways)({
				where: { familyId, rangeStart: input.rangeStart },
			})
		}),
}
