# Interactive Timeline (Next.js)

An interactive 3D timeline built with Next.js, Three.js, GSAP, and React.

## Tech Stack

- **Next.js 16** with App Router and TypeScript
- **Three.js** for 3D rendering
- **GSAP** for animations
- **TinyGesture** for touch interactions
- **Tailwind CSS** for utility styling

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── TimelineCanvas.tsx # Main Timeline wrapper
├── lib/                   # Core logic
│   ├── three/            # Three.js components
│   │   ├── Timeline.js   # Main 3D timeline controller
│   │   ├── Section.js    # Monthly sections
│   │   └── Item.js       # Individual media items
│   ├── config/           # Configuration files
│   │   ├── months.js     # Month definitions & colors
│   │   ├── assetOrder.js # Asset loading order
│   │   └── assetData.js  # Asset metadata
│   ├── shaders/          # GLSL shaders
│   │   ├── item.frag     # Item shader
│   │   ├── default.vert  # Default vertex shader
│   │   └── greenscreen.frag
│   └── utils/            # Utility functions
│       ├── AssetLoader.js
│       └── progressPromise.js
└── public/
    ├── assets/           # Media files (images/videos)
    └── fonts/            # Bitmap fonts
\`\`\`

## Getting Started

**Install dependencies:**
\`\`\`bash
npm install
\`\`\`

**Run development server:**
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the timeline.

**Build for production:**
\`\`\`bash
npm run build
npm start
\`\`\`

## Key Differences from Original

1. **Client-Side Rendering**: Timeline component uses \`'use client'\` directive for browser-only execution
2. **Next.js Webpack Config**: Custom webpack configuration in \`next.config.ts\` to handle GLSL shaders
3. **React Integration**: Timeline is wrapped in a React component with proper cleanup on unmount
4. **No HMR for WebGL**: Unlike the original, we don't preserve Three.js state during hot reload (cleaner but slower dev experience)
5. **TypeScript Support**: Added type declarations for shaders and third-party modules

## Adding New Content

1. Add media files to \`public/assets/{month}/\`
2. Update \`lib/config/assetOrder.js\` with the new files
3. Add metadata to \`lib/config/assetData.js\`
4. Restart the dev server

## Performance Notes

- Videos are lazy-loaded except for the intro section
- Three.js objects are properly disposed on component unmount
- Consider implementing dynamic imports for the Three.js bundle to reduce initial load

## Easter Egg

Try the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) while viewing the timeline! 🎮

## License

See the original project for license information.
