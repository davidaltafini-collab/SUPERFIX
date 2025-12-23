import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // De fiecare dată când se schimbă calea (pathname), urcă sus
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}