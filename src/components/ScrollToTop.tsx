import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // පිටුව (Route) මාරු වන සෑම අවස්ථාවකදීම උඩටම Scroll කරයි
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // ප්‍රමාදයකින් තොරව ක්ෂණිකව උඩින්ම පෙන්වයි
    });
  }, [pathname]);

  return null;
};