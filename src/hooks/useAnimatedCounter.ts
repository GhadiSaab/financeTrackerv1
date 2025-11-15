import { useEffect, useState } from 'react';

export function useAnimatedCounter(end: number, duration: number = 1000, startOnMount: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnMount);

  useEffect(() => {
    if (!hasStarted && startOnMount) {
      setHasStarted(true);
    }
  }, [hasStarted, startOnMount]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const startValue = count;
    const difference = end - startValue;

    if (difference === 0) return;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + difference * easeOutQuart;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(step);
  }, [end, hasStarted]);

  return Math.round(count);
}
