import { useState, useEffect } from 'react';

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isDesktop;
}

export const OmIcon = ({ className }) => (
  <img 
    src="/temple-logo.png" 
    alt="Om" 
    className={`${className} object-contain`}
    style={{ filter: 'drop-shadow(0 0 2px rgba(255,153,51,0.5))' }}
  />
);
