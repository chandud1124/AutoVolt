
import React, { useRef, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useIsMobile } from '@/hooks/use-mobile';

export const Layout = () => {
  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isUserScrollingRef = useRef<boolean>(false);
  const location = useLocation();
  
  // Save scroll position when user scrolls
  const handleScroll = useCallback(() => {
    if (mainRef.current) {
      scrollPositionRef.current = mainRef.current.scrollTop;
      isUserScrollingRef.current = true;
      // Reset the flag after a short delay to allow for state updates
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 100);
    }
  }, []);

  // Restore scroll position after re-renders caused by real-time updates
  // This prevents the page from jumping when socket events update state
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    // Use MutationObserver to detect content changes (from real-time updates)
    const observer = new MutationObserver(() => {
      // Only restore if we have a saved position and user is not actively scrolling
      if (scrollPositionRef.current > 0 && !isUserScrollingRef.current) {
        // Use requestAnimationFrame to ensure DOM has settled
        requestAnimationFrame(() => {
          if (main && Math.abs(main.scrollTop - scrollPositionRef.current) > 50) {
            main.scrollTop = scrollPositionRef.current;
          }
        });
      }
    });

    observer.observe(main, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });

    return () => observer.disconnect();
  }, []);

  // Reset scroll position when navigating to a different page
  useEffect(() => {
    scrollPositionRef.current = 0;
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="flex h-screen w-full min-w-0 overflow-hidden">
        <Sidebar className={`${isMobile ? 'hidden' : 'flex-shrink-0 block'}`} />
        <div className="flex-1 flex flex-col min-w-0 relative ml-0">
          <Header />
          <main 
            ref={mainRef}
            id="main-content" 
            className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0"
            role="main"
            tabIndex={-1}
            aria-label="Main content"
            onScroll={handleScroll}
            style={{ overscrollBehavior: 'contain' }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};