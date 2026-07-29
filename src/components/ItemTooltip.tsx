import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const LONG_PRESS_MS = 520;

export function ItemTooltip({
  content,
  children,
}: {
  content: string;
  children: (bindings: {
    onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onBlur: () => void;
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  }) => ReactNode;
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => clearLongPress, []);

  const showFor = (element: HTMLElement) => setAnchor(element.getBoundingClientRect());
  const hide = () => {
    clearLongPress();
    setAnchor(null);
  };

  return (
    <>
      {children({
        onMouseEnter: (event) => showFor(event.currentTarget),
        onMouseLeave: hide,
        onFocus: (event) => showFor(event.currentTarget),
        onBlur: hide,
        onPointerDown: (event) => {
          if (event.pointerType === "mouse") {
            showFor(event.currentTarget);
            return;
          }
          clearLongPress();
          const element = event.currentTarget;
          longPressTimer.current = window.setTimeout(() => showFor(element), LONG_PRESS_MS);
        },
        onPointerUp: clearLongPress,
        onPointerCancel: hide,
      })}
      {anchor &&
        createPortal(
          <span
            className="item-tooltip-overlay"
            role="tooltip"
            style={{
              left: Math.min(Math.max(12, anchor.left), window.innerWidth - 332),
              top: Math.max(12, anchor.top - 12),
            }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
