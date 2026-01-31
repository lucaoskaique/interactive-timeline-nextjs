import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type Timeline from "./Timeline";
import type { CustomTexture } from "../utils/AssetLoader";
import frag from "../shaders/item.frag";
import vert from "../shaders/default.vert";

interface ItemData {
    caption: string;
    link: string;
}

interface ItemOptions {
    timeline: Timeline;
    texture: CustomTexture;
    data: ItemData;
    month: string;
    itemIndex: number;
    itemIndexTotal: number;
}

export default class Item extends THREE.Group {
    timeline: Timeline;
    texture: CustomTexture;
    data: ItemData;
    month: string;
    itemIndex: number;
    itemIndexTotal: number;
    uniforms: any;
    geometry!: THREE.PlaneGeometry;
    material!: THREE.ShaderMaterial;
    mesh!: THREE.Mesh;
    align!: number;
    origPos!: THREE.Vector2;
    caption?: THREE.Mesh;

    constructor(opts: ItemOptions) {
        super();
        this.timeline = opts.timeline;
        this.texture = opts.texture;
        this.data = opts.data;
        this.month = opts.month;
        this.itemIndex = opts.itemIndex;
        this.itemIndexTotal = opts.itemIndexTotal;

        this.create();
    }

    create(): void {
        const fog = this.timeline.scene.fog as THREE.Fog;
        this.uniforms = {
            time: { type: "f", value: 1.0 },
            fogColor: { type: "c", value: fog.color },
            fogNear: { type: "f", value: fog.near },
            fogFar: { type: "f", value: fog.far },
            tDiffuse: { type: "t", value: this.texture },
            opacity: { type: "f", value: 1.0 },
            progress: { type: "f", value: 0.0 },
            gradientColor: { type: "vec3", value: new THREE.Color(0x1b42d8) },
        };

        // Use minimal geometry segments for better performance
        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: frag,
            vertexShader: vert,
            fog: true,
            transparent: true,
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.scale.set(this.texture.size!.x, this.texture.size!.y, 1);
        
        // Optimize static properties
        this.mesh.matrixAutoUpdate = true; // Keep enabled for animations
        this.geometry.computeBoundingSphere(); // Pre-compute for frustum culling

        // updates size of meshes after texture has been loaded
        this.texture.onUpdate = () => {
            if (
                this.mesh.scale.x !== this.texture.size!.x &&
                this.mesh.scale.y !== this.texture.size!.y
            ) {
                this.mesh.scale.set(
                    this.texture.size!.x,
                    this.texture.size!.y,
                    1,
                );
                this.texture.onUpdate = null;
            }
        };

        const align = this.itemIndexTotal % 4;
        const pos = new THREE.Vector2();

        if (align === 0) pos.set(-350, 350); // bottom left
        if (align === 1) pos.set(350, 350); // bottom right
        if (align === 2) pos.set(350, -350); // top right
        if (align === 3) pos.set(-350, -350); // top left

        this.align = align;
        this.position.set(pos.x, pos.y, this.itemIndex * -300 - 200);
        this.origPos = new THREE.Vector2(pos.x, pos.y);

        this.add(this.mesh);

        this.addCaption();

        this.timeline.itemMeshes.push(this.mesh);

        if (this.texture.mediaType === "video") {
            this.timeline.videoItems.push(this.mesh);
        }
    }

    addCaption(): void {
        if (this.data.caption === "" && this.data.link === "") return;

        if (this.data.caption !== "") {
            const captionGeom = new TextGeometry(this.data.caption, {
                font: this.timeline.assets.fonts["Gentilis"],
                size: 18,
                depth: 0,
                curveSegments: 2, // Reduced from 4 for performance
            }).center();

            this.caption = new THREE.Mesh(
                captionGeom,
                this.timeline.captionTextMat,
            );
            this.caption.position.set(0, -this.mesh.scale.y / 2 - 50, 0);
            this.caption.visible = false;

            this.add(this.caption);
        }
    }
}

export type { ItemData, ItemOptions };
