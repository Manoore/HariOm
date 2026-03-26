import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Store error details for display
    this.setState({ 
      errorDetail: error?.message || error?.toString() || 'Unknown error',
      errorStack: errorInfo?.componentStack?.substring(0, 300) || ''
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorDetail: null, errorStack: null });
  };

  handleLogout = () => {
    localStorage.removeItem('divine_token');
    localStorage.removeItem('divine_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50 p-6"
             data-testid="error-boundary-fallback">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-4">
              We hit an unexpected issue. Please try again.
            </p>
            {this.state.errorDetail && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-red-700 text-xs font-mono break-all">{this.state.errorDetail}</p>
                {this.state.errorStack && (
                  <p className="text-red-400 text-[10px] font-mono mt-1 break-all">{this.state.errorStack}</p>
                )}
              </div>
            )}
            <button
              onClick={this.handleRetry}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold mb-3 transition-colors"
              data-testid="error-retry-btn"
            >
              Try Again
            </button>
            <button
              onClick={this.handleLogout}
              className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-3 font-semibold transition-colors"
              data-testid="error-logout-btn"
            >
              Sign Out & Restart
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
