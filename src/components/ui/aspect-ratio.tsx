// Index.tsx (Increase Left Shift, Increase Initial Scale)
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Boombox from '@/components/Boombox'; // Assuming path is correct
import DraggableCD from '@/components/DraggableCD'; // Assuming path is correct & has conditional logic
import { AnimatePresence, motion } from 'framer-motion'; // Ensure motion is imported

/* enums */
type View = 'closed' | 'crossFading' | 'enlargedPaused' | 'animating' | 'ready' | 'playing';
type DragItem = null | 'initial-cd' | 'returning-cd';

// Define data types CONSTANTS matching components
const RETURNING_CD_TYPE = 'application/cd-returning';
const INITIAL_CD_DROP_TYPE = 'application/react-component';
const INITIAL_CD_DROP_DATA = 'cd';

// --- Configuration Constants for Initial Appearance ---
const INITIAL_SCALE_PERCENT = 180;
const INITIAL_TRANSLATE_X_PERCENT = -45;
const INITIAL_TRANSLATE_Y_PERCENT = 5;
// --- End Configuration Constants ---

// --- Positioning Constants (Adjust these for final layout) ---
// These define the final resting positions relative to the main flex container's center
const CASE_FINAL_OFFSET_X_PX = -200; // How many pixels left from center the case should end up
const BOOMBOX_FINAL_OFFSET_X_PX = 200; // How many pixels right from center the boombox should end up

// Timings in seconds
const crossFadeDuration = 0.7; // Adjusted slightly faster
const pauseDuration = 0.5;
const slideShrinkDuration = 0.7;
const boomboxFadeDuration = 1.2; // Added boombox fade duration constant

export default function Index() {
  /* state */
  const [view, setView] = useState<View>('closed');
  const [cdVisible, setCdVisible] = useState(true); // This state might become redundant if CD visibility is tied to view state
  const [cdInPlayer, setCdInPlayer] = useState(false); // True when CD is physically in the Boombox
  const [drag, setDrag] = useState<DragItem>(null);

  /* timings */
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    let t3: ReturnType<typeof setTimeout> | undefined;
    let t4: ReturnType<typeof setTimeout> | undefined; // For boombox fade in

    if (view === 'crossFading') {
      // Wait for crossFadeDuration, then go to enlargedPaused
      t1 = setTimeout(() => { setView('enlargedPaused'); }, crossFadeDuration * 1000);
    } else if (view === 'enlargedPaused') {
      // Wait for pauseDuration, then go to animating (slide)
      t2 = setTimeout(() => { setView('animating'); }, pauseDuration * 1000);
    } else if (view === 'animating') {
      // Wait for slideShrinkDuration, then start boombox fade in
      t3 = setTimeout(() => { setView('boomboxFadingIn'); }, slideShrinkDuration * 1000);
    } else if (view === 'boomboxFadingIn') {
      // Wait for boomboxFadeDuration, then go to readyToDrag
      t4 = setTimeout(() => { setView(cdInPlayer ? 'playing' : 'ready'); }, boomboxFadeDuration * 1000);
    }


    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [view, cdInPlayer, crossFadeDuration, pauseDuration, slideShrinkDuration, boomboxFadeDuration]); // Include all timing dependencies

  /* drag handlers */
  const dragInitStart = () => { setDrag('initial-cd'); };
  const dragReturnStart = () => { setDrag('returning-cd'); };
  const dragEnd = () => { setDrag(null); }; // Clear drag state on drag end

  /* insertion / return logic */
  const insertCd = () => {
    if (!cdInPlayer) {
      setCdVisible(false); // CD is now in the player, not visible in the case
      setCdInPlayer(true); // CD is now physically in the boombox
      setView('playing'); // Go directly to playing stage
      setDrag(null);
    }
  };
  const returnCd = () => {
    if (cdInPlayer) {
      setCdInPlayer(false); // CD is no longer physically in the boombox
      setCdVisible(true); // CD is back in the case, make it visible
      setView('ready'); // Go back to ready state
      setDrag(null);
    } else {
      // If somehow returnCd is called when CD isn't in player, ensure state is correct
      if (!cdVisible) setCdVisible(true);
      if (view !== 'ready') setView('ready');
    }
  };

  // --- Base size for the case placeholder - CRITICAL FOR LAYOUT ---
  // This div is just for layout in the flex container, actual size/pos is on motion components
  const casePlaceholderSize = 'w-[28rem] h-[28rem] md:w-[32rem] md:h-[32rem]';

  // --- Animation Variants/Props for Cases ---
  // Define positions using pixel offsets from the center of the main flex container
  const centeredPos = { x: '-50%', y: '-50%' }; // Center of the element at the center of the container
  const caseFinalPos = { x: `calc(-50% + ${CASE_FINAL_OFFSET_X_PX}px)`, y: '-50%' }; // Final position offset

  const closedCaseVariants = {
      closed: { opacity: 1, ...centeredPos, transition: { duration: crossFadeDuration } },
      fadingToOpen: { opacity: 0, ...centeredPos, transition: { duration: crossFadeDuration } },
      // Exit animation handled by AnimatePresence
  };

  const openCaseVariants = {
      // Initial state before crossFading
      hidden: {
          opacity: 0,
          scale: INITIAL_SCALE_PERCENT / 100,
          x: `${INITIAL_TRANSLATE_X_PERCENT}%`, // Use percentage offsets for initial state
          y: `${INITIAL_TRANSLATE_Y_PERCENT}%`,
          transition: { duration: 0 } // No transition to hidden
      },
      // State during crossFading and enlargedPaused
      enlarged: {
          opacity: 1,
          scale: INITIAL_SCALE_PERCENT / 100,
          x: `${INITIAL_TRANSLATE_X_PERCENT}%`, // Stay at initial percentage offset
          y: `${INITIAL_TRANSLATE_Y_PERCENT}%`,
          transition: { duration: crossFadeDuration } // Fade in transition
      },
      // State during animating (sliding)
      sliding: {
          opacity: 1,
          scale: 1, // Scale down to target size
          ...caseFinalPos, // Slide to final pixel offset position
          transition: { duration: slideShrinkDuration, ease: 'ease-in-out' } // Slide transition
      },
      // Final state (ready, playing)
      final: {
          opacity: 1,
          scale: 1,
          ...caseFinalPos, // Stay at final pixel offset position
          transition: { duration: 0 } // No transition to final
      },
      // Exit animation handled by AnimatePresence if needed (e.g., if removing the open case)
  };

  // Map view state to open case animation state
  const getOpenCaseAnimateState = () => {
      switch(view) {
          case 'closed': return 'hidden'; // Should not be visible
          case 'crossFading': return 'enlarged'; // Fading in at enlarged size/pos
          case 'enlargedPaused': return 'enlarged'; // Paused at enlarged size/pos
          case 'animating': return 'sliding'; // Animating to final size/pos
          case 'ready':
          case 'playing':
          case 'boomboxFadingIn': // Open case is in final position while boombox fades
              return 'final';
          default: return 'hidden';
      }
  };

  // --- Animation Variants/Props for Boombox ---
  const boomboxFinalPos = { x: `calc(-50% + ${BOOMBOX_FINAL_OFFSET_X_PX}px)`, y: '-50%' }; // Final position offset

  const boomboxVariants = {
      hidden: { opacity: 0, ...boomboxFinalPos, transition: { duration: 0 } }, // Start hidden at final pos
      boomboxFadingIn: { opacity: 1, ...boomboxFinalPos, transition: { duration: boomboxFadeDuration } }, // Fade in at final pos
      visible: { opacity: 1, ...boomboxFinalPos, transition: { duration: 0 } }, // Stay visible at final pos
  };

  // --- Draggable CD Container Position/Size ---
  // This container is positioned relative to the Open Case container
  // *** YOU MUST ADJUST THESE VALUES USING BROWSER DEV TOOLS for precise fit! ***
  // These percentages are relative to the Open Case's size (which is 100% of the placeholder size in final state)
  const cdContainerTop = '45.3%';
  const cdContainerLeft = '74.6%';
  const cdContainerWidth = '44%';
  const cdContainerHeight = '44%';
  // *** END ADJUSTMENT AREA ***
  // This div's position is relative to its parent (the Open Case motion.div)
  const draggableCdContainerClasses = `absolute top-[${cdContainerTop}] left-[${cdContainerLeft}] w-[${cdContainerWidth}] h-[${cdContainerHeight}] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ease-in-out ${cdVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`;

  // --- Determine if CD should be Draggable ---
  const isCdDraggable = (view === 'ready' || view === 'playing') && cdVisible;

  // --- Function to Get Instruction Text ---
  const getInstructionText = () => {
      // Priority 1: Specific VIEW states that override drag status
      switch(view) {
          case 'closed': return 'Click the case to begin.';
          case 'crossFading': return 'Opening...';
          case 'enlargedPaused': return '...';
          case 'animating': return '...';
          case 'boomboxFadingIn': return '...'; // Text might update after boombox is visible
          case 'ready':
              return cdVisible ? 'Drag the disc to the CD player.' : 'CD Returned.';
          case 'playing':
              return (
                  <>
                      Click ⏵ to start the music.
                      <br />
                      Use the CD player controls or drag the disc back.
                  </>
              );
          default: return '';
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
        <h2 className="text-xl md:text-2xl text-center text-gray-300 mb-6">
          Drag &amp; play iconic protest music
        </h2>

        {/* Core Layout: Flex container for Case and Boombox */}
        {/* This container centers the placeholder and boombox */}
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl md:gap-12 lg:gap-16 relative" style={{minHeight: '500px'}}>

          {/* Case Placeholder - Defines space in flex layout */}
          {/* The motion components for the cases are positioned ABSOLUTELY inside this relative div */}
          <div className={`relative flex-shrink-0 ${casePlaceholderSize}`}>
            {/* Closed Case Image - Use motion.img */}
            <AnimatePresence>
              {view === 'closed' && ( // Only render when view is 'closed'
                <motion.img
                    key="closed-case" // Key for AnimatePresence
                    src={imgClosed}
                    alt="Closed Case"
                    onClick={() => view === 'closed' && setView('crossFading')}
                    className="absolute inset-0 w-full h-full object-contain cursor-pointer hover:scale-105"
                    variants={closedCaseVariants}
                    initial="closed"
                    animate={getClosedCaseAnimateState()} // Animate based on view
                    exit="opening" // Animate to opening state on exit (opacity 0)
                />
              )}
            </AnimatePresence>

            {/* Open Case Container - Use motion.div */}
            {/* Render the open case container from crossFading onwards */}
            {view !== 'closed' && (
                <motion.div
                    key="open-case-container" // Key for AnimatePresence
                    className="absolute inset-0 w-full h-full rounded-md" // Positioned absolutely inside placeholder
                    variants={openCaseVariants}
                    initial="hidden" // Start from hidden state
                    animate={getOpenCaseAnimateState()} // Animate based on view state
                    // No explicit exit needed unless we remove the open case entirely later
                >
                    {/* Inner div for content and drop zone */}
                    <div
                        className={`absolute inset-0 w-full h-full rounded-md
                                   ${ showCaseOutline ? 'border-4 border-dashed border-white/60 bg-white/10' : '' }`}
                        onDragOver={(e) => { if (e.dataTransfer.types.includes(RETURNING_CD_TYPE)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } else { e.dataTransfer.dropEffect = 'none'; } }}
                        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.types.includes(RETURNING_CD_TYPE)) { returnCd(); } else { console.warn("Case Drop REJECTED (type mismatch)"); } }}
                    >
                        {/* Open Case Background Image */}
                        <img src={imgOpen} alt="Open Case" className="absolute inset-0 w-full h-full object-contain pointer-events-none"/>
                        {/* Draggable CD Container */}
                        {/* Render CD container if CD is visible (in case) and view is appropriate */}
                        {cdVisible && (['crossFading', 'enlargedPaused', 'animating', 'ready', 'playing', 'boomboxFadingIn']).includes(view) && (
                            <div className={draggableCdContainerClasses}>
                                <DraggableCD
                                    isVisible={cdVisible} // Pass visibility
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
                </motion.div> // End Open Case Container
            )}
          </div> {/* End Case Placeholder */}

          {/* Boombox/CD Player Component - Positioned by Flexbox + Transform */}
          {/* This className applies the shift */}
          {/* Use motion.div for Boombox to control its fade-in */}
          <AnimatePresence>
            {['animating', 'ready', 'playing', 'boomboxFadingIn'].includes(view) && ( // Render Boombox from animating stage onwards
                <motion.div
                    key="boombox" // Key for AnimatePresence
                    className="relative w-full max-w-2xl lg:max-w-3xl flex-shrink-0 md:-translate-x-48" // Keep flex positioning and shift class
                    variants={boomboxVariants}
                    initial="hidden" // Start hidden
                    animate={getBoomboxAnimateState()} // Animate based on view state
                    exit="hidden" // Fade out on exit (though it doesn't exit in this flow)
                >
                   <Boombox
                      boomboxImageUrl={imgBoom} // Pass the image URL
                      cdImageUrl={imgCd} // Pass CD image URL (Boombox might need it for internal CD visual)
                      isCdDropped={cdInPlayer} // Pass state
                      onCdInserted={insertCd} // Pass callback
                      onReturnDragStartCallback={dragReturnStart} // Pass callback
                      onReturnDragEndCallback={dragEnd} // Pass callback
                      showDropZoneHighlight={showBoomOutline} // Pass state
                      isReadyForCD={view === 'ready'} // Pass ready state
                   />
                </motion.div>
            )}
          </AnimatePresence>
        </div> {/* End Main Flex Container */}

        {/* Instructions - Increased size */}
        <p className="mt-12 md:mt-16 text-2xl md:text-3xl text-gray-200 text-center h-16 px-4 font-medium leading-tight">
            {getInstructionText()}
        </p>
      </div>
    </DndProvider>
  );
}