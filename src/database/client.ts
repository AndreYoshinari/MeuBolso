import { DatabaseError } from '@/lib/errors';

export type SqlValue = string | number | null;

export type SqlParams = readonly SqlValue[];

export type SqlStatement = {
  sql: string;
  params?: SqlParams;
};

export type DatabaseClient = {
  run(sql: string, params?: SqlParams): Promise<void>;
  get<T extends Record<string, SqlValue>>(
    sql: string,
    params?: SqlParams,
  ): Promise<T | null>;
  all<T extends Record<string, SqlValue>>(
    sql: string,
    params?: SqlParams,
  ): Promise<T[]>;
  transaction<T>(work: () => Promise<T>): Promise<T>;
};

export function toDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  const message = error instanceof Error ? error.message : '';

  if (message.includes('default category')) {
    return new DatabaseError('Categoria padrão não pode ser excluída.', {
      cause: error,
    });
  }

  if (message.includes('category in use')) {
    return new DatabaseError(
      'Não é possível mudar o tipo de uma categoria em uso.',
      { cause: error },
    );
  }

  if (message.includes('FOREIGN KEY')) {
    return new DatabaseError(
      'Não foi possível concluir porque há registros vinculados.',
      { cause: error },
    );
  }

  if (message.includes('UNIQUE')) {
    return new DatabaseError('Já existe um registro com esses dados.', {
      cause: error,
    });
  }

  if (
    message.includes('CHECK') ||
    message.includes('mismatch') ||
    message.includes('constraint') ||
    message.includes('budget requires')
  ) {
    return new DatabaseError('Os dados não atendem às regras do banco.', {
      cause: error,
    });
  }

  return new DatabaseError('Falha ao acessar os dados locais.', {
    cause: error,
  });
}
