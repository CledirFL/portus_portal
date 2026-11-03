"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { JourneyScene } from "@/modules/landing/components/journey-scene";
import { journeySteps, stepIndexAt, type JourneyStep } from "@/modules/landing/journey-timeline";

/**
 * Secção "Como funciona": a cena fica fixa no ecrã enquanto o scroll conta a
 * viagem da encomenda. Com movimento reduzido mostra as etapas como imagens.
 */
export function JourneyScroll() {
  const reduceMotion = useReducedMotion();
  // O servidor não conhece a preferência: só troca de versão depois de hidratar.
  const isHydrated = useHydrated();
  return isHydrated && reduceMotion ? <JourneyStatic /> : <JourneyAnimated />;
}

function SectionHeading() {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-star">Como funciona</p>
      <h2 id="journey-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Da sua porta ao porto da Praia.
      </h2>
    </div>
  );
}

function StepsForScreenReaders() {
  return (
    <ol className="sr-only">
      {journeySteps.map((step) => (
        <li key={step.id}>
          {step.title}: {step.text}
        </li>
      ))}
    </ol>
  );
}

function JourneyAnimated() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (progress) => setActive(stepIndexAt(progress)));

  function goToStep(step: JourneyStep) {
    const section = sectionRef.current;
    if (!section) return;
    const scrollable = section.offsetHeight - window.innerHeight;
    // Um pouco depois do início, para a etapa já estar em andamento.
    const target = step.range[0] + (step.snapshot - step.range[0]) * 0.5;
    window.scrollTo({ top: section.offsetTop + scrollable * target, behavior: "smooth" });
  }

  const step = journeySteps[active];

  return (
    <section ref={sectionRef} aria-labelledby="journey-title" className="relative h-[520vh] bg-brand-950">
      <StepsForScreenReaders />
      <div className="sticky top-16 mx-auto flex h-[calc(100svh-4rem)] max-w-6xl flex-col justify-center gap-4 px-4 py-6 sm:px-6 lg:justify-start lg:gap-5 lg:py-8">
        <SectionHeading />

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/40 sm:aspect-15/8 lg:aspect-auto lg:min-h-0 lg:flex-1">
          <JourneyScene progress={scrollYProgress} className="absolute inset-0 h-full w-full" />
        </div>

        <div aria-hidden>
          <div className="grid grid-cols-5 gap-2">
            {journeySteps.map((item, index) => (
              <StepSegment
                key={item.id}
                step={item}
                index={index}
                active={index === active}
                progress={scrollYProgress}
                onSelect={() => goToStep(item)}
              />
            ))}
          </div>
          <div className="mt-4 min-h-18">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <p className="font-semibold text-white">
                  <span className="mr-2 text-star">0{active + 1}</span>
                  {step.title}
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-100/75">{step.text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepSegment({
  step,
  index,
  active,
  progress,
  onSelect,
}: {
  step: JourneyStep;
  index: number;
  active: boolean;
  progress: MotionValue<number>;
  onSelect: () => void;
}) {
  const [start, end] = step.range;
  const fill = useTransform(progress, [start, end], [0, 1], { clamp: true });

  return (
    <button type="button" tabIndex={-1} onClick={onSelect} className="group text-left">
      <span className="block h-1 overflow-hidden rounded-full bg-white/15">
        <motion.span className="block h-full origin-left rounded-full bg-star" style={{ scaleX: fill }} />
      </span>
      <span
        className={`mt-2 hidden text-xs font-medium transition-colors sm:block ${
          active ? "text-white" : "text-brand-200/50 group-hover:text-brand-100"
        }`}
      >
        0{index + 1} · {step.title}
      </span>
    </button>
  );
}

function JourneyStatic() {
  return (
    <section aria-labelledby="journey-title" className="bg-brand-950">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {journeySteps.map((step, index) => (
            <li key={step.id}>
              <StaticScene progress={step.snapshot} />
              <p className="mt-4 font-semibold text-white">
                <span className="mr-2 text-star">0{index + 1}</span>
                {step.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-brand-100/75">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StaticScene({ progress }: { progress: number }) {
  const value = useMotionValue(progress);
  return (
    <div className="relative aspect-15/8 overflow-hidden rounded-xl ring-1 ring-white/10">
      <JourneyScene progress={value} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
