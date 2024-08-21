import * as status from '@/status';

/**
 * Converts a `ErrorStatusOr` to Javascript's native `Error`.
 *
 * @param sootError - The SOOT error to convert.
 * @param formatMessage - Native errors use error strings, by default we
 *   stringify the SOOT error, but an alternative formatter can be provided
 *   here.
 *
 * @returns A native error representing the provided SOOT error.
 */
export const toNativeError = <E>(
  sootError: status.ErrorStatusOr<E>,
  formatMessage?: (error: E) => string,
): Error => {
  const nativeError = new Error(
    formatMessage
      ? formatMessage(sootError.error)
      : JSON.stringify(sootError.error),
  );

  Object.assign(nativeError, { sootError });

  return nativeError;
};

/**
 * Forms an `ErrorStatusOr` from Javascript's native `Error`.
 *
 * @param error - The native `Error`.
 *
 * @returns A `ErrorStatusOr`.
 */
export const fromNativeError = (
  error: Error,
): status.ErrorStatusOr<unknown> => {
  // Errors formed by `toNativeError` may contain the field `sootError`. To
  // access that field we need to coerce the type here.
  //
  // Note that we do this here rather than in the parameters to avoid polluting
  // the method signature with implementation details that should remain opaque.
  const maybeContainsSootError: Error & { sootError?: unknown } = error;

  if (
    maybeContainsSootError.sootError != null &&
    status.isStatusOr(maybeContainsSootError.sootError) &&
    !status.isOk(maybeContainsSootError.sootError)
  ) {
    return maybeContainsSootError.sootError;
  }

  return status.fromError(error.message);
};

/**
 * Unwraps a StatusOr for an environment where StatusOr is not supported.
 * If the StatusOr is an error, throws an error - otherwise returns the
 * StatusOr's value.
 *
 * @param maybeValue The StatusOr.
 * @param createMessage This callback will be called if status is an error
 *   StatusOr and allows the caller to customize the message of the constructed
 *   error.
 *
 * @throws If the status is not OK.
 *
 * @returns The value of status.
 */
export const throwIfError = <T, E>(
  maybeValue: status.StatusOr<T, E>,
  createMessage?: (error: E) => string,
): T => {
  if (!status.isOk(maybeValue)) {
    throw toNativeError(maybeValue, createMessage);
  }
  return maybeValue.value;
};

/**
 * Wraps the provided lambda in a try-catch, and returns a failed StatusOr if
 * exceptions are thrown. This allows us to use 3rd party packages which throw
 * errors in our codebase which expects no errors to be thrown.
 *
 * Example Usage:
 *
 * ```ts
 * const maybeFoo = status.tryCatch(
 *     () => thirdPartyCode.getFoo(),
 *     (error) => ({
 *       type: status.StatusType.ERR_GENERIC,
 *       message: `Failed to get foo with error ${error.message}.`,
 *     })
 * );
 * ```
 *
 * @param wrapped The lambda to call. Returns a value which will be wrapped with
 *   StatusOr if the lambda succeeds without errors.
 * @param errorMessageFactory A lambda which converts a thrown error into an
 *   error message and status type. Used to customize the errors returned by
 *   failed lambdas.
 *
 * @returns StatusOr<T> the return type of the lambda wrapped as a StatusOr.
 */
export const tryCatch = <T, E>(
  wrapped: () => T,
  errorMessageFactory: (error: Error) => status.ErrorStatusOr<E>,
): status.StatusOr<T, E> => {
  try {
    return status.fromValue(wrapped());
  } catch (errorObject) {
    return errorMessageFactory(errorObject);
  }
};

/**
 * Async counterpart to `tryCatch`. See `tryCatch` documentation for details.
 *
 * @param wrapped The lambda to call. Returns a value which will be wrapped with
 *   StatusOr if the lambda succeeds without errors.
 * @param errorMessageFactory A lambda which converts a thrown error into an
 *   error message and status type. Used to customize the errors returned by
 *   failed lambdas.
 *
 * @returns The return type of the lambda wrapped as a StatusOr.
 */
export const tryCatchAsync = async <T, E>(
  wrapped: () => Promise<T>,
  errorMessageFactory: (error: Error) => status.ErrorStatusOr<E>,
): Promise<status.StatusOr<T, E>> => {
  try {
    return status.fromValue(await wrapped());
  } catch (errorObject) {
    return errorMessageFactory(errorObject);
  }
};
