import React from 'react';

interface OrangeBrandLogoProps {
  className?: string;
  height?: number;
}

export const OrangeBrandLogo: React.FC<OrangeBrandLogoProps> = ({ 
  className = '', 
  height = 92 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <img
        src="/assets/aistudio/image_e7d8bffc.png"
        alt="Orange est là - Invitation"
        style={{ height: `${height}px`, width: 'auto' }}
        className="block object-contain mx-auto drop-shadow-[0_4px_16px_rgba(255,121,0,0.3)] transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
};
