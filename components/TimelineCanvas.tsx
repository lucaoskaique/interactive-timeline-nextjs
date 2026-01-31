'use client'

import { useEffect, useRef } from 'react'
import Timeline from '@/lib/three/Timeline'

export default function TimelineCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<Timeline | null>(null)

  useEffect(() => {
    console.log('[TimelineCanvas] useEffect triggered');
    if (typeof window === 'undefined' || !containerRef.current) {
      console.log('[TimelineCanvas] Skipping initialization - window or container not available');
      return;
    }

    console.log('[TimelineCanvas] Initializing Timeline...');
    // Initialize Timeline
    const timeline = new Timeline()
    timelineRef.current = timeline

    // Append canvas to container
    if (timeline.renderer?.domElement) {
      console.log('[TimelineCanvas] Appending canvas to container');
      containerRef.current.appendChild(timeline.renderer.domElement)
    } else {
      console.warn('[TimelineCanvas] No renderer domElement found');
    }

    // Cleanup on unmount
    return () => {
      if (timelineRef.current) {
        const tl = timelineRef.current
        
        // Remove event listeners
        if (tl.renderer?.domElement) {
          tl.renderer.domElement.removeEventListener('wheel', tl.scroll)
          tl.renderer.domElement.removeEventListener('mousedown', tl.mouseDown)
          tl.renderer.domElement.removeEventListener('mouseup', tl.mouseUp)
        }
        window.removeEventListener('resize', tl.resize)
        window.removeEventListener('mousemove', tl.mouseMove)

        // Clean up Three.js
        if (tl.renderer) {
          if (tl.renderer.domElement && tl.renderer.domElement.parentNode) {
            tl.renderer.domElement.parentNode.removeChild(tl.renderer.domElement)
          }
          tl.renderer.forceContextLoss()
          tl.renderer.dispose()
        }

        // Cancel animation frame
        if (tl.animationId) {
          cancelAnimationFrame(tl.animationId)
        }

        // Destroy gesture
        if (tl.gesture) {
          tl.gesture.destroy()
        }
      }
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="timeline-container" />

      {/* Logo */}
      <a href="https://craftedbygc.com" className="logo cursor-eye fixed top-8 left-8 w-64 z-30 opacity-0" target="_blank" rel="noopener" tabIndex={0}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 388.67 43.4" role="img">
          <title>Green Chameleon Logo</title>
          <path d="M108.63,270.8v3.8c-.28-1.52-3.61-4.23-7.79-4.23-5.28,0-11.84,4.28-11.84,12.79,0,8.7,6.56,12.83,11.84,12.83,4.18,0,7.51-2.56,7.79-4.66v4.19c0,2.37-1.95,4.7-6.32,4.7a14,14,0,0,1-6.85-1.42v5a14.34,14.34,0,0,0,6.85,1.47c5.23,0,12.41-2.33,12.41-9.79V270.8Zm-6.8,19.77c-3.56,0-6.89-2.47-6.89-7.41s3.33-7.37,6.89-7.37a6.94,6.94,0,0,1,7.09,7.37C108.92,288.1,105.4,290.57,101.83,290.57Z" transform="translate(-89 -261.91)"></path>
        </svg>
      </a>

      {/* Say Hello Link */}
      <a href="#say-hello" className="say-hello cursor-eye fixed top-8 right-8 w-48 z-30 opacity-0" tabIndex={0}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 607.38 72.28" role="img">
          <title>Say Hello Link</title>
          <path fill="currentColor" d="M38.31,15.32a17.4,17.4,0,0,0-8.92-2.12,16.25,16.25,0,0,0-7.95,1.74,5.47,5.47,0,0,0-3.13,5,5.56,5.56,0,0,0,2.22,4.43A13.31,13.31,0,0,0,26.41,27L36,28.91c2.82.58,5.75,1.29,8.77,2.12A33.47,33.47,0,0,1,53,34.5a19.24,19.24,0,0,1,6.12,5.79,15.85,15.85,0,0,1,2.41,9.05,18.69,18.69,0,0,1-2.56,9.79,23.38,23.38,0,0,1-6.65,7.18,31.54,31.54,0,0,1-9.35,4.43,37.84,37.84,0,0,1-10.74,1.54q-13.5,0-21.88-6.31T0,48.28H16.38a12.59,12.59,0,0,0,5.54,8.1A20,20,0,0,0,32.57,59a24.42,24.42,0,0,0,4.25-.38,14.39,14.39,0,0,0,3.85-1.26A7.57,7.57,0,0,0,43.46,55a6,6,0,0,0,1.07-3.66q0-3.37-3.62-5.25A38,38,0,0,0,31.51,43L23,41.25a50.44,50.44,0,0,1-8.19-2.41,26.31,26.31,0,0,1-6.94-4,18.32,18.32,0,0,1-4.77-5.83,17.41,17.41,0,0,1-1.78-8.15A16.46,16.46,0,0,1,4,11.66,21.89,21.89,0,0,1,10.7,5.11a31.12,31.12,0,0,1,9.35-3.86A44.17,44.17,0,0,1,30.36,0a42.48,42.48,0,0,1,10,1.16,27.2,27.2,0,0,1,8.82,3.76,23.92,23.92,0,0,1,6.7,6.64,23.53,23.53,0,0,1,3.61,9.83H43.18A10.56,10.56,0,0,0,38.31,15.32Z"/>
        </svg>
        <div className="underline border-b-2 border-current mt-1"></div>
      </a>

      {/* Social Links */}
      <div className="social fixed top-8 left-1/2 -translate-x-1/2 flex gap-4 z-30 opacity-0">
        {/* Add social icons here if needed */}
      </div>

      {/* Loading indicator */}
      <div className="loading fixed inset-0 flex items-center justify-center bg-[#AEC7C3] z-50 pointer-events-none">
        <div className="text-center">
          <div className="progress-circle relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="line"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#1b42d8"
                strokeWidth="2"
                strokeDasharray="283"
                strokeDashoffset="283"
              />
            </svg>
          </div>
          <div className="progress-percent text-2xl font-bold text-[#1b42d8] mb-8">0%</div>
          <a href="#enter" className="enter text-[#1b42d8] text-xl font-bold pointer-events-auto opacity-0">Enter</a>
        </div>
      </div>

      {/* Compass */}
      <div className="compass fixed bottom-8 left-8 w-16 h-16 z-30 opacity-0">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#1b42d8" strokeWidth="2" />
          <path d="M32 12 L32 52 M12 32 L52 32" stroke="#1b42d8" strokeWidth="1" />
        </svg>
      </div>

      {/* Performance Monitor */}
      <div className="fps-counter fixed top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded font-mono text-sm z-50">
        FPS: <span id="fps-value">0</span>
      </div>
    </>
  )
}
