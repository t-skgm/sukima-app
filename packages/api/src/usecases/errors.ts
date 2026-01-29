/** アプリケーションエラーの基底クラス */
export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message)
		this.name = 'AppError'
	}
}

/** リソースが見つからない (404) */
export class NotFoundError extends AppError {
	constructor(message: string) {
		super(message, 'NOT_FOUND')
		this.name = 'NotFoundError'
	}
}

/** 不正なリクエスト (400) */
export class BadRequestError extends AppError {
	constructor(message: string) {
		super(message, 'BAD_REQUEST')
		this.name = 'BadRequestError'
	}
}

/** 内部エラー (500) */
export class InternalError extends AppError {
	constructor(message: string) {
		super(message, 'INTERNAL_SERVER_ERROR')
		this.name = 'InternalError'
	}
}
