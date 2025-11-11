import { useSwipeable } from 'react-swipeable';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableTransactionRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
}

export default function SwipeableTransactionRow({ 
  children, 
  onDelete,
  disabled = false 
}: SwipeableTransactionRowProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteThreshold = -100; // pixels to swipe for delete

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (disabled) return;
      
      // Only allow left swipe (negative delta)
      if (eventData.deltaX < 0) {
        const offset = Math.max(eventData.deltaX, -150); // Max swipe distance
        setSwipeOffset(offset);
      }
    },
    onSwiped: (eventData) => {
      if (disabled) return;
      
      // If swiped past threshold, trigger delete
      if (eventData.deltaX < deleteThreshold) {
        setIsDeleting(true);
        setTimeout(() => {
          onDelete();
        }, 300); // Wait for animation
      } else {
        // Snap back to original position
        setSwipeOffset(0);
      }
    },
    trackMouse: false, // Only track touch, not mouse
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10 // Minimum distance for swipe detection
  });

  const getBackgroundColor = () => {
    const opacity = Math.min(Math.abs(swipeOffset) / 150, 1);
    if (swipeOffset < deleteThreshold) {
      return `rgba(239, 68, 68, ${opacity})`; // Red for delete
    }
    return `rgba(239, 68, 68, ${opacity * 0.6})`; // Lighter red while swiping
  };

  return (
    <div 
      className="relative overflow-hidden"
      style={{ 
        touchAction: 'pan-y', // Allow vertical scrolling
      }}
    >
      {/* Delete background that reveals on swipe */}
      <div 
        className="absolute inset-0 flex items-center justify-end pr-6"
        style={{
          backgroundColor: getBackgroundColor(),
          transition: isDeleting ? 'background-color 0.3s ease' : 'none'
        }}
      >
        <div className="flex items-center gap-2 text-white">
          <Trash2 className="w-5 h-5" />
          <span className="font-medium text-sm">
            {swipeOffset < deleteThreshold ? 'Release to Delete' : 'Swipe to Delete'}
          </span>
        </div>
      </div>

      {/* Swipeable content */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDeleting 
            ? 'transform 0.3s ease-out, opacity 0.3s ease-out' 
            : swipeOffset === 0 
            ? 'transform 0.3s ease-out' 
            : 'none',
          opacity: isDeleting ? 0 : 1,
        }}
        className="bg-white"
      >
        {children}
      </div>
    </div>
  );
}
