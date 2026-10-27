/* PhantomWay substrate profile: ios_safari_pwa (North Star, "Substrate Independence").
 * Core logic reads its numbers from this profile instead of hard-coding them. Shape mirrors the
 * document's ios_safari_pwa.json. c is derived: critical damping c = 2*sqrt(m*K), m = 1.
 * One static profile. No registration, no detection: seats are minted by the bridge, not here. */
(function (root) {
  'use strict';
  root.PhantomProfile = {
    id: 'ios_safari_pwa',
    version: 1,
    render: { engine: 'dom-layered-glass' },            // WebGPU refraction is Horizon 1b, feature-detected later
    mass: 1.0,
    springs: { light: { K: 55 }, medium: { K: 35 }, heavy: { K: 20 } },
    // Layered, non-repeating idle respiration: three prime-ratio sines (amp px, Hz, phase rad).
    idle: {
      amps:   [3.0, 1.2, 0.5],
      freqs:  [0.13, 0.29, 0.47],
      phasesX: [0.0, 0.4, 1.1],
      phasesY: [1.7, 2.3, 0.6]                          // offset so the path is never a straight line
    },
    // Link quality bands (ms round trip) from the Latency Thresholds table.
    link: { directMs: 35, relayMs: 80, collapseMs: 100, intervalMs: 6000, window: 5,
            suspendOnCollapse: false },                 // HTTP RTT over-reads UDP RTT: indicate, do not freeze, by default
    // Sin's Law (Oct 25): no fixed iOS switch-tick. Haptics are the Loom's synthesized sound, not this pipeline.
    haptics: { pipeline: 'none' },
    room: { enabled: false },
    reach: 14                                           // px the orb may lean toward a pointer
  };
})(typeof window !== 'undefined' ? window : globalThis);
