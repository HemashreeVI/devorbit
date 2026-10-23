import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Shared, mutable values the R3F scene reads every frame (no React re-renders). */
export const orbitState = { x: 1.6, y: 0, z: 0, scale: 1, spin: 0, warp: 0, mouseX: 0, mouseY: 0 };

export { gsap, ScrollTrigger, useGSAP };
