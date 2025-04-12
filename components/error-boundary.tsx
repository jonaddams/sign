'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen flex-col items-center justify-center'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })} className='mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
