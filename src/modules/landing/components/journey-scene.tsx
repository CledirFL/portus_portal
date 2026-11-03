"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useId } from "react";
import * as timeline from "@/modules/landing/journey-timeline";
import { CONTAINER, GROUND_Y, SHIP } from "@/modules/landing/journey-timeline";

/**
 * Ilustração da viagem de uma encomenda: recolha em casa, carrinha, contentor,
 * grua, navio e chegada a Cabo Verde. O mundo tem ~5500 unidades de largura e
 * a "câmara" mostra 1200 de cada vez, deslocando-se com o progresso.
 */

type Progress = MotionValue<number>;

const colors = {
  brand600: "#2552e3",
  brand700: "#1d40c8",
  brand800: "#1d36a2",
  brand900: "#1d3280",
  brand950: "#121d4a",
  star: "#f7c600",
  road: "#475569",
  kraft: "#c8955a",
  terracotta: "#e76f51",
  teal: "#2a9d8f",
  skin: "#8d5524",
};

const SEA_START = 2780;
const WORLD_END = 6000;

function wavePath(fromX: number, toX: number, y: number, amplitude: number) {
  const periods = Math.ceil((toX - fromX) / 80);
  return `M${fromX} ${y} ${`q20 ${-amplitude} 40 0 t40 0 `.repeat(periods)}V640 H${fromX} Z`;
}

export function JourneyScene({ progress, className = "" }: { progress: Progress; className?: string }) {
  // Os ids dos gradientes têm de ser únicos quando há várias cenas na página.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = { sky: `${uid}-sky`, sunset: `${uid}-sunset`, sea: `${uid}-sea`, seaClip: `${uid}-sea-clip` };

  const camera = useTransform(progress, (p) => -timeline.cameraX(p));
  const clouds = useTransform(progress, (p) => -timeline.cameraX(p) * 0.15);
  const farHills = useTransform(progress, (p) => -timeline.cameraX(p) * 0.4);
  const nearHills = useTransform(progress, (p) => -timeline.cameraX(p) * 0.6);
  const sunset = useTransform(progress, timeline.sunsetOpacity);
  const sunY = useTransform(progress, (p) => timeline.track(p, [[0.72, 120], [1, 330]]));

  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={ids.sky} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#9cc2fb" />
          <stop offset="1" stopColor="#eef5ff" />
        </linearGradient>
        <linearGradient id={ids.sunset} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4c3a8f" />
          <stop offset="0.55" stopColor="#f08a5d" />
          <stop offset="1" stopColor="#ffd38a" />
        </linearGradient>
        <linearGradient id={ids.sea} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2552e3" />
          <stop offset="1" stopColor="#121d4a" />
        </linearGradient>
        <clipPath id={ids.seaClip}>
          <rect x={SEA_START} y="0" width={WORLD_END - SEA_START} height="640" />
        </clipPath>
      </defs>

      <rect width="1200" height="640" fill={`url(#${ids.sky})`} />
      <motion.rect width="1200" height="640" fill={`url(#${ids.sunset})`} style={{ opacity: sunset }} />
      <motion.circle cx="960" cy={sunY} r="38" fill="#fde68a" />

      <motion.g style={{ x: clouds }}>
        <g className="motion-safe:animate-drift">
          {[
            [140, 110, 1],
            [520, 70, 0.8],
            [880, 140, 1.1],
            [1320, 90, 0.9],
            [1720, 130, 1],
            [2050, 80, 0.7],
          ].map(([x, y, size]) => (
            <Cloud key={x} x={x} y={y} size={size} />
          ))}
        </g>
      </motion.g>

      <motion.g style={{ x: farHills }}>
        <path
          d="M-50 470 C80 380 200 360 320 420 S560 360 700 400 S980 340 1120 410 S1380 380 1500 470 Z"
          fill="#bcd4f6"
        />
      </motion.g>
      <motion.g style={{ x: nearHills }}>
        <path
          d="M-50 470 C150 400 300 410 420 440 S700 390 860 430 S1200 400 1350 440 S1700 410 1920 470 Z"
          fill="#a9d3c0"
        />
      </motion.g>

      <motion.g style={{ x: camera }}>
        <Ground />
        <Neighbourhood />
        <Roadside />
        <Port />
        <Sea ids={ids} />
        <Islands progress={progress} />
        <Crane progress={progress} />
        <YardContainer progress={progress} />
        <Van progress={progress} />
        <Agent progress={progress} />
        <Box progress={progress} />
        <Ship progress={progress} />
        <path d={wavePath(SEA_START, WORLD_END, 512, 5)} fill={colors.brand800} opacity="0.92" clipPath={`url(#${ids.seaClip})`} />
      </motion.g>
    </svg>
  );
}

function Cloud({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} fill="white" opacity="0.9">
      <circle cx="0" cy="0" r="22" />
      <circle cx="26" cy="-10" r="28" />
      <circle cx="56" cy="2" r="20" />
      <rect x="-20" y="0" width="94" height="20" rx="10" />
    </g>
  );
}

function Ground() {
  return (
    <g>
      <rect x="-200" y={GROUND_Y} width={SEA_START + 200} height="170" fill="#86c89f" />
      <rect x="1880" y={GROUND_Y} width={SEA_START - 1880} height="170" fill="#cbd5e1" />
      <rect x="-200" y={GROUND_Y - 8} width="2080" height="8" fill="#e2e8f0" />
      <rect x="-200" y={GROUND_Y} width={SEA_START + 200} height="36" fill={colors.road} />
      <line x1="-200" x2={SEA_START} y1={GROUND_Y + 18} y2={GROUND_Y + 18} stroke="white" strokeWidth="3" strokeDasharray="24 18" opacity="0.7" />
    </g>
  );
}

function Tree({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND_Y - 8}) scale(${scale})`}>
      <rect x="-4" y="-50" width="8" height="50" fill="#8b5e3c" />
      <circle cx="0" cy="-66" r="26" fill="#4caf7a" />
      <circle cx="-16" cy="-52" r="16" fill="#3f9d6b" />
      <circle cx="16" cy="-54" r="15" fill="#5cc08a" />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} ${GROUND_Y - 8})`}>
      <rect x="-2" y="-96" width="4" height="96" fill="#64748b" />
      <path d="M0 -96 q0 -10 18 -10" stroke="#64748b" strokeWidth="4" fill="none" />
      <rect x="12" y="-108" width="16" height="6" rx="3" fill={colors.star} />
    </g>
  );
}

function Neighbourhood() {
  return (
    <g>
      {/* Casa vizinha */}
      <rect x="30" y="372" width="120" height="90" fill="#e0f2fe" />
      <polygon points="18,375 90,325 162,375" fill="#f4a261" />
      <rect x="54" y="398" width="30" height="26" fill="#bfd5fd" stroke="white" strokeWidth="3" />
      <rect x="100" y="410" width="26" height="52" fill="#93b8fb" />

      {/* Casa do cliente */}
      <rect x="200" y="342" width="200" height="120" fill="#fff7ed" />
      <polygon points="184,346 300,280 416,346" fill={colors.terracotta} />
      <rect x="282" y="300" width="18" height="30" fill="#c2410c" />
      <rect x="220" y="368" width="44" height="34" fill="#bfd5fd" stroke="white" strokeWidth="4" />
      <rect x="340" y="368" width="44" height="34" fill="#bfd5fd" stroke="white" strokeWidth="4" />
      <rect x="283" y="392" width="36" height="70" rx="2" fill={colors.brand700} />
      <circle cx="312" cy="428" r="2.5" fill={colors.star} />
      <rect x="276" y="458" width="50" height="4" fill="#94a3b8" />

      <Tree x={455} />
    </g>
  );
}

function Roadside() {
  return (
    <g>
      {[820, 1080, 1400, 1650].map((x, index) => (
        <Tree key={x} x={x} scale={index % 2 ? 0.85 : 1} />
      ))}
      {[950, 1250, 1530].map((x) => (
        <Lamp key={x} x={x} />
      ))}
      <g transform={`translate(1790 ${GROUND_Y - 8})`}>
        <rect x="-3" y="-80" width="6" height="80" fill="#64748b" />
        <rect x="-46" y="-112" width="92" height="36" rx="6" fill={colors.brand700} />
        <text x="0" y="-88" textAnchor="middle" fontSize="16" fontWeight="700" fill="white">
          Porto →
        </text>
      </g>
    </g>
  );
}

function Port() {
  return (
    <g>
      {/* Armazém da agência */}
      <rect x="1880" y="332" width="300" height="138" fill="#e2e8f0" />
      <polygon points="1868,334 2030,296 2192,334" fill="#64748b" />
      <rect x="1990" y="384" width="90" height="86" fill="#94a3b8" />
      {[400, 416, 432, 448].map((y) => (
        <line key={y} x1="1990" x2="2080" y1={y} y2={y} stroke="#cbd5e1" strokeWidth="2" />
      ))}
      <rect x="1900" y="346" width="150" height="26" rx="4" fill={colors.brand950} />
      <text x="1975" y="364" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" letterSpacing="1">
        ARMAZÉM PORTUS
      </text>

      {/* Contentores já no cais */}
      <g>
        <rect x="2395" y="418" width="150" height="52" fill={colors.teal} />
        <rect x="2395" y="366" width="150" height="52" fill={colors.terracotta} />
        {Array.from({ length: 11 }, (_, index) => (
          <line key={index} x1={2405 + index * 13} x2={2405 + index * 13} y1="370" y2="466" stroke="black" strokeOpacity="0.15" strokeWidth="2" />
        ))}
        <line x1="2395" x2="2545" y1="418" y2="418" stroke="black" strokeOpacity="0.2" strokeWidth="2" />
      </g>

      <rect x={SEA_START - 10} y={GROUND_Y} width="14" height="170" fill="#64748b" />
      {[2700, 2740].map((x) => (
        <rect key={x} x={x} y={GROUND_Y - 14} width="12" height="14" rx="3" fill="#334155" />
      ))}
    </g>
  );
}

function Sea({ ids }: { ids: { sea: string; seaClip: string } }) {
  return (
    <g clipPath={`url(#${ids.seaClip})`}>
      <rect x={SEA_START} y="488" width={WORLD_END - SEA_START} height="152" fill={`url(#${ids.sea})`} />
      <g className="motion-safe:animate-wave">
        <path d={wavePath(SEA_START - 160, WORLD_END + 160, 494, 4)} fill={colors.brand600} opacity="0.8" />
      </g>
      {/* Gaivotas */}
      {[
        [3400, 210],
        [3440, 190],
        [3900, 170],
      ].map(([x, y]) => (
        <path key={x} d={`M${x} ${y} q8 -8 16 0 q8 -8 16 0`} stroke="#334155" strokeWidth="2.5" fill="none" />
      ))}
    </g>
  );
}

function Islands({ progress }: { progress: Progress }) {
  const pinScale = useTransform(progress, timeline.arrivalPinScale);

  return (
    <g>
      {/* Fogo, com o vulcão, e Santiago à frente com a Praia. */}
      <path d="M4800 492 L4990 330 Q5010 318 5032 332 L5240 492 Z" fill="#7a6f8f" />
      <path d="M4990 330 Q5010 318 5032 332 L5022 346 Q5010 340 4998 346 Z" fill="#4b4260" />
      <path d="M5060 492 Q5150 420 5250 432 T5460 462 Q5510 474 5540 492 Z" fill="#4f8f6c" />
      {[5130, 5156, 5182, 5206].map((x, index) => (
        <rect key={x} x={x} y={452 - (index % 2) * 8} width="20" height={40 + (index % 2) * 8} fill={index % 2 ? "#fde68a" : "#fff7ed"} />
      ))}

      <motion.g style={{ scale: pinScale, originY: 1 }}>
        <g transform="translate(5168 440)">
          <path d="M0 0 C-14 -20 -18 -30 -18 -38 a18 18 0 0 1 36 0 c0 8 -4 18 -18 38 Z" fill={colors.star} stroke={colors.brand950} strokeWidth="2" />
          <circle cx="0" cy="-38" r="7" fill={colors.brand950} />
          <rect x="-58" y="-100" width="116" height="40" rx="10" fill={colors.brand950} />
          <text x="0" y="-84" textAnchor="middle" fontSize="12" fill="#bfd5fd">
            Chegou à Praia
          </text>
          <text x="0" y="-68" textAnchor="middle" fontSize="11" fontWeight="700" fill={colors.star}>
            Pronto para levantar
          </text>
        </g>
      </motion.g>
    </g>
  );
}

function Van({ progress }: { progress: Progress }) {
  const x = useTransform(progress, timeline.vanX);
  const wheel = useTransform(progress, timeline.wheelRotation);
  const tagOpacity = useTransform(progress, timeline.vanTagOpacity);

  return (
    <motion.g style={{ x }}>
      <g transform={`translate(0 ${GROUND_Y})`}>
        <rect x="0" y="-80" width="122" height="66" rx="6" fill="white" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M118 -64 H150 Q156 -64 160 -58 L172 -40 V-14 H118 Z" fill="white" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M124 -58 H148 L160 -40 H124 Z" fill="#93b8fb" />
        <rect x="0" y="-42" width="172" height="8" fill={colors.brand600} />
        <text x="14" y="-52" fontSize="15" fontWeight="800" fill={colors.brand800} letterSpacing="1">
          PORTUS
        </text>
        <circle cx="104" cy="-58" r="4" fill={colors.star} />
        <rect x="166" y="-30" width="8" height="6" rx="2" fill={colors.star} />
        <rect x="-4" y="-18" width="180" height="6" rx="3" fill="#334155" />
        {[32, 142].map((cx) => (
          <motion.g key={cx} style={{ rotate: wheel }}>
            <circle cx={cx} cy="-14" r="14" fill="#1e293b" />
            <circle cx={cx} cy="-14" r="6" fill="#cbd5e1" />
            <line x1={cx - 12} x2={cx + 12} y1="-14" y2="-14" stroke="#94a3b8" strokeWidth="2" />
          </motion.g>
        ))}
      </g>

      <motion.g style={{ opacity: tagOpacity }}>
        <g className="motion-safe:animate-bob">
          <rect x="18" y="340" width="136" height="34" rx="9" fill={colors.brand950} />
          <path d="M78 374 l8 8 l8 -8 Z" fill={colors.brand950} />
          <QrGlyph x={28} y={348} size={18} light />
          <text x="54" y="362" fontSize="13" fontWeight="700" fill="white" fontFamily="var(--font-geist-mono), monospace">
            PED-7KQ2M9
          </text>
        </g>
      </motion.g>
    </motion.g>
  );
}

function QrGlyph({ x, y, size, light = false }: { x: number; y: number; size: number; light?: boolean }) {
  const cell = size / 5;
  const ink = light ? "white" : "#0f172a";
  // Padrão fixo, só para sugerir um código QR.
  const cells = [0, 1, 3, 5, 7, 9, 11, 12, 13, 15, 17, 19, 20, 21, 23, 24];

  return (
    <g>
      <rect x={x} y={y} width={size} height={size} fill={light ? "transparent" : "white"} />
      {cells.map((index) => (
        <rect key={index} x={x + (index % 5) * cell} y={y + Math.floor(index / 5) * cell} width={cell} height={cell} fill={ink} />
      ))}
    </g>
  );
}

function Agent({ progress }: { progress: Progress }) {
  const x = useTransform(progress, timeline.agentX);
  const opacity = useTransform(progress, timeline.agentOpacity);
  const facing = useTransform(progress, timeline.agentFacing);
  const frontLeg = useTransform(progress, timeline.legSwing);
  const backLeg = useTransform(progress, (p) => -timeline.legSwing(p));

  return (
    <motion.g style={{ x, y: GROUND_Y, opacity }}>
      <motion.g style={{ scaleX: facing }}>
        <motion.rect x="-6" y="-30" width="6" height="30" rx="3" fill="#1e293b" style={{ rotate: backLeg, originY: 0 }} />
        <motion.rect x="1" y="-30" width="6" height="30" rx="3" fill="#334155" style={{ rotate: frontLeg, originY: 0 }} />
        <rect x="-11" y="-60" width="22" height="34" rx="7" fill={colors.brand600} />
        <rect x="-11" y="-46" width="22" height="4" fill={colors.star} />
        <rect x="6" y="-57" width="6" height="24" rx="3" fill={colors.brand700} />
        <circle cx="0" cy="-70" r="9" fill={colors.skin} />
        <path d="M-9 -72 a9 9 0 0 1 18 0 Z" fill={colors.brand900} />
        <rect x="2" y="-74" width="12" height="3" rx="1.5" fill={colors.brand900} />
      </motion.g>
    </motion.g>
  );
}

function Box({ progress }: { progress: Progress }) {
  const x = useTransform(progress, (p) => timeline.boxState(p).x - 17);
  const y = useTransform(progress, (p) => timeline.boxState(p).bottom - 28);
  const opacity = useTransform(progress, (p) => timeline.boxState(p).opacity);
  const label = useTransform(progress, timeline.qrLabelScale);

  return (
    <motion.g style={{ x, y, opacity }}>
      <rect width="34" height="28" rx="2" fill={colors.kraft} stroke="#9a6b3a" strokeWidth="1.5" />
      <rect x="15" width="4" height="28" fill="#e8c39e" />
      <motion.g style={{ scale: label }}>
        <QrGlyph x={4} y={9} size={10} />
      </motion.g>
    </motion.g>
  );
}

/** `doors`: 0 aberto, 1 fechado. */
function ContainerShape({ doors, seal }: { doors: MotionValue<number>; seal: MotionValue<number> }) {
  const openLeaf = useTransform(doors, (closed) => 1 - closed);

  return (
    <g>
      <rect width={CONTAINER.width} height={CONTAINER.height} fill={colors.brand600} />
      {Array.from({ length: 10 }, (_, index) => (
        <line key={index} x1={32 + index * 12} x2={32 + index * 12} y1="4" y2="60" stroke={colors.brand700} strokeWidth="2" />
      ))}
      <rect width={CONTAINER.width} height="4" fill={colors.brand800} />
      <rect y="60" width={CONTAINER.width} height="4" fill={colors.brand800} />
      <text x="90" y="38" textAnchor="middle" fontSize="15" fontWeight="800" fill="white" letterSpacing="2">
        PORTUS
      </text>

      {/* Topo do lado da carrinha: interior escuro, porta que fecha. */}
      <rect width="26" height={CONTAINER.height} fill="#0b1020" />
      <motion.rect width="26" height={CONTAINER.height} fill={colors.brand700} style={{ scaleX: doors, originX: 0 }} />
      <motion.polygon points="0,0 -22,-6 -22,70 0,64" fill={colors.brand700} style={{ opacity: openLeaf }} />
      <motion.g style={{ opacity: doors }}>
        <line x1="9" x2="9" y1="6" y2="58" stroke={colors.brand900} strokeWidth="2" />
        <line x1="17" x2="17" y1="6" y2="58" stroke={colors.brand900} strokeWidth="2" />
      </motion.g>

      <motion.g style={{ scale: seal }}>
        <g transform="translate(13 -12)">
          <circle r="10" fill={colors.star} stroke={colors.brand950} strokeWidth="2" />
          <path d="M-4.5 0 l3 3 l6 -6" stroke={colors.brand950} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      </motion.g>
    </g>
  );
}

function YardContainer({ progress }: { progress: Progress }) {
  const x = useTransform(progress, (p) => timeline.containerState(p).x);
  const y = useTransform(progress, (p) => timeline.containerState(p).top);
  const opacity = useTransform(progress, (p) => (timeline.containerState(p).onShip ? 0 : 1));
  const doors = useTransform(progress, timeline.containerDoors);
  const seal = useTransform(progress, timeline.sealScale);

  return (
    <motion.g style={{ x, y, opacity }}>
      <ContainerShape doors={doors} seal={seal} />
    </motion.g>
  );
}

function Crane({ progress }: { progress: Progress }) {
  const trolley = useTransform(progress, timeline.trolleyX);
  const hook = useTransform(progress, timeline.hookY);
  const spreaderX = useTransform(trolley, (x) => x - 78);
  const leftCable = useTransform(trolley, (x) => x - 10);
  const rightCable = useTransform(trolley, (x) => x + 10);
  const trolleyBodyX = useTransform(trolley, (x) => x - 20);

  return (
    <g>
      <rect x="2636" y="68" width="8" height="42" fill="#b08900" />
      <line x1="2640" y1="72" x2="2200" y2="144" stroke="#b08900" strokeWidth="3" />
      <line x1="2640" y1="72" x2="3300" y2="144" stroke="#b08900" strokeWidth="3" />
      <rect x="2190" y="142" width="1120" height="12" fill={colors.star} stroke="#b08900" strokeWidth="2" />
      <rect x="2578" y="108" width="124" height="34" rx="3" fill={colors.star} stroke="#b08900" strokeWidth="2" />
      <rect x="2600" y="154" width="38" height="26" rx="3" fill={colors.brand800} />
      <rect x="2606" y="160" width="26" height="10" fill="#93b8fb" />
      {[2556, 2716].map((x) => (
        <rect key={x} x={x} y="154" width="10" height={GROUND_Y - 154} fill={colors.star} stroke="#b08900" strokeWidth="2" />
      ))}
      <line x1="2566" y1="200" x2="2716" y2="320" stroke="#b08900" strokeWidth="4" />
      <line x1="2716" y1="200" x2="2566" y2="320" stroke="#b08900" strokeWidth="4" />
      <rect x="2550" y={GROUND_Y - 10} width="22" height="10" fill="#334155" />
      <rect x="2710" y={GROUND_Y - 10} width="22" height="10" fill="#334155" />

      <motion.line x1={leftCable} x2={leftCable} y1="164" y2={hook} stroke="#334155" strokeWidth="2" />
      <motion.line x1={rightCable} x2={rightCable} y1="164" y2={hook} stroke="#334155" strokeWidth="2" />
      <motion.rect x={trolleyBodyX} y="152" width="40" height="14" rx="2" fill="#334155" />
      <motion.rect x={spreaderX} y={hook} width="156" height="8" rx="2" fill={colors.star} stroke="#b08900" strokeWidth="1.5" />
    </g>
  );
}

function Ship({ progress }: { progress: Progress }) {
  const x = useTransform(progress, timeline.shipX);
  const cargo = useTransform(progress, (p) => (timeline.containerState(p).onShip ? 1 : 0));
  const sealed = useMotionValue(1);

  return (
    <motion.g style={{ x }}>
      <g className="motion-safe:animate-bob transform-fill origin-center">
        <rect x="40" y="340" width="26" height="34" fill="#c2410c" />
        <rect x="40" y="340" width="26" height="7" fill="#1e293b" />
        <rect x="20" y="370" width="72" height="80" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="27" y="382" width="58" height="10" rx="2" fill={colors.brand900} />
        <rect x="27" y="400" width="58" height="6" rx="2" fill="#93b8fb" />

        <rect x="100" y="418" width="150" height="32" fill={colors.teal} />
        <rect x="100" y="386" width="150" height="32" fill={colors.terracotta} />
        <line x1="100" x2="250" y1="418" y2="418" stroke="black" strokeOpacity="0.2" strokeWidth="2" />

        <motion.g style={{ opacity: cargo }}>
          <g transform={`translate(${SHIP.slotX} ${SHIP.deckY - CONTAINER.height})`}>
            <ContainerShape doors={sealed} seal={sealed} />
          </g>
        </motion.g>

        <path d={`M0 ${SHIP.deckY} H460 L430 530 H30 Z`} fill={colors.brand950} />
        <path d="M14 500 H446 L430 530 H30 Z" fill="#c2410c" />
        <rect x="0" y={SHIP.deckY} width="460" height="5" fill={colors.star} />
        <text x="250" y="484" textAnchor="middle" fontSize="15" fontWeight="700" fill="white" letterSpacing="3">
          PORTUS ATLÂNTICO
        </text>
      </g>
    </motion.g>
  );
}
