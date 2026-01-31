# 2018-in-review-nextjs: Interactive 3D Timeline (Next.js Port)

This is a Next.js 16 port of the original 2018-in-review Three.js timeline. The core 3D rendering logic is preserved from the original, wrapped in React components for Next.js App Router.

## Architecture

**Next.js Integration:**
- [page.tsx](app/page.tsx) - Server component rendering the main page
- [TimelineCanvas.tsx](components/TimelineCanvas.tsx) - Client component (`'use client'`) wrapping Timeline initialization
- [next.config.ts](next.config.ts) - Custom webpack config for GLSL shader loading via raw-loader and glslify-loader

**Core 3D Logic (ported from original):**
- [Timeline.js](lib/three/Timeline.js) - Main Three.js controller (no changes needed, runs client-side only)
- [Section.js](lib/three/Section.js) - Monthly sections with 3D text
- [Item.js](lib/three/Item.js) - Individual media items with shaders
- [AssetLoader.js](lib/utils/AssetLoader.js) - Handles textures, videos, and bitmap fonts

**Key Difference:** Timeline code is JavaScript (from original), but wrapper components are TypeScript. The 3D logic remains unchanged for compatibility.

## Development Workflow

**Start dev server:**
```bash
npm run dev
```
Runs on [http://localhost:3000](http://localhost:3000). Note: WebGL state is NOT preserved during hot reload (unlike original's custom HMR). Page refresh is required for Timeline changes.

**Build for production:**
```bash
npm run build
npm start
```

**Adding new media:**
1. Add files to `public/assets/{month}/`
2. Update [assetOrder.js](lib/config/assetOrder.js)
3. Add metadata to [assetData.js](lib/config/assetData.js)
4. Restart dev server

## Next.js-Specific Patterns

**Client-side only rendering:** TimelineCanvas uses `useEffect` to ensure Timeline initializes only in browser. Check `typeof window === 'undefined'` before any Three.js operations.

**Asset paths:** Use `/assets/...` (relative to `public/`) in Timeline code, NOT `@/public/...`. Next.js serves public files from root.

**Shader imports:** Shaders are imported as strings via webpack loaders. TypeScript declarations in [types.d.ts](types.d.ts) enable `import frag from '../shaders/item.frag'`.

**Cleanup pattern:** TimelineCanvas unmount removes all event listeners, disposes Three.js renderer, cancels animation frames, and destroys TinyGesture instance. Essential to prevent memory leaks on navigation.

**No HMR for WebGL:** Unlike original project's custom HMR that cached assets to `window.assets`, this version fully reinitializes on reload. Faster development relies on component isolation, not state preservation.

## Project Conventions

**File organization:** 
- React components → `components/`
- Three.js logic → `lib/three/`
- Config/data → `lib/config/`
- Utilities → `lib/utils/`
- Shaders → `lib/shaders/`

**TypeScript usage:** Wrapper components and new code use TypeScript. Original Three.js code remains JavaScript for easier porting. Use `// @ts-ignore` sparingly when Three.js types conflict.

**Styling:** Global styles in [globals.css](app/globals.css) handle canvas display, cursor effects, and touch detection classes. Tailwind used minimally for layout utilities.

## Common Gotchas

- Timeline must be instantiated client-side only - always check `typeof window` or use `'use client'`
- Shader files need both raw-loader and glslify-loader in webpack config
- Video paths are relative to `public/` folder, not `src/`
- Three.js cleanup on unmount is critical - missing cleanup causes GPU memory leaks
- Konami code listener persists across renders - ensure proper cleanup
- Mobile detection regex in Timeline.js is extensive - don't modify without testing

## External Dependencies

Same as original:
- Three.js 0.101.1 (older version - breaking changes in newer releases)
- GSAP v2 (v3 has different API)
- TinyGesture for touch handling
- Konami for easter egg detection

Next.js specific:
- raw-loader and glslify-loader for shader files
- TypeScript @types for Three.js

## Migration Notes

If updating Three.js components from original project:
1. Copy .js files directly to `lib/three/`
2. Update import paths (`'../config/months'` → `'@/lib/config/months'`)
3. Test shader imports work with Next.js webpack config
4. Verify asset paths reference `/public/` correctly
