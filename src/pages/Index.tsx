// Index.tsx (Revert initial pos, adjust text margin, slower fade, refine case dragOver)
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Boombox from '@/components/Boombox'; // Assuming path is correct
import DraggableCD from '@/components/DraggableCD'; // Assuming path is correct & has conditional logic

/* enums */
type View = 'closed' | 'crossFading' | 'enlargedPaused' | 'animating' | 'ready' | 'playing';
type DragItem = null | 'initial-cd' | 'returning-cd';

// Define data types CONSTANTS matching components
const RETURNING_CD_TYPE = 'application/cd-returning';
const INITIAL_CD_DROP_TYPE = 'application/react-component';
const INITIAL_CD_DROP_DATA = 'cd';

// --- Configuration Constants for Initial Appearance ---
// >> HOW TO CHANGE INITIAL SIZE <<
// Increase this value for a LARGER starting size (e.g., 200, 225, 250)
// Set to 100 to start at final size (no shrink)
const INITIAL_SCALE_PERCENT = 180; // Reverted to 180

// >> HOW TO CHANGE INITIAL POSITION (relative to final) <<
// More negative value = starts further LEFT (e.g., -40, -50)
// Less negative or positive value = starts further RIGHT (e.g., -10, 0, 10)
const INITIAL_TRANSLATE_X_PERCENT = -45; // Reverted to -45
// Add vertical translation constant
const INITIAL_TRANSLATE_Y_PERCENT = 5; // Reverted to 5
// --- End Configuration Constants ---

export default function Index() {
  /* state */
  const [view, setView] = useState<View>('closed');
  const [cdVisible, setCdVisible] = useState(true);
  const [cdInPlayer, setCdInPlayer] = useState(false);
  const [drag, setDrag] = useState<DragItem>(null);

  /* timings */
  const crossFadeDuration = 400; // Keep increased duration
  const pauseDuration = 500;
  const slideShrinkDuration = 700;

  /* images */
  const imgClosed = 'https://i.imgur.com/6sIQ9v2.png';
  const imgOpen = 'https://i.imgur.com/cr2BwhZ.png';
  const imgBoom = 'https://i.imgur.com/86ydD4c.png'; // Image URL for the boombox/cd player
  const imgCd = 'https://i.imgur.com/1tCsz6z.png';

  /* animation chain - Simplified */
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    let t3: ReturnType<typeof setTimeout> | undefined;

    if (view === 'crossFading') {
      t1 = setTimeout(() => { setView('enlargedPaused'); }, crossFadeDuration);
    } else if (view === 'enlargedPaused') {
      t2 = setTimeout(() => { setView('animating'); }, pauseDuration);
    } else if (view === 'animating') {
      t3 = setTimeout(() => { setView(cdInPlayer ? 'playing' : 'ready'); }, slideShrinkDuration);
    }

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [view, cdInPlayer, crossFadeDuration, pauseDuration, slideShrinkDuration]);

  /* drag handlers */
  const dragInitStart = () => { setDrag('initial-cd'); };
  const dragReturnStart = () => { setDrag('returning-cd'); };
  const dragEnd = () => { setDrag(null); }; // Clear drag state on drag end

  /* insertion / return logic */
  const insertCd = () => {
    if (!cdInPlayer) {
      setCdVisible(false);
      setCdInPlayer(true);
      setView('playing');
      setDrag(null);
    }
  };
  const returnCd = () => {
    if (cdInPlayer) {
      setCdInPlayer(false);
      setCdVisible(true);
      setView('ready');
      setDrag(null);
    } else {
      if (!cdVisible) setCdVisible(true);
      if (view !== 'ready') setView('ready');
    }
  };

  // --- Base size for the case placeholder - CRITICAL FOR LAYOUT ---
  const caseBaseSize = 'w-[28rem] h-[28rem] md:w-[32rem] md:h-[32rem]';

  // --- Classes for the OPEN case container - Simplified Animation Logic ---
  const openCaseClasses = (): string => {
    // Use updated constant for initial scale and translation
    const initialScaleClass = `scale-[${(INITIAL_SCALE_PERCENT / 100).toFixed(2)}]`; // e.g., scale-[1.80]
    const initialTranslateXClass = `translate-x-[${INITIAL_TRANSLATE_X_PERCENT}%]`; // e.g., translate-x-[-45%]
    const initialTranslateYClass = `translate-y-[${INITIAL_TRANSLATE_Y_PERCENT}%]`; // e.g., translate-y-[5%]

    const targetScaleClass = 'scale-100';
    const targetTranslateXClass = 'translate-x-0';
    const targetTranslateYClass = 'translate-y-0'; // Target is no vertical shift

    const transitions = `transition-opacity duration-[${crossFadeDuration}ms] ease-in-out, transition-transform duration-[${slideShrinkDuration}ms] ease-in-out`;
    let scale = initialScaleClass, translateX = initialTranslateXClass, translateY = initialTranslateYClass, opacity = 'opacity-0', currentTransitions = '';

    switch(view) {
        case 'crossFading':
            opacity = 'opacity-100';
            currentTransitions = `transition-opacity duration-[${crossFadeDuration}ms] ease-in-out`;
            break;
        case 'enlargedPaused':
             opacity = 'opacity-100';
             currentTransitions = transitions; // Apply full transitions ready for next step
            break;
        case 'animating':
            opacity = 'opacity-100';
            scale = targetScaleClass;
            translateX = targetTranslateXClass;
            translateY = targetTranslateYClass; // Animate to target Y
            currentTransitions = transitions; // Keep transitions active
            break;
        case 'ready': case 'playing':
            opacity = 'opacity-100'; // Ensure visible
            scale = targetScaleClass;     // Ensure correct size/pos
            translateX = targetTranslateXClass;
            translateY = targetTranslateYClass; // Ensure target Y
            currentTransitions = ''; // Remove transitions
            break;
        default: return 'absolute inset-0 pointer-events-none scale-125 opacity-0'; // Fallback
    }
    // Apply positioning, transitions, stateful styles
    return `absolute inset-0 ${currentTransitions} ${opacity} ${scale} ${translateX} ${translateY}`; // Include translateY
  };

   // --- Classes for the CLOSED case image (Unchanged) ---
   const closedCaseClasses = (): string => {
    let opacity = 'opacity-100';
    let transitions = `transition-opacity duration-[${crossFadeDuration}ms] ease-in-out`;
    if (view !== 'closed') { opacity = 'opacity-0 pointer-events-none'; }
    return `absolute inset-0 w-full h-full object-contain ${opacity} ${transitions} ${view === 'closed' ? 'cursor-pointer hover:scale-105' : ''}`;
  };

  // --- Classes for the Boombox/CD Player - Use translateX for shift ---
  const boomCls = (): string => {
      const shouldRender = ['animating', 'ready', 'playing'].includes(view);
      const isVisible = ['animating', 'ready', 'playing'].includes(view);

      if (!shouldRender) return "hidden"; // Don't render initially

      const base = 'relative w-full max-w-2xl lg:max-w-3xl flex-shrink-0';
      const transition = `transition-opacity duration-[${slideShrinkDuration}ms] ease-in-out`;
      const visibility = isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

      // >> HOW TO CHANGE LEFT SHIFT <<
      // Increase the negative number for MORE left shift (e.g., -40, -48, -64)
      // Decrease the negative number for LESS left shift (e.g., -24, -16)
      // Use percentages for relative shift: -translate-x-[10%], -translate-x-[15%]
      // Remember the `md:` prefix means it only applies on screens >= 768px wide by default.
      // Remove `md:` to apply the shift on ALL screen sizes.
      const shiftTransform = 'md:-translate-x-48'; // Example: shift left by 12rem (192px) on md+

      // Combine base, transition, visibility, and the transform shift
      return `${base} ${transition} ${visibility} ${shiftTransform}`;
  };

  /* outlines when dragging */
  const showCaseOutline = drag === 'returning-cd';
  const showBoomOutline = drag === 'initial-cd';

  // --- Draggable CD Container Position/Size ---
  // *** YOU MUST ADJUST THESE VALUES USING BROWSER DEV TOOLS for precise fit! ***
  const cdContainerTop = 'top-[45.3%]';
  const cdContainerLeft = 'left-[74.6%]';
  const cdContainerWidth = 'w-[44%]';
  const cdContainerHeight = 'h-[44%]';
  // *** END ADJUSTMENT AREA ***
  // Increased z-index to z-20
  const draggableCdContainerClasses = `absolute ${cdContainerTop} ${cdContainerLeft} ${cdContainerWidth} ${cdContainerHeight} -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ease-in-out ${cdVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-20`; // Increased z-index

  // --- Determine if CD should be Draggable ---
  const isCdDraggable = (view === 'ready' || view === 'playing') && cdVisible;

  // --- Function to Get Instruction Text (Corrected Priority Logic) ---
  const getInstructionText = () => {
      // Priority 1: Specific VIEW states that override drag status
      switch(view) {
          case 'closed': return 'Click the case to begin.';
          case 'crossFading': return 'Opening...';
          case 'enlargedPaused': return 'Opening...';
          case 'animating': return 'Opening...';
          case 'playing':
              return (
                  <>
                      Click ⏵ to start/pause the music.
                      <br />
                      Use the CD player controls or drag the disc back.
                  </>
              );
          // Only check drag/ready states if not in a higher priority view state
          default:
              // Priority 2: Specific drag operations
              if (drag === 'initial-cd') return 'Drop the disc onto the CD player!';
              if (drag === 'returning-cd') return 'Drop the disc onto the Case!';

              // Priority 3: 'ready' state (no active drag)
              if (view === 'ready') {
                   return cdVisible ? 'Drag the disc to the CD player.' : 'CD Returned.';
              }

              // Fallback
              return '';
      }
  };

  /* render */
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden px-4">

        {/* title + sub-heading */}
        <h1 className="text-5xl md:text-6xl font-bold mb-2 text-center">
          Virtual CD Player
        </h1>
        <h2 className="text-xl md:text-3xl text-center text-gray-300 mb-6">
          Listen while you read!
        </h2>

        {/* Core Layout: Flex container for Case and Boombox - REMOVED negative top margin, ADDED top padding */}
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl md:gap-12 lg:gap-16 relative" style={{minHeight: '500px'}}> {/* Removed pt- classes */}

          {/* Case Placeholder - Defines space in flex layout */}
          <div className={`relative flex-shrink-0 ${caseBaseSize} z-10`}>
            {/* Closed Case Image */}
            <img
                src={imgClosed}
                alt="Closed Case"
                onClick={() => view === 'closed' && setView('crossFading')}
                className={closedCaseClasses()}
            />
            {/* Open Case Container (Absolutely positioned inside placeholder) */}
            {view !== 'closed' && (
                <div className={openCaseClasses()}> {/* Applies animation classes */}
                    {/* Inner div for content and drop zone */}
                    <div
                        className={`absolute inset-0 w-full h-full rounded-md
                                   ${ showCaseOutline ? 'border-4 border-dashed border-white/60 bg-white/10' : '' }`}
                        onDragOver={(e) => {
                            // Only prevent default and set dropEffect if it's the returning CD
                            if (e.dataTransfer.types.includes(RETURNING_CD_TYPE)) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (!overZone) setOverZone(true);
                            } else {
                                // For other drag types (like the initial CD), allow default behavior
                                // DO NOT prevent default here, let the DraggableCD handle it
                                // e.dataTransfer.dropEffect = 'none'; // Explicitly set none for clarity
                                if (overZone) setOverZone(false); // Still remove highlight if drag leaves
                            }
                        }}
                        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.types.includes(RETURNING_CD_TYPE)) { returnCd(); } else { console.warn("Case Drop REJECTED (type mismatch)"); } }}
                    >
                        {/* Open Case Background Image */}
                        <img src={imgOpen} alt="Open Case" className="absolute inset-0 w-full h-full object-contain pointer-events-none"/>
                        {/* Draggable CD Container */}
                        {(['crossFading', 'enlargedPaused', 'animating', 'ready', 'playing']).includes(view) && (
                            <div className={draggableCdContainerClasses}> {/* Has z-20 */}
                                <DraggableCD
                                    isVisible={cdVisible}
                                    imageUrl={imgCd}
                                    onDragStartCallback={dragInitStart}
                                    onDragEndCallback={dragEnd}
                                    isDraggable={isCdDraggable}
                                />
                            </div>
                        )}
                        {/* Return Zone Helper Text */}
                        {showCaseOutline && ( <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 bg-black/50 px-2 py-1 rounded pointer-events-none z-20">Return CD Here</div> )}
                    </div>
                </div> // End Open Case Container
            )}
          </div> {/* End Case Placeholder */}

          {/* Boombox/CD Player Component - Positioned by Flexbox + Transform */}
          {/* This className applies the shift */}
          <div className={boomCls()}>
             <Boombox
                boomboxImageUrl={imgBoom} // Pass the image URL
                cdImageUrl={imgCd}
                isCdDropped={cdInPlayer}
                onCdInserted={insertCd}
                onReturnDragStartCallback={dragReturnStart}
                onReturnDragEndCallback={dragEnd}
                showDropZoneHighlight={showBoomOutline}
             />
          </div>
        </div> {/* End Main Flex Container */}

        {/* Instructions - Added small top margin */}
        <p className="mt-4 text-2xl md:text-3xl text-gray-200 text-center h-15 px-4 font-medium leading-tight"> {/* Added mt-4 */}
            {getInstructionText()}
        </p>
      </div>
    </DndProvider>
  );
}