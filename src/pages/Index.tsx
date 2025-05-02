// Index.tsx (Revert initial pos, adjust text margin, slower fade, refine case dragOver, ABSOLUTE POS INSTRUCTIONS)
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
  // State to track drag-over for the case (optional, for better styling)
  const [overZone, setOverZone] = useState(false);

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
      // Handle case where CD might be dropped back but wasn't technically "in player"
      // (e.g., if drop happens quickly before state fully updates)
      if (!cdVisible) setCdVisible(true);
      if (view !== 'ready') setView('ready');
    }
    setOverZone(false); // Ensure drop zone highlight is removed
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
        // Default includes 'closed', where it shouldn't render anyway, but good fallback
        default: return 'absolute inset-0 pointer-events-none scale-125 opacity-0';
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
      // Refined transition: Apply transform transition only during 'animating' or explicitly needed phases
      // Opacity transition is fine generally
      const transitions = `transition-opacity duration-[${slideShrinkDuration}ms] ease-in-out ${view === 'animating' ? `transition-transform duration-[${slideShrinkDuration}ms] ease-in-out` : ''}`;
      const visibility = isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

      // >> HOW TO CHANGE LEFT SHIFT <<
      const shiftTransform = 'md:-translate-x-48'; // Example: shift left by 12rem (192px) on md+

      // Combine base, transition, visibility, and the transform shift
      return `${base} ${transitions} ${visibility} ${shiftTransform}`;
  };

  /* outlines when dragging */
  const showCaseOutline = drag === 'returning-cd' && overZone; // Only show if over the zone
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
          default: // Covers 'ready' state primarily now
              // Priority 2: Specific drag operations
              if (drag === 'initial-cd') return 'Drop the disc onto the CD player!';
              if (drag === 'returning-cd') return 'Drop the disc onto the Case!';

              // Priority 3: 'ready' state (no active drag)
              if (view === 'ready') {
                   return cdVisible ? 'Drag the disc to the CD player.' : 'CD Returned. Click case?'; // Refined ready text
              }

              // Fallback (should ideally not be reached often with this logic)
              return '';
      }
  };

  /* render */
  return (
    <DndProvider backend={HTML5Backend}>
      {/* --- Main Container: Added `relative` for absolute positioning context --- */}
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden px-4 pb-24">
        {/* Added pb-24 (or similar) to ensure space for absolute instructions at bottom */}

        {/* title + sub-heading */}
        <h1 className="text-5xl md:text-6xl font-bold mb-2 text-center">
          Virtual CD Player
        </h1>
        <h2 className="text-xl md:text-3xl text-center text-gray-300 mb-6">
          Listen while you read!
        </h2>

        {/* Core Layout: Flex container for Case and Boombox - REMOVED negative top margin, ADDED top padding */}
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl md:gap-12 lg:gap-16 relative" style={{minHeight: '500px'}}> {/* Ensure enough height */}

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
                        className={`absolute inset-0 w-full h-full rounded-md transition-colors duration-150
                                   ${ showCaseOutline ? 'bg-white/10' : '' }`} // Background on hover
                        onDragOver={(e) => {
                            if (drag === 'returning-cd' && e.dataTransfer.types.includes(RETURNING_CD_TYPE)) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (!overZone) setOverZone(true);
                            }
                             // Don't preventDefault for other types, let them bubble or be ignored
                        }}
                        onDragLeave={(e) => {
                             // Check if the relatedTarget (where the mouse is going) is outside this dropzone
                             // This prevents flickering when moving over child elements like the helper text
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setOverZone(false);
                            }
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (drag === 'returning-cd' && e.dataTransfer.types.includes(RETURNING_CD_TYPE)) {
                                returnCd(); // Handles state update including setOverZone(false)
                            } else {
                                console.warn("Case Drop REJECTED (type or drag state mismatch)");
                                setOverZone(false); // Ensure highlight is removed on invalid drop
                            }
                        }}
                    >
                        {/* Dashed border (now separate for cleaner transition) */}
                         <div className={`absolute inset-0 w-full h-full rounded-md pointer-events-none border-4 border-dashed border-white/60 transition-opacity duration-150 ${showCaseOutline ? 'opacity-100' : 'opacity-0'}`}></div>

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
                                    // Pass the correct drag type constant
                                    itemType={INITIAL_CD_DROP_TYPE}
                                    itemData={{ type: INITIAL_CD_DROP_DATA }} // Example data structure if needed by backend
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
                // Pass the correct drop type constant
                acceptedDropType={INITIAL_CD_DROP_TYPE}
             />
          </div>
        </div> {/* End Main Flex Container */}

        {/* --- Instructions: Absolutely Positioned --- */}
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-5x1 text-2xl md:text-3xl text-gray-300 text-center px-4 font-medium leading-tight pointer-events-none">
            {/* Use pointer-events-none if it should not interfere with clicks/drags below it */}
            {/* Removed h-15, mt-*, added absolute positioning */}
            {/* Use max-w-xl or similar to constrain width on large screens */}
            {/* Adjusted bottom padding on main container instead of margin here */}
            {getInstructionText()}
        </p>

      </div> {/* End Main Relative Container */}
    </DndProvider>
  );
}