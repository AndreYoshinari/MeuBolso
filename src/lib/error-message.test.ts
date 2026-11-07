import { DatabaseError, ValidationError } from '@/lib/errors';
import { toUserMessage } from '@/lib/error-message';

test('returns the message of a known error and hides unknown failures', () => {
  expect(
    toUserMessage(
      new ValidationError([
        { field: 'amountCents', message: 'Informe um valor.' },
      ]),
    ),
  ).toBe('Informe um valor.');
  expect(
    toUserMessage(new DatabaseError('Falha ao acessar os dados locais.')),
  ).toBe('Falha ao acessar os dados locais.');
  expect(toUserMessage(new Error('SQLITE_ERROR: near SELECT'))).toBe(
    'Não foi possível concluir a operação.',
  );
});
