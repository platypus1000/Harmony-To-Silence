// DraggableCD.tsx (Conditionally Disable Hover Effect)
import React, { useState, DragEvent, useRef } from 'react';

interface DraggableCDProps {
  isVisible: boolean;
  imageUrl: string;
  onDragStartCallback: () => void;
  onDragEndCallback: () => void;
  isDraggable: boolean;
}

const DraggableCD: React.FC<DraggableCDProps> = ({
  isVisible,
  imageUrl,
  onDragStartCallback,
  onDragEndCallback,
  isDraggable,
}) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (!isDraggable) {
        event.preventDefault();
        return;
    }
    console.log("DraggableCD: Drag Start");
    setIsBeingDragged(true);
    event.dataTransfer.setData('application/react-component', 'cd');
    event.dataTransfer.effectAllowed = "move";

    const img = new Image();
    img.src = imageUrl;
    if (img.naturalWidth > 0) {
         event.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
    } else {
        img.onload = () => {
            try { event.dataTransfer.setDragImage(img, img.width / 2, img.height / 2); }
            catch (e) { console.warn("DraggableCD: Setting drag image onload failed.", e); }
        };
        console.warn("DraggableCD: Drag image not loaded initially.");
    }
    onDragStartCallback();
  };

  const handleDragEnd = (event: DragEvent<HTMLDivElement>) => {
     if (!isBeingDragged) return;
     console.log(`DraggableCD: Drag End - Drop effect: ${event.dataTransfer.dropEffect}`);
    setIsBeingDragged(false);
    onDragEndCallback();
  };

  if (!isVisible) return null;

  // Base classes without hover effect
  const baseClasses = 'w-full h-full object-contain transition-transform duration-150';
  // Add hover effect only if draggable
  const hoverClass = isDraggable ? 'hover:scale-105' : '';
  // Cursor logic remains the same
  const dynamicClasses = isDraggable
    ? (isBeingDragged ? 'cursor-grabbing' : 'cursor-grab')
    : 'cursor-default';

  return (
    <div
      ref={dragRef}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // Apply hoverClass conditionally
      className={`${baseClasses} ${hoverClass} ${dynamicClasses}`}
      title={isDraggable ? "Drag me!" : ""}
    >
      <img
        src={imageUrl}
        alt="Draggable CD"
        className="w-full h-full object-contain pointer-events-none"
      />
       <span className="sr-only">Draggable CD</span>
    </div>
  );
};

export default DraggableCD;
