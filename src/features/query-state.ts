import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { toUserMessage } from '@/lib/error-message';

export type QueryState<T> = {
  data: T | undefined;
  isLoading: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
};

export type MutationState<TData, TVariables> = {
  execute: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  errorMessage: string | null;
  reset: () => void;
};

export function useQueryState<T>(query: UseQueryResult<T>): QueryState<T> {
  return {
    data: query.data,
    isLoading: query.isLoading,
    errorMessage: query.error ? toUserMessage(query.error) : null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useAppMutation<TData, TVariables>(
  options: UseMutationOptions<TData, unknown, TVariables>,
): MutationState<TData, TVariables> {
  const mutation = useMutation(options);

  return {
    execute: variables => mutation.mutateAsync(variables),
    isPending: mutation.isPending,
    errorMessage: mutation.error ? toUserMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}

export { useQuery };
