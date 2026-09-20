import { useEffect, useRef, useState } from "react";

// Anime l'apparition d'une section quand elle entre dans le viewport, une
// seule fois (pas de ré-animation en scrollant de haut en bas en boucle).
export default function Reveal({ children, className = "", delay = 0, as: Tag = "div", ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal-on-scroll ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
