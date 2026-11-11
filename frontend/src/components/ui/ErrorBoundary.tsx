import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './index';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-ink-primary">
              Something went wrong
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              An unexpected error occurred while loading this view. You can reload or try again.
            </p>
            {this.state.error && (
              <pre className="text-[11px] text-left p-3 bg-gray-50 rounded-xl overflow-x-auto text-red-600 max-h-24">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<RotateCcw size={14} />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

