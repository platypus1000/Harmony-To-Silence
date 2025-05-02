// Boombox.tsx (Restored ORIGINAL Internal Positions, Keep Stop Animation Fix)
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  DragEvent,
} from 'react';

/* ---------- helper types ---------- */
interface Track { src: string; title: string; }
// Restore NowPlayingProps interface - no globalShift needed
interface NowPlayingProps { tracks: Track[]; current: number; visible: boolean; }

// --- Define Shift Constants ---
const RESPONSIVE_SHIFT = 5; // Shift applied only on smaller screens

/* ---------- NowPlaying Panel (Restored Original Responsive Position) ---------- */
// Remove globalShift prop and associated logic
const NowPlaying: React.FC<NowPlayingProps> = ({ tracks, current, visible }) => {
    // This uses the original positioning from the first version of the code provided
    return (
        <div
          className={`
            absolute top-[3%] right-[-15%] /* Original large screen position */
            /* Mobile position adjusted slightly for responsiveness if needed, otherwise keep original */
            /* Example: right-[0%] md:right-[-15%] was a previous attempt */
            /* Let's try the original absolute position and see how it looks with parent transform */
            w-[280px] /* Original width */
            max-w-[50%] /* Original max-width */
            bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-3 /* Original padding */
            text-white text-xs
            transition-opacity duration-500 /* Keep opacity transition */
            ${visible ? 'opacity-100' : 'opacity-0'}
            pointer-events-none
          `}
          style={{ zIndex: 40 }}
        >
          <h3 className="text-sm font-semibold mb-1 text-center border-b border-gray-600 pb-1">Now Playing</h3>
          <ul className="max-h-70 overflow-y-auto space-y-1"> {/* Height correct */}
            {tracks.map((t, i) => ( <li key={i} className={`p-1 rounded truncate ${i === current ? 'bg-blue-700 font-bold' : 'text-gray-300'}`} title={t.title} > {t.title} </li> ))}
          </ul>
        </div>
    );
};


// --- Internal Constants ---
const INITIAL_CD_DROP_TYPE = 'application/react-component';
const INITIAL_CD_DROP_DATA = 'cd';
const RETURNING_CD_TYPE = 'application/cd-returning';

interface Props {
  isCdDropped: boolean;
  boomboxImageUrl: string; // Prop name for the image URL
  cdImageUrl: string;
  onCdInserted: () => void;
  onReturnDragStartCallback: () => void;
  onReturnDragEndCallback: () => void;
  showDropZoneHighlight: boolean;
}

const Boombox: React.FC<Props> = ({
  isCdDropped,
  boomboxImageUrl, // Receive the prop
  cdImageUrl,
  onCdInserted,
  onReturnDragStartCallback,
  onReturnDragEndCallback,
  showDropZoneHighlight,
}) => {
  // --- State and Refs (Unchanged) ---
  const [draggingOut, setDraggingOut] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [overZone, setOverZone] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevIsCdDroppedRef = useRef<boolean>(isCdDropped);

  // --- Tracks (Unchanged) ---
  const tracks: Track[] = [ /* ... track list ... */
        { src: '/audio/track1.mp3', title: 'Strange Fruit — Billie Holiday' },
        { src: '/audio/track2.mp3', title: 'Blowin’ in the Wind — Bob Dylan' },
        { src: '/audio/track3.mp3', title: 'We Shall Overcome — Joan Baez' },
        { src: '/audio/track4.mp3', title: 'The Times They Are A-Changinʼ' },
        { src: '/audio/track5.mp3', title: 'Mississippi Goddam — Nina Simone' },
        { src: '/audio/track6.mp3', title: 'The Unknown Soldier — The Doors' },
        { src: '/audio/track7.mp3', title: 'Equal Rights — Peter Tosh' },
        { src: '/audio/track8.mp3', title: 'London Calling — The Clash' },
        { src: '/audio/track9.mp3', title: 'Sunday Bloody Sunday — U2' },
        { src: '/audio/track10.mp3', title: 'Nelson Mandela — The Specials' },
        { src: '/audio/track11.mp3', title: 'Zombie — The Cranberries' },
        { src: '/audio/track12.mp3', title: 'Paper Planes — M.I.A.' },
        { src: '/audio/track13.mp3', title: 'This Is America — Childish Gambino' },
        { src: '/audio/track14.mp3', title: 'I Can’t Breathe — H.E.R.' },
    ];

  // --- Audio Controls (Restored working logic + Stop Animation Fix) ---
  const play = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isCdDropped) {
      if (!isPlaying) { audio.play().then(() => { setIsPlaying(true); setScrolling(true); }).catch(err => { console.error("Audio play failed:", err); setIsPlaying(false); setSpinSpeed(0); setScrolling(false); }); }
      else { audio.pause(); setIsPlaying(false); setScrolling(false); }
    }
  }, [isCdDropped, isPlaying]);

  const stop = useCallback(() => { // Keep the corrected stop logic
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (audio.readyState >= 1) { try { audio.currentTime = 0; } catch(e) { console.error("Error setting currentTime to 0:", e); } }
    }
    setIsPlaying(false); // Let useEffect handle spin down
    setScrolling(false);
  }, []);

  const changeTrack = useCallback((dir: 1 | -1) => {
    if (!isCdDropped || tracks.length === 0) return;
    const next = (trackIndex + dir + tracks.length) % tracks.length;
    setTrackIndex(next);
    const audio = audioRef.current;
    if (audio) {
      const wasPlaying = isPlaying;
      audio.pause(); audio.src = tracks[next].src; audio.load();
      if (wasPlaying) { setIsPlaying(true); setScrolling(true); audio.play().catch(err => { console.error("Error auto-playing next track:", err); setIsPlaying(false); setScrolling(false); setSpinSpeed(0); }); }
      else { setIsPlaying(false); setScrolling(false); setSpinSpeed(0); setRotation(0); if (audio.readyState >= 1) audio.currentTime = 0; }
    }
  }, [isCdDropped, trackIndex, tracks, isPlaying]);


  // --- Audio Event Handlers ---
  const onEnded = useCallback(() => { if (isPlaying) { changeTrack(1); } else { stop(); } }, [isPlaying, changeTrack, stop]);

  // --- Effects ---
  // Spin Animation (Keep this for gradual slowdown)
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      let newSpeed = spinSpeed;
      if (isPlaying && spinSpeed < 3) newSpeed = Math.min(spinSpeed + 0.2, 3);
      else if (!isPlaying && spinSpeed > 0) newSpeed = Math.max(spinSpeed - 0.1, 0);
      if (newSpeed !== spinSpeed) setSpinSpeed(newSpeed);
      if (newSpeed > 0) { setRotation(prev => (prev + newSpeed) % 360); frameId = requestAnimationFrame(animate); }
      else if (!isPlaying) { setRotation(0); }
    };
    if (isPlaying || spinSpeed > 0) { frameId = requestAnimationFrame(animate); }
    return () => cancelAnimationFrame(frameId);
   }, [isPlaying, spinSpeed]);

  // CD Insert/Eject Logic
  useEffect(() => {
    const audio = audioRef.current;
    const justInserted = isCdDropped && !prevIsCdDroppedRef.current;
    const justEjected = !isCdDropped && prevIsCdDroppedRef.current;
    if (justInserted && audio && tracks.length > 0) { stop(); setTrackIndex(0); audio.src = tracks[0].src; audio.load(); setDraggingOut(false); }
    else if (justEjected && audio) { stop(); }
    prevIsCdDroppedRef.current = isCdDropped;
  }, [isCdDropped, tracks, stop]);

  // --- Drag Handlers ---
  const dragStart = (e: DragEvent<HTMLImageElement>) => { setDraggingOut(true); e.dataTransfer.setData(RETURNING_CD_TYPE, 'true'); e.dataTransfer.effectAllowed = "move"; onReturnDragStartCallback(); };
  const dragEnd = () => { setDraggingOut(false); onReturnDragEndCallback(); };

  // --- Styling Constants ---
  const outline = 'border-4 border-dashed border-white/60 rounded-full transition-all duration-150';
  const btnClass = `absolute flex items-center justify-center rounded-full text-black p-1 md:p-2 z-20 transition-all duration-150 ease-in-out hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_3px_rgba(255,0,0,0.8)] md:hover:shadow-[0_0_20px_5px_rgba(255,0,0,0.9)]`;
  const outlinedBtn = 'border border-black';

  // --- Positioning Classes (Restored to ORIGINAL Hardcoded + Responsive Shift) ---
  // Using the exact percentages from the first code block you provided
  const cdDropZonePos = `top-[20%] left-[${29.2 - RESPONSIVE_SHIFT}%] md:left-[29.2%] w-[34.4%] aspect-square`;
  const cdImagePos = `top-[17%] left-[${27.6 - RESPONSIVE_SHIFT}%] md:left-[27.6%] w-[37.4%]`;
  const ledPos = `top-[23.2%] left-[${62.9 - RESPONSIVE_SHIFT}%] md:left-[62.9%] w-[${6.4 + (RESPONSIVE_SHIFT/2)}%] md:w-[6.4%] h-[5.8%]`; // Adjusted mobile LED width slightly
  const prevBtnPos = `top-[46.6%] left-[${66.7 - RESPONSIVE_SHIFT}%] md:left-[66.7%] w-[${2.0 + 0.5}%] md:w-[2.0%] h-[${3.2 + 0.8}%] md:h-[3.2%]`; // Adjusted mobile button size
  const playBtnPos = `top-[54.4%] left-[${67.35 - RESPONSIVE_SHIFT}%] md:left-[67.35%] w-[${4.8 + 1.2}%] md:w-[4.8%] h-[${7.0 + 1.0}%] md:h-[7.0%]`; // Adjusted mobile button size
  const stopBtnPos = `top-[71.6%] left-[${59.8 - RESPONSIVE_SHIFT}%] md:left-[59.8%] w-[${3.9 + 0.6}%] md:w-[3.9%] h-[${6.2 + 0.8}%] md:h-[6.2%]`; // Adjusted mobile button size
  const nextBtnPos = `top-[46.6%] left-[${71.2 - RESPONSIVE_SHIFT}%] md:left-[71.2%] w-[${2.0 + 0.5}%] md:w-[2.0%] h-[${3.2 + 0.8}%] md:h-[3.2%]`; // Adjusted mobile button size

  // --- Calculate Stop Button Disabled State ---
  const isStopDisabled = !isPlaying && audioRef.current?.currentTime === 0;


  /* Render ... */
  return (
    <div className="relative w-full max-w-full mx-auto aspect-[800/500]">
      {/* Background Image - Use the prop */}
      <img src={boomboxImageUrl} alt="CD Player" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" />

      {/* Apply ORIGINAL position variables */}
      {/* CD Drop Zone */}
      {!isCdDropped && ( <div className={`absolute ${cdDropZonePos} ${showDropZoneHighlight || overZone ? outline : ''}`} style={{ zIndex: 10 }} onDragEnter={() => setOverZone(true)} onDragOver={(e) => { if (e.dataTransfer.types.includes(INITIAL_CD_DROP_TYPE)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (!overZone) setOverZone(true); } else { e.dataTransfer.dropEffect = 'none'; if (overZone) setOverZone(false); } }} onDragLeave={() => setOverZone(false)} onDrop={(e) => { e.preventDefault(); setOverZone(false); const d = e.dataTransfer.getData(INITIAL_CD_DROP_TYPE); if (d === INITIAL_CD_DROP_DATA) { onCdInserted(); } }} ></div> )}
      {/* Internal CD Image */}
      {isCdDropped && ( <img src={cdImageUrl} alt="CD in player" draggable onDragStart={dragStart} onDragEnd={dragEnd} className={`absolute ${cdImagePos} transition-opacity duration-100 ease-out`} style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center', cursor: draggingOut ? 'grabbing' : 'grab', opacity: draggingOut ? 0.3 : 1, zIndex: 15, }} /> )}
      {/* LED Display */}
      {isCdDropped && ( <div className={`absolute overflow-hidden whitespace-nowrap text-[#a4ffa4] text-[1.1rem] leading-tight font-mono rounded-[4px] px-1.5 py-0.5 flex items-center bg-[#464938] ${ledPos}`} style={{ zIndex: 5 }} > <div style={{ animation: 'marquee 15s linear infinite', animationPlayState: scrolling ? 'running' : 'paused' }}> {tracks[trackIndex]?.title ?? '---'} </div> </div> )}

      {/* Buttons - Render condition checked */}
      {isCdDropped && !draggingOut && (
        <>
          <button title="Previous Track" onClick={() => changeTrack(-1)} disabled={tracks.length <= 1} className={`${btnClass} ${outlinedBtn} bg-[#a49f99] ${prevBtnPos}`} />
          <button title={isPlaying ? "Pause" : "Play"} onClick={play} className={`${btnClass} bg-[#a6a19b] ${playBtnPos}`}> <svg viewBox="0 0 100 100" className="w-[16px] h-[16px] md:w-[22px] md:h-[22px] fill-black">{isPlaying ? <path d="M20,20 L40,20 L40,80 L20,80 Z M60,20 L80,20 L80,80 L60,80 Z" /> : <polygon points="30,20 80,50 30,80" />}</svg> </button>
          {/* Use calculated disabled state */}
          <button title="Stop" onClick={stop} disabled={isStopDisabled} className={`${btnClass} bg-[#a6a19b] ${stopBtnPos}`}> <div className="bg-black w-2 h-2 md:w-3 md:h-3" /> </button>
          <button title="Next Track" onClick={() => changeTrack(1)} disabled={tracks.length <= 1} className={`${btnClass} ${outlinedBtn} bg-[#a49f99] ${nextBtnPos}`} />
        </>
      )}

      {/* NowPlaying Panel Component - Restored */}
      <NowPlaying tracks={tracks} current={trackIndex} visible={isCdDropped && !draggingOut} />

      {/* Audio Element */}
      <audio ref={audioRef} onEnded={onEnded} preload="auto" />
      {/* Keyframes for LED */}
      <style>{` @keyframes marquee { 0% { transform: translateX(80%); } 100% { transform: translateX(-130%); } } `}</style>
    </div>
  );
};
export default Boombox;
