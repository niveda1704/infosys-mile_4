import React, { useEffect, useState } from "react";

export function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Keep splash screen visible for 2 seconds
    const timer = setTimeout(() => {
      setVisible(false);

      // Wait for fade-out animation before removing it
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <div
      id="app-splash-screen"
      className="
        fixed inset-0 z-[99999]
        flex items-center justify-center
        bg-[#0a0a0a]
        animate-splash-fade-out
      "
    >
      <div className="flex flex-col items-center">

        {/* SwipeX Logo */}
        <img
          src="/swipex-logo.png"
          alt="SwipeX"
          className="
            w-[75%]
            max-w-[700px]
            h-auto
            object-contain
            animate-splash-logo
          "
        />

      </div>
    </div>
  );
}

export default SplashScreen;