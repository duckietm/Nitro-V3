import { Component, ErrorInfo, ReactNode } from 'react';
import { NitroLogger } from '@nitrots/nitro-renderer';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State>
{
    constructor(props: Props)
    {
        super(props);

        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State
    {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void
    {
        NitroLogger.error('[ErrorBoundary] Uncaught error:', error);
        NitroLogger.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    render(): ReactNode
    {
        if(this.state.hasError)
        {
            if(this.props.fallback) return this.props.fallback;

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    backgroundColor: '#1c1c20',
                    color: '#fff',
                    fontFamily: 'Ubuntu, sans-serif',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
                    <p style={{ fontSize: '0.875rem', color: '#adb5bd', marginBottom: '1rem' }}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#1E7295',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}>
                        Reload page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
