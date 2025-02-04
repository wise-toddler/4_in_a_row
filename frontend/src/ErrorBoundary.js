import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-100 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h1>
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <details className="text-red-600">
              <summary>Error details</summary>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </details>
          </div>
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;