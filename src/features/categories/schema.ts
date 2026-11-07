import { z } from 'zod';

import { categoryIcons } from '@/features/categories/options';

const hexColor = /^#[0-9A-Fa-f]{6}$/;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da categoria.')
    .max(40, 'Use até 40 caracteres.'),
  type: z.enum(['income', 'expense'], 'Escolha o tipo.'),
  icon: z.enum(categoryIcons, 'Escolha um ícone.'),
  color: z.string().regex(hexColor, 'Escolha uma cor.'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export type CategoryFormInput = {
  name: string;
  type: CategoryFormValues['type'];
  icon: CategoryFormValues['icon'];
  color: string;
};

export function toCategoryInput(values: CategoryFormValues): CategoryFormInput {
  return {
    name: values.name,
    type: values.type,
    icon: values.icon,
    color: values.color,
  };
}
