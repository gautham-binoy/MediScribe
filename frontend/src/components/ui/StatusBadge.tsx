import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return (
        <Badge variant="emerald" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Approved
        </Badge>
      );
    case 'PENDING_REVIEW':
    case 'NEEDS_REVIEW':
      return (
        <Badge variant="amber" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Needs Review
        </Badge>
      );
    case 'GENERATED':
      return (
        <Badge variant="teal" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          Generated
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="purple" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
          Processing
        </Badge>
      );
    case 'RECORDING':
      return (
        <Badge variant="blue" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          Recording
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="rose" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Rejected
        </Badge>
      );
    case 'AI_DRAFT':
      return (
        <Badge variant="teal" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          AI Draft
        </Badge>
      );
    default:
      return (
        <Badge variant="slate" className={className}>
          {status.replace('_', ' ')}
        </Badge>
      );
  }
};
