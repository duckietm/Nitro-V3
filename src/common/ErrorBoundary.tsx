import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        try {
            console.error('[ErrorBoundary] Uncaught error:', error);
            console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
        } catch {}
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c1c20] text-white font-sans p-8 text-center">
                    <h1 className="text-2xl mb-2">Something went wrong</h1>
                    <p className="text-sm text-gray-400 mb-4 max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-2 bg-[#1E7295] text-white rounded cursor-pointer text-sm hover:brightness-90 transition"
                        >
                            Try again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-gray-600 text-white rounded cursor-pointer text-sm hover:brightness-90 transition"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
