import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loading component - Displays a spinning loading indicator
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the loading spinner (small, medium, large)
 * @param {string} props.color - Color of the spinner (primary, secondary, white)
 * @param {string} props.className - Additional CSS classes
 */
const Loading = ({ size = 'medium', color = 'primary', className = '' }) => {
  // Size mappings
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  // Color mappings
  const colorClasses = {
    primary: 'text-indigo-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;
  const spinnerColor = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${spinnerSize} ${spinnerColor}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

Loading.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  className: PropTypes.string,
};

export default Loading; 