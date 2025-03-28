import React from 'react';
import './ErrorMessage.css';

export type ErrorType = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  type?: ErrorType;
  title?: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * A reusable component for displaying error messages with suggestions
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type = 'error',
  title,
  message,
  suggestion,
  onRetry,
  className = '',
}) => {
  // Default titles based on type if not provided
  const defaultTitles = {
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };

  const displayTitle = title || defaultTitles[type];

  return (
    <div className={`error-message error-message-${type} ${className}`}>
      <div className="error-message-header">
        <h3>{displayTitle}</h3>
      </div>
      <div className="error-message-body">
        <p className="error-message-text">{message}</p>
        {suggestion && <p className="error-message-suggestion">{suggestion}</p>}
      </div>
      {onRetry && (
        <div className="error-message-actions">
          <button onClick={onRetry} className="error-message-retry">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;