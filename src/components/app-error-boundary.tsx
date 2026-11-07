import { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorView } from '@/components/error-view';
import { useTheme } from '@/theme';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
  attempt: number;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null, attempt: 0 };

  static getDerivedStateFromError(
    error: Error,
  ): Pick<AppErrorBoundaryState, 'error'> {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error('render', error.name);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorFallback
          onRetry={() => {
            this.setState(current => ({
              error: null,
              attempt: current.attempt + 1,
            }));
          }}
        />
      );
    }

    return (
      <View key={this.state.attempt} style={styles.fill}>
        {this.props.children}
      </View>
    );
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <ErrorView
        message="Não foi possível mostrar esta tela."
        onRetry={onRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
