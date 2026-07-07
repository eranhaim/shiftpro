import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Generic tooltip wrapper. Wrap any element and provide a `content` string or JSX.
 *
 * Props:
 *  - content   (ReactNode)  — tooltip text/content
 *  - position  ('top' | 'bottom' | 'left' | 'right') — default 'top'
 *  - delay     (number ms)  — hover delay before showing, default 200
 *  - className (string)     — extra classes on the wrapper span
 */
export default function Tooltip({ children, content, position = 'top', delay = 200, className = '' }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-700 border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-700 border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-700 border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-700 border-y-transparent border-l-transparent border-4',
  };

  if (!content) return children;

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          className={`absolute z-50 pointer-events-none ${positionClasses[position]}`}
          role="tooltip"
        >
          <span className="block bg-gray-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            {content}
          </span>
          <span className={`absolute ${arrowClasses[position]}`} />
        </span>
      )}
    </span>
  );
}
