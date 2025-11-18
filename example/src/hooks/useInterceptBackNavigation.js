import { useEffect, useRef } from 'react';

/**
 * Intercepts navigation attempts (browser back, history navigation, programmatic POP) and
 * triggers the provided callback so the caller can surface the existing confirmation modal.
 *
 * @param {boolean} isEnabled - Whether interception is active.
 * @param {(context: { confirm: () => void; cancel: () => void; source: 'router'; }) => void} onBackAttempt
 */
const useInterceptBackNavigation = (isEnabled, onBackAttempt) => {
  const enabledRef = useRef(isEnabled);
  const handlerRef = useRef(onBackAttempt);
  const blockingRef = useRef(false);

  useEffect(() => {
    handlerRef.current = onBackAttempt;
  }, [onBackAttempt]);

  useEffect(() => {
    enabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isEnabled) {
      return () => {};
    }

    const pushInterceptState = (prevState) => {
      try {
        window.history.pushState(
          {
            __intercept: true,
            prevState: prevState ?? null,
            ts: Date.now()
          },
          document.title,
          window.location.href
        );
        blockingRef.current = true;
      } catch (error) {
        console.warn('Failed to push intercept state', error);
      }
    };

    const restorePreviousState = () => {
      try {
        const currentState = window.history.state;
        if (currentState && currentState.__intercept) {
          const prevState = currentState.prevState ?? null;
          window.history.replaceState(prevState, document.title, window.location.href);
        }
      } catch (error) {
        console.warn('Failed to restore previous state', error);
      }
      blockingRef.current = false;
    };

    const confirmNavigation = () => {
      if (!blockingRef.current) return;
      enabledRef.current = false;
      restorePreviousState();
      window.history.go(-1);
    };

    const cancelNavigation = () => {
      // No additional work required; intercept state is already re-applied in the handler.
    };

    const handlePopState = (event) => {
      if (!enabledRef.current) {
        blockingRef.current = false;
        return;
      }

      const previousState = event.state;
      pushInterceptState(previousState);
      handlerRef.current?.({
        source: 'browser',
        confirm: confirmNavigation,
        cancel: cancelNavigation
      });
    };

    const initialPrevState = window.history.state;
    pushInterceptState(initialPrevState);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      restorePreviousState();
    };
  }, [isEnabled]);

  return null;
};

export default useInterceptBackNavigation;

