"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development, could send to monitoring service in production
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                    </div>
                    <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">
                        Algo salió mal
                    </h2>
                    <p className="text-text-secondary dark:text-text-muted mb-6 max-w-md">
                        Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mb-4 p-4 bg-gray-100 dark:bg-surface-dark rounded-lg text-left text-sm overflow-auto max-w-full">
                            <code className="text-red-600 dark:text-red-400">
                                {this.state.error.message}
                            </code>
                        </pre>
                    )}
                    <button
                        onClick={this.handleRetry}
                        className="px-6 py-3 rounded-xl bg-voaya-primary text-white font-semibold hover:bg-voaya-primary-dark transition-colors shadow-md"
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Intentar de nuevo
                        </span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
