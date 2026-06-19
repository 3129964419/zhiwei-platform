import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logErrorBoundary } from '@/services/errorTracking';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义错误回退 UI */
  fallback?: ReactNode;
  /** 错误发生时的回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 是否显示错误详情（开发模式） */
  showErrorDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// 错误详情组件
function ErrorDetails({ error, errorInfo }: { error: Error; errorInfo?: ErrorInfo }) {
  const [expanded, setExpanded] = useState(false);

  if (!error && !errorInfo) return null;

  return (
    <div className="mt-6 text-left">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-ink-900/40 hover:text-ink-900/60 transition"
      >
        <Bug size={12} />
        {expanded ? '隐藏错误详情' : '显示错误详情'}
      </button>

      {expanded && (
        <div className="mt-3 p-3 bg-ink-50 rounded-lg overflow-auto max-h-48">
          <p className="text-xs font-mono text-coral-500 mb-2">
            {error.name}: {error.message}
          </p>
          {error.stack && (
            <pre className="text-[10px] font-mono text-ink-900/60 whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
          {errorInfo?.componentStack && (
            <div className="mt-2 pt-2 border-t border-ink-200">
              <p className="text-[10px] font-mono text-ink-900/40 mb-1">Component Stack:</p>
              <pre className="text-[10px] font-mono text-ink-900/60 whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';

// 错误回退 UI 组件
function ErrorFallback({
  error,
  errorInfo,
  onRetry,
}: {
  error?: Error;
  errorInfo?: ErrorInfo;
  onRetry: () => void;
}) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-ink-50 to-white p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-coral-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-coral-500" />
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-900 mb-3">
          页面出错了
        </h2>
        <p className="text-ink-900/60 mb-8">
          抱歉，页面出现了一些问题。请尝试刷新页面或返回首页。
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-iris-500 text-white font-medium rounded-xl hover:bg-iris-600 transition active:scale-98"
          >
            <RefreshCw size={18} />
            刷新页面
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-white text-ink-900 font-medium rounded-xl border border-ink-200 hover:bg-ink-50 transition"
          >
            <Home size={18} />
            返回首页
          </button>
        </div>

        {/* 开发模式显示错误详情 */}
        {isDev && error && <ErrorDetails error={error} errorInfo={errorInfo} />}
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误
    logErrorBoundary(error, errorInfo);

    // 更新状态
    this.setState({ errorInfo });

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback 或默认 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// 函数式错误边界包装器（用于 hooks）
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = () => setError(null);

  const captureError = (error: Error) => {
    setError(error);
    logErrorBoundary(error, { componentStack: '' });
  };

  return {
    error,
    resetError,
    captureError,
    ErrorBoundaryWrapper: ({ children }: { children: ReactNode }) => {
      if (error) {
        return (
          <ErrorFallback
            error={error}
            onRetry={() => {
              resetError();
              window.location.reload();
            }}
          />
        );
      }
      return <>{children}</>;
    },
  };
}
