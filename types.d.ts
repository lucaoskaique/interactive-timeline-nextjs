declare module '*.frag' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module 'three-bmfont-text' {
  import * as THREE from 'three';
  export default function createTextGeometry(options: any): THREE.BufferGeometry;
}

declare module 'load-bmfont' {
  export default function loadFont(url: string, callback: (err: Error | null, font: any) => void): void;
}

declare module 'tinygesture' {
  export default class TinyGesture {
    constructor(element: HTMLElement, options?: any);
    on(event: string, callback: (e: any) => void): void;
    velocityY: number;
  }
}

declare global {
  interface Window {
    assets?: any;
    opera?: string;
  }
}

export {};
