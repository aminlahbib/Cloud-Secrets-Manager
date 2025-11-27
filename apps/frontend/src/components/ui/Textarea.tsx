import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  className = '',
  ...props
}) => {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 resize-vertical bg-white ${className}`}
      {...props}
    />
  );
};
