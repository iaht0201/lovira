import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  onReset?: () => void;
  key?: React.Key;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lovira Uncaught Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Có điều gì đó chưa hoạt động đúng
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Bạn có thể thử lại mà không cần tải lại toàn bộ Lovira. Nội dung và cài đặt của bạn vẫn được giữ an toàn.
            </p>

            {this.state.error && (
              <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-slate-600 dark:text-slate-400 overflow-x-auto max-h-24 text-left">
                {this.state.error.message}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
