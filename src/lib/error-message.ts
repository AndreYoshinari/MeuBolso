import {
  DatabaseError,
  NetworkError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';

export function toUserMessage(error: unknown): string {
  if (
    error instanceof ValidationError ||
    error instanceof DatabaseError ||
    error instanceof NotFoundError ||
    error instanceof NetworkError
  ) {
    return error.message;
  }

  return 'Não foi possível concluir a operação.';
}
