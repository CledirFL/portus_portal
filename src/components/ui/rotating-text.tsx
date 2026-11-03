"use client";

import { useEffect, useState } from "react";

interface RotatingTextProps {
  items: string[];
  intervalMs?: number;
  className?: string;
}

/**
 * Alterna entre vários textos no mesmo espaço. Todos os itens ocupam a mesma
 * célula da grelha, por isso a largura é a do maior e a linha não salta.
 * Decorativo: quem usa deve dar a frase completa aos leitores de ecrã.
 */
export function RotatingText({ items, intervalMs = 2500, className = "" }: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), intervalMs);
    return () => window.clearInterval(timer);
  }, [items.length, intervalMs]);

  const previous = (index - 1 + items.length) % items.length;

  return (
    <span className={`inline-grid whitespace-nowrap align-bottom ${className}`} aria-hidden>
      {items.map((item, itemIndex) => {
        const isActive = itemIndex === index;
        const position = isActive ? "translate-y-0" : itemIndex === previous ? "-translate-y-[0.35em]" : "translate-y-[0.35em]";

        return (
          <span
            key={item}
            data-active={isActive}
            className={`col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${position} ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            {item}
          </span>
        );
      })}
    </span>
  );
}
