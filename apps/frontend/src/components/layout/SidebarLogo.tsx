import React from 'react';
import { Logo } from '../ui/Logo';

interface SidebarLogoProps {
  isCollapsed?: boolean;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({ isCollapsed = false }) => {
  return <Logo size="lg" showText={!isCollapsed} />;
};

