import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Boombox from '@/components/Boombox';
import DraggableCD from '@/components/DraggableCD';

type ViewState =
  | 'closed'
  | 'fadingToOpen'
  | 'openCentered'
  | 'slidingLeft'
  | 'boomboxFadingIn'
  | 'readyToDrag'
  | 'playing';

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>('closed');
  const [isCdVisible, setIsCdVisible] = useState(true);

  const fadeDuration = 500;
  const slideDuration = 700;
  const pauseDuration = 500;

  const closedCaseImageUrl = 'https://i.imgur.com/6sIQ9v2.png';
  const openCaseImageUrl = 'https://i.imgur.com/cr2BwhZ.png';
  const boomboxImageUrl = 'https://i.imgur.com/86ydD4c.png';
  const cdImageUrl = 'https://i.imgur.com/1tCsz6z.png';

  useEffect(() => {
    let t1: NodeJS.Timeout, t2: NodeJS.Timeout, t3: NodeJS.Timeout, t4: NodeJS.Timeout;
    if (viewState === 'fadingToOpen') {
      t1 = setTimeout(() => setViewState('openCentered'), fadeDuration);
    } else if (viewState === 'openCentered') {
      t2 = setTimeout(() => setViewState('slidingLeft'), pauseDuration);
    } else if (viewState === 'slidingLeft') {
      t3 = setTimeout(() => setViewState('boomboxFadingIn'), slideDuration);
    } else if (viewState === 'boomboxFadingIn') {
      t4 = setTimeout(() => setViewState('readyToDrag'), fadeDuration);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [viewState]);

  const handleOpenCaseClick = () => {
    if (viewState === 'closed') setViewState('fadingToOpen');
  };

  const handleCdInserted = () => {
    if (['readyToDrag', 'boomboxFadingIn'].includes(viewState)) {
      setIsCdVisible(false);
      setViewState('playing');
    }
  };

  const handleCdReturned = () => {
    if (viewState === 'playing') {
      setIsCdVisible(true);
      setViewState('readyToDrag');
    }
  };

  const isCdDropped = !isCdVisible && viewState === 'playing';

  const getOpenCaseWrapperClasses = () => {
    let translate = '';
    if (viewState === 'closed' || viewState === 'fadingToOpen' || viewState === 'openCentered') {
      translate = 'translate-x-1/2';
    } else if (
      viewState === 'slidingLeft' ||
      viewState === 'boomboxFadingIn' ||
      viewState === 'readyToDrag' ||
      viewState === 'playing'
    ) {
      translate = 'translate-x-0';
    }
    return `relative w-[28rem] h-[28rem] transition-transform duration-700 ease-in-out ${translate}`;
  };

  const getBoomboxClasses = () => {
    const base = 'relative order-2 w-full max-w-xl transition-opacity ease-in-out duration-1000';
    const translate =
      viewState === 'boomboxFadingIn'
        ? 'transform translate-x-16 md:translate-x-24'
        : 'transform translate-x-0';
    const expand = viewState === 'playing' ? 'md:w-1/2 max-w-2xl order-1' : '';
    const visible = ['boomboxFadingIn', 'readyToDrag', 'playing'].includes(viewState)
      ? 'opacity-100'
      : 'opacity-0 pointer-events-none';
    return `${base} ${translate} ${expand} ${visible}`;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center bg-pink-100 overflow-hidden">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          CD Boombox Player 🎶
        </h1>

        <div className="flex flex-col md:flex-row items-center w-full justify-start pl-8 relative min-h-[300px] space-y-8 md:space-y-0 md:space-x-8">
          <div className={getOpenCaseWrapperClasses()}>
            {(viewState === 'closed' || viewState === 'fadingToOpen') && (
              <img
                src={closedCaseImageUrl}
                alt="Closed CD Case"
                onClick={handleOpenCaseClick}
                className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105
                  ${viewState === 'fadingToOpen' ? 'opacity-0' : 'opacity-100'}
                  ${viewState === 'closed' ? 'pointer-events-auto' : 'pointer-events-none'}`}
              />
            )}

            {viewState !== 'closed' && (
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={openCaseImageUrl}
                  alt="Open CD Case"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {isCdVisible && (
                  <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
                    <DraggableCD isVisible={isCdVisible} imageUrl={cdImageUrl} />
                  </div>
                )}
              </div>
            )}
          </div>

          {(viewState === 'boomboxFadingIn' ||
            viewState === 'readyToDrag' ||
            viewState === 'playing') && (
            <div className={getBoomboxClasses()}>
              <Boombox
                boomboxImageUrl={boomboxImageUrl}
                cdImageUrl={cdImageUrl}
                isCdPresent={isCdVisible && viewState === 'readyToDrag'}
                isCdDropped={isCdDropped}
                onCdInserted={handleCdInserted}
                onCdReturned={handleCdReturned}
              />
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-gray-600">
          {viewState === 'closed'
            ? 'Click the CD case to open it.'
            : viewState === 'readyToDrag'
            ? 'Drag the CD onto the boombox!'
            : viewState === 'playing'
            ? 'Drag the spinning CD back to its case to stop.'
            : ''}
        </p>
      </div>
    </DndProvider>
  );
};

export default Index;
