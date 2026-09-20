import { useEffect, useRef, useState } from "react";

// Anime un nombre de 0 vers sa valeur finale une fois visible à l'écran,
// pour que la barre de stats "sente" vivante plutôt que d'afficher des
// chiffres statiques.
export function useCountUp(target, { duration = 900 } = {}) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const startTime = performance.now();
        const from = 0;

        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(from + (target - from) * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  return [value, ref];
}
