import {
  categoryFormSchema,
  toCategoryInput,
} from '@/features/categories/schema';

const valid = {
  name: ' Presentes ',
  type: 'expense',
  icon: 'gift',
  color: '#FF6B7A',
};

function issue(value: unknown): string | undefined {
  const parsed = categoryFormSchema.safeParse(value);

  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

test('rejects an empty name and an unknown icon', () => {
  expect(issue({ ...valid, name: '   ' })).toBe('Informe o nome da categoria.');
  expect(issue({ ...valid, icon: 'unknown' })).toBe('Escolha um ícone.');
  expect(issue({ ...valid, color: 'red' })).toBe('Escolha uma cor.');
});

test('trims the name before saving', () => {
  const parsed = categoryFormSchema.parse(valid);

  expect(toCategoryInput(parsed)).toEqual({
    name: 'Presentes',
    type: 'expense',
    icon: 'gift',
    color: '#FF6B7A',
  });
});
