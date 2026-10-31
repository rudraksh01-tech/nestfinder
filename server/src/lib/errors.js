// An Error the error handler turns into a JSON response with this status.
export const httpError = (status, message) => Object.assign(new Error(message), { status });
