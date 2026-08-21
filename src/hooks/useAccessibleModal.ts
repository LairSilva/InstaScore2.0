import React, { useEffect, useRef, RefObject } from "react";

interface UseAccessibleModalOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function useAccessibleModal({
  isOpen,
  onClose,
  initialFocusRef,
}: UseAccessibleModalOptions) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save the element that triggered the modal
    triggerRef.current = document.activeElement as HTMLElement | null;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    // Focus initial element or first focusable element inside modal
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const firstFocusable = modalElement.querySelector<HTMLElement>(focusableSelectors);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalElement.focus();
        }
      }
    }, 50);

    // Keyboard handlers (Escape to close, Tab for focus trap)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const elements = modalElement.querySelectorAll<HTMLElement>(focusableSelectors);
        const focusableElements: HTMLElement[] = Array.from(elements).filter(
          (el): el is HTMLElement => (el as HTMLElement).offsetParent !== null
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (document.activeElement === firstElement || document.activeElement === modalElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // Restore focus to trigger element
      if (triggerRef.current && typeof triggerRef.current.focus === "function") {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef]);

  return { modalRef };
}
