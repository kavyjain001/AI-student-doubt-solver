import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Sliders, Eye, HelpCircle } from 'lucide-react';
import { SubjectId, SimplicityLevel } from '../types';

interface InteractiveSandboxesProps {
  onAskAboutSimulation: (doubt: string, subject: SubjectId, level: SimplicityLevel) => void;
}

type SimulationType = 'gravity' | 'refraction' | 'doppler' | 'chemistry';

export const InteractiveSandboxes: React.FC<InteractiveSandboxesProps> = ({ onAskAboutSimulation }) => {
  const [activeSim, setActiveSim] = useState<SimulationType>('gravity');

  // --- Gravity Sim State ---
  const [gravity, setGravity] = useState<number>(9.8); // m/s^2
  const [airResistance, setAirResistance] = useState<boolean>(false);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [heavyY, setHeavyY] = useState<number>(0); // 0% to 100%
  const [lightY, setLightY] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // --- Refraction Sim State ---
  const [incidentAngle, setIncidentAngle] = useState<number>(45); // degrees
  const [refractiveIndex, setRefractiveIndex] = useState<number>(1.5); // glass

  // --- Doppler Sim State ---
  const [sourceSpeed, setSourceSpeed] = useState<number>(0.5); // Mach fraction
  const [dopplerPlaying, setDopplerPlaying] = useState<boolean>(true);
  const [waves, setWaves] = useState<{ id: number; x: number; radius: number }[]>([]);

  // Gravity animation loop
  useEffect(() => {
    if (!isDropping) return;

    let startTime = performance.now();
    const dropHeightMeters = 50;

    const animate = (currentTime: number) => {
      const dt = (currentTime - startTime) / 1000; // seconds
      setTimeElapsed(dt);

      // Free fall formula: y = 0.5 * g * t^2
      // With air resistance: terminal velocity limit for feather
      const g = gravity;
      let yHeavy = 0.5 * g * dt * dt;
      let yLight = yHeavy;

      if (airResistance) {
        // Drag slows the feather
        const terminalV = 8; // m/s
        yLight = terminalV * dt * (1 - Math.exp(-g * dt / terminalV));
      }

      const pctHeavy = Math.min(100, (yHeavy / dropHeightMeters) * 100);
      const pctLight = Math.min(100, (yLight / dropHeightMeters) * 100);

      setHeavyY(pctHeavy);
      setLightY(pctLight);

      if (pctHeavy < 100 || (airResistance && pctLight < 100)) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsDropping(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDropping, gravity, airResistance]);

  const resetGravity = () => {
    setIsDropping(false);
    setHeavyY(0);
    setLightY(0);
    setTimeElapsed(0);
  };

  const startGravityDrop = () => {
    resetGravity();
    setTimeout(() => setIsDropping(true), 50);
  };

  // Doppler animation loop
  useEffect(() => {
    if (activeSim !== 'doppler' || !dopplerPlaying) return;

    let sourceX = 150;
    let waveCounter = 0;
    let interval = setInterval(() => {
      sourceX += sourceSpeed * 4;
      if (sourceX > 450) sourceX = 50;

      setWaves((prev) => {
        const expanded = prev
          .map((w) => ({ ...w, radius: w.radius + 3 }))
          .filter((w) => w.radius < 200);

        waveCounter++;
        if (waveCounter % 6 === 0) {
          expanded.push({ id: Date.now(), x: sourceX, radius: 2 });
        }
        return expanded;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeSim, dopplerPlaying, sourceSpeed]);

  // Calculate Refraction Angle (Snell's Law: 1.0 * sin(th1) = n * sin(th2))
  const theta1Rad = (incidentAngle * Math.PI) / 180;
  const sinTheta2 = Math.sin(theta1Rad) / refractiveIndex;
  const theta2Deg = Math.asin(Math.min(1, Math.max(-1, sinTheta2))) * (180 / Math.PI);

  return (
    <div className="space-y-6">
      {/* Sandbox Header & Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
              Interactive Concept Sandboxes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Interact directly with visual physics, optics, and sound simulations to see the math in motion.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveSim('gravity')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeSim === 'gravity' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Free Fall & Gravity
            </button>
            <button
              onClick={() => setActiveSim('refraction')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeSim === 'refraction' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Snell&apos;s Law Refraction
            </button>
            <button
              onClick={() => setActiveSim('doppler')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeSim === 'doppler' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doppler Effect
            </button>
          </div>
        </div>
      </div>

      {/* SIMULATION 1: GRAVITY & FREE FALL */}
      {activeSim === 'gravity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
          {/* Stage Zone (Canvas) */}
          <div className="lg:col-span-8 bg-slate-950 rounded-xl p-6 relative min-h-[380px] flex flex-col justify-between overflow-hidden shadow-inner border border-slate-800">
            {/* Height meter line */}
            <div className="absolute left-6 top-6 bottom-12 w-0.5 bg-slate-800 flex flex-col justify-between text-[10px] text-slate-500 font-mono">
              <span>50m (Release)</span>
              <span>25m</span>
              <span>0m (Ground)</span>
            </div>

            {/* Dropping Track */}
            <div className="relative flex-1 mx-16 my-4 border-l border-r border-slate-800 flex justify-around items-end">
              {/* Heavy Cannonball */}
              <div
                className="absolute w-12 flex flex-col items-center transition-none"
                style={{
                  top: `${Math.min(88, (heavyY / 100) * 88)}%`,
                  left: '25%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-400 to-slate-700 shadow-lg border border-slate-400/30 flex items-center justify-center text-[10px] font-bold text-white">
                  10 kg
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">Cannonball</span>
              </div>

              {/* Light Feather */}
              <div
                className="absolute w-12 flex flex-col items-center transition-none"
                style={{
                  top: `${Math.min(88, (lightY / 100) * 88)}%`,
                  left: '75%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-200 to-amber-500 shadow-lg border border-amber-300/30 flex items-center justify-center text-[10px] font-bold text-amber-950">
                  0.01 kg
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">Feather</span>
              </div>

              {/* Ground level indicator */}
              <div className="w-full h-1.5 bg-slate-700 absolute bottom-0 rounded-full" />
            </div>

            {/* Live readout telemetry */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="tabular-nums">Time Elapsed: {timeElapsed.toFixed(2)}s</span>
              <span className="tabular-nums">
                Environment: {airResistance ? 'Atmosphere with Drag' : 'Vacuum Chamber (Zero Drag)'}
              </span>
            </div>
          </div>

          {/* Control Deck */}
          <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Gravity Controls
              </h3>

              {/* Drop / Reset Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={startGravityDrop}
                  disabled={isDropping}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Release Objects</span>
                </button>
                <button
                  onClick={resetGravity}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                  title="Reset positions"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Gravity Environment Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Celestial Gravity: <span className="text-indigo-600 tabular-nums">{gravity} m/s²</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Earth', g: 9.8 },
                    { name: 'Moon', g: 1.6 },
                    { name: 'Mars', g: 3.7 },
                    { name: 'Jupiter', g: 24.8 },
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setGravity(p.g);
                        resetGravity();
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${
                        gravity === p.g
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.name} ({p.g})
                    </button>
                  ))}
                </div>
              </div>

              {/* Air Resistance Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Air Resistance:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAirResistance(false);
                      resetGravity();
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
                      !airResistance
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Vacuum (Galileo)
                  </button>
                  <button
                    onClick={() => {
                      setAirResistance(true);
                      resetGravity();
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
                      airResistance
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Air Drag (Real World)
                  </button>
                </div>
              </div>
            </div>

            {/* Clarity Prompt CTA */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() =>
                  onAskAboutSimulation(
                    'Why do heavy and light objects fall at the exact same rate in a vacuum, but differently in air?',
                    'physics',
                    'highschool'
                  )
                }
                className="w-full p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Explain the physics to me</span>
                </span>
                <span className="text-[11px] text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Ask Clarity →
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATION 2: SNELL'S LAW REFRACTION */}
      {activeSim === 'refraction' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
          {/* Interactive Ray Trace SVG Canvas */}
          <div className="lg:col-span-8 bg-slate-950 rounded-xl p-4 min-h-[380px] flex items-center justify-center relative overflow-hidden border border-slate-800">
            <svg viewBox="0 0 500 350" className="w-full h-full max-h-[340px]">
              {/* Medium 1 (Air) */}
              <rect x="0" y="0" width="500" height="175" fill="#0f172a" />
              <text x="20" y="30" fill="#94a3b8" fontSize="12" fontFamily="monospace">
                Medium 1: Air (n₁ = 1.00)
              </text>

              {/* Medium 2 (Denser Material) */}
              <rect x="0" y="175" width="500" height="175" fill="#1e293b" opacity="0.9" />
              <text x="20" y="205" fill="#38bdf8" fontSize="12" fontFamily="monospace">
                Medium 2: Denser Material (n₂ = {refractiveIndex.toFixed(2)})
              </text>

              {/* Boundary Line */}
              <line x1="0" y1="175" x2="500" y2="175" stroke="#475569" strokeWidth="2" />

              {/* Normal Line (Perpendicular) */}
              <line x1="250" y1="20" x2="250" y2="330" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="255" y="40" fill="#64748b" fontSize="10" fontFamily="monospace">
                Normal Line (90°)
              </text>

              {/* Incident Ray in Air */}
              {(() => {
                const len = 180;
                const rad = (incidentAngle * Math.PI) / 180;
                const startX = 250 - len * Math.sin(rad);
                const startY = 175 - len * Math.cos(rad);
                return (
                  <>
                    <line x1={startX} y1={startY} x2="250" y2="175" stroke="#f59e0b" strokeWidth="3" />
                    <circle cx={startX} cy={startY} r="4" fill="#f59e0b" />
                    {/* Angle arc 1 */}
                    <path
                      d={`M 250 145 A 30 30 0 0 0 ${250 - 30 * Math.sin(rad)} ${175 - 30 * Math.cos(rad)}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <text x="200" y="140" fill="#f59e0b" fontSize="11" fontFamily="monospace">
                      θ₁ = {incidentAngle}°
                    </text>
                  </>
                );
              })()}

              {/* Refracted Ray in Medium 2 */}
              {(() => {
                const len = 180;
                const rad2 = (theta2Deg * Math.PI) / 180;
                const endX = 250 + len * Math.sin(rad2);
                const endY = 175 + len * Math.cos(rad2);
                return (
                  <>
                    <line x1="250" y1="175" x2={endX} y2={endY} stroke="#38bdf8" strokeWidth="3" />
                    <circle cx={endX} cy={endY} r="4" fill="#38bdf8" />
                    {/* Angle arc 2 */}
                    <path
                      d={`M 250 205 A 30 30 0 0 0 ${250 + 30 * Math.sin(rad2)} ${175 + 30 * Math.cos(rad2)}`}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <text x="270" y="220" fill="#38bdf8" fontSize="11" fontFamily="monospace">
                      θ₂ = {theta2Deg.toFixed(1)}°
                    </text>
                  </>
                );
              })()}

              {/* Center point */}
              <circle cx="250" cy="175" r="5" fill="#ffffff" />
            </svg>
          </div>

          {/* Control Deck */}
          <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Refraction Parameters
              </h3>

              {/* Incident Angle Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Incident Angle (θ₁):</span>
                  <span className="text-amber-600 font-mono tabular-nums">{incidentAngle}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="85"
                  value={incidentAngle}
                  onChange={(e) => setIncidentAngle(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Material Preset (n2) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Medium 2 Index (n₂):</span>
                  <span className="text-sky-600 font-mono tabular-nums">{refractiveIndex.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Water', n: 1.33 },
                    { name: 'Glass', n: 1.52 },
                    { name: 'Sapphire', n: 1.77 },
                    { name: 'Diamond', n: 2.42 },
                  ].map((mat) => (
                    <button
                      key={mat.name}
                      onClick={() => setRefractiveIndex(mat.n)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${
                        refractiveIndex === mat.n
                          ? 'border-sky-600 bg-sky-50 text-sky-950 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mat.name} ({mat.n})
                    </button>
                  ))}
                </div>
              </div>

              {/* Snell's Law Math Callout */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Snell&apos;s Law Formula:</p>
                <p>n₁ · sin(θ₁) = n₂ · sin(θ₂)</p>
                <p className="text-emerald-700 font-semibold">
                  1.00 · sin({incidentAngle}°) = {refractiveIndex.toFixed(2)} · sin({theta2Deg.toFixed(1)}°)
                </p>
              </div>
            </div>

            {/* Clarity Prompt CTA */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() =>
                  onAskAboutSimulation(
                    'Why does light bend when moving from air into glass or water (Snell’s Law)?',
                    'physics',
                    'highschool'
                  )
                }
                className="w-full p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Explain light bending simply</span>
                </span>
                <span className="text-[11px] text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Ask Clarity →
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATION 3: DOPPLER EFFECT */}
      {activeSim === 'doppler' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
          {/* Canvas with expanding sound rings */}
          <div className="lg:col-span-8 bg-slate-950 rounded-xl p-4 min-h-[380px] flex items-center justify-center relative overflow-hidden border border-slate-800">
            <svg viewBox="0 0 500 350" className="w-full h-full max-h-[340px]">
              {/* Observer Left (Lower pitch) */}
              <circle cx="40" cy="175" r="10" fill="#3b82f6" />
              <text x="15" y="210" fill="#93c5fd" fontSize="11" fontFamily="monospace">
                Observer A (Receding / Lower Pitch)
              </text>

              {/* Observer Right (Higher pitch) */}
              <circle cx="460" cy="175" r="10" fill="#ef4444" />
              <text x="320" y="210" fill="#fca5a5" fontSize="11" fontFamily="monospace">
                Observer B (Approaching / Higher Pitch)
              </text>

              {/* Wavefronts */}
              {waves.map((w) => (
                <circle
                  key={w.id}
                  cx={w.x}
                  cy="175"
                  r={w.radius}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity={Math.max(0.1, 1 - w.radius / 200)}
                />
              ))}

              {/* Motion arrow */}
              <line x1="200" y1="80" x2="300" y2="80" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="210" y="70" fill="#f59e0b" fontSize="11" fontFamily="monospace">
                Source Velocity →
              </text>
            </svg>
          </div>

          {/* Control Deck */}
          <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Doppler Controls
              </h3>

              {/* Play / Pause */}
              <button
                onClick={() => setDopplerPlaying(!dopplerPlaying)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {dopplerPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{dopplerPlaying ? 'Pause Wave Emission' : 'Resume Waves'}</span>
              </button>

              {/* Source Speed Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Source Speed (Mach):</span>
                  <span className="text-indigo-600 font-mono tabular-nums">{sourceSpeed.toFixed(1)} Mach</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.1"
                  step="0.1"
                  value={sourceSpeed}
                  onChange={(e) => setSourceSpeed(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0.1 (Slow siren)</span>
                  <span>1.0 (Sonic Boom)</span>
                </div>
              </div>

              {/* Intuitive Note */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                Notice how the wave circles bunch up closely in front of the moving object (shorter wavelength = higher frequency/pitch) and stretch out behind it!
              </p>
            </div>

            {/* Clarity Prompt CTA */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() =>
                  onAskAboutSimulation(
                    'Explain the Doppler effect: why does an ambulance siren change pitch as it drives past?',
                    'physics',
                    'highschool'
                  )
                }
                className="w-full p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Explain Doppler effect simply</span>
                </span>
                <span className="text-[11px] text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Ask Clarity →
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
