export type FieldError = {
  field: string;
  message: string;
};

export class DatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  readonly fieldErrors: FieldError[];

  constructor(fieldErrors: FieldError[]) {
    super(fieldErrors.map(error => error.message).join(' '));
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NetworkError';
  }
}
