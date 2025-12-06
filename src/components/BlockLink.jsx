import { useState, useRef, useEffect } from "react";
import { Popover, Position } from "@blueprintjs/core";

const BlockLink = ({ blockUid, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const contentRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Wait for the popover to be rendered in the DOM
      const checkAndRender = () => {
        if (contentRef.current) {
          if (!contentRef.current.hasChildNodes()) {
            window.roamAlphaAPI.ui.components.renderBlock({
              uid: blockUid,
              el: contentRef.current,
              "zoom-path?": true,
            });
          }

          // Find the actual popover element and attach handlers
          const popoverElement = document.querySelector('.pbi-block-popover.bp3-popover');
          if (popoverElement && !popoverRef.current) {
            popoverRef.current = popoverElement;

            const handlePopoverMouseEnter = () => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
            };

            const handlePopoverMouseLeave = () => {
              closeTimeoutRef.current = setTimeout(() => {
                setIsOpen(false);
                popoverRef.current = null;
              }, 300);
            };

            popoverElement.addEventListener('mouseenter', handlePopoverMouseEnter);
            popoverElement.addEventListener('mouseleave', handlePopoverMouseLeave);
          }
        } else {
          setTimeout(checkAndRender, 50);
        }
      };
      checkAndRender();
    }

    // Cleanup
    return () => {
      if (popoverRef.current) {
        popoverRef.current = null;
      }
    };
  }, [isOpen, blockUid]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Don't close immediately - wait to see if user moves into popover
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      popoverRef.current = null;
    }, 500);
  };

  const handleClick = (e) => {
    e.preventDefault();
    // Navigate to the block
    window.roamAlphaAPI.ui.mainWindow.openBlock({
      block: { uid: blockUid },
    });
  };

  const popoverContent = (
    <div
      ref={contentRef}
      className="pbi-block-popover-content"
    />
  );

  return (
    <Popover
      content={popoverContent}
      isOpen={isOpen}
      position={Position.RIGHT}
      popoverClassName="pbi-block-popover"
    >
      <span
        className="pbi-block-link"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </span>
    </Popover>
  );
};

export default BlockLink;
