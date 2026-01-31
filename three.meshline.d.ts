declare module 'three.meshline' {
  import * as THREE from 'three';

  export class MeshLine extends THREE.BufferGeometry {
    constructor();
    setGeometry(geometry: THREE.BufferGeometry | Float32Array | THREE.Points): void;
    setPoints(points: THREE.Vector3[] | THREE.Vector2[] | Float32Array): void;
  }

  export class MeshLineMaterial extends THREE.ShaderMaterial {
    constructor(parameters?: any);
    lineWidth: number;
    color: THREE.Color;
    opacity: number;
    resolution: THREE.Vector2;
    sizeAttenuation: boolean;
    dashArray: number;
    dashOffset: number;
    dashRatio: number;
  }
}
