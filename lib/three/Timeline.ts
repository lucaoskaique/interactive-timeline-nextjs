import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { gsap } from "gsap";
import TinyGesture from "tinygesture";
import AssetLoader from "../utils/AssetLoader";
import Item from "./Item";
import Section from "./Section";

import months from "../config/months";
import assetOrder from "../config/assetOrder";
import assetData from "../config/assetData";

export default class Timeline {
    private readonly SCROLL_SPEED_MULTIPLIER = 40;
    private readonly SCROLL_FRICTION = 0.85;
    private readonly POSITION_LERP_FACTOR = 0.1;
    private readonly MIN_SCROLL_SPEED = 0.1;
    private readonly MIN_POSITION_DELTA = 0.05;

    dom!: {
        cursor: Element | null;
        compass: Element | null;
        compassSvg: Element | null;
        mainSvgs: NodeListOf<Element>;
    };
    c!: {
        dpr: number;
        startTime: number;
        size: { w: number; h: number };
        scrollPos: number;
        scrollSpeed: number;
        scrolling: boolean;
        allowScrolling: boolean;
        autoMoveSpeed: number;
        isMobile: boolean;
        holdingMouseDown: boolean;
        touchEnabled: boolean;
        globalScale: number;
    };
    assetList: any;
    assetData: any;
    timelineEntered!: boolean;
    activeMonth!: string;
    months: any;
    monthPositions: any;
    remainingMonths!: any[];
    enableLoader!: boolean;
    gyroEnabled!: boolean;
    orientation!: { gamma: number; beta: number };
    easterEggEnabled!: boolean;
    lastColorCheckPos!: number;
    lastVideoCheckTime!: number;
    loadedMonths!: Set<string>;
    renderer!: THREE.WebGLRenderer;
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    raycaster!: THREE.Raycaster;
    intersects!: any[];
    linkIntersect!: any[];
    whooshIntersects!: any[];
    frustum!: THREE.Frustum;
    cameraViewProjectionMatrix!: THREE.Matrix4;
    mouse!: THREE.Vector2;
    mousePerspective!: THREE.Vector2;
    assets: any;
    timeline!: THREE.Group;
    textMat!: THREE.MeshBasicMaterial;
    captionTextMat!: THREE.MeshBasicMaterial;
    linkUnderlineMat!: THREE.MeshBasicMaterial;
    textOutlineMat!: THREE.MeshBasicMaterial;
    contactTextMat!: THREE.MeshBasicMaterial;
    sections: any;
    items: any;
    itemMeshes!: any[];
    videoItems!: any[];
    stopScrollPos!: number;
    videoCount!: number;
    contactSection: any;
    linkGroup!: THREE.Group;
    link!: THREE.Mesh;
    linkUnderline!: THREE.Mesh;
    linkBox!: THREE.Mesh;
    itemAnimating!: boolean;
    itemOpen: any;
    origTimelinePos!: number;
    gesture: any;
    hoveringWhoosh!: boolean;
    updatingPerspective!: boolean;
    initialOrientation: any;
    animationId!: number;
    // Performance monitoring
    fps!: number;
    lastFrameTime!: number;
    frameCount!: number;
    fpsUpdateTime!: number;

    constructor() {
        console.log("[Timeline] Constructor called");
        this.setConfig();
        console.log("[Timeline] Config set");

        // Initialize performance monitoring
        this.fps = 0;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateTime = performance.now();

        this.init();
        console.log("[Timeline] Init complete");

        if (!window.assets) {
            console.log("[Timeline] No cached assets found - loading assets");
            this.loadAssets();
        } else {
            console.log("[Timeline] Using cached assets");
            this.assets = window.assets;
            this.createTimeline();
        }
    }

    setConfig() {
        this.dom = {
            cursor: null,
            compass: document.querySelector(".compass"),
            compassSvg: document.querySelector(".compass svg"),
            mainSvgs: document.querySelectorAll("main :not(.compass) svg"),
        };

        this.c = {
            dpr: window.devicePixelRatio >= 2 ? 2 : 1,
            startTime: Date.now(),
            size: {
                w: window.innerWidth,
                h: window.innerHeight,
            },
            scrollPos: 0,
            scrollSpeed: 0, // Add this new property
            scrolling: false,
            allowScrolling: true,
            autoMoveSpeed: 0,
            isMobile: this.isMobile(),
            holdingMouseDown: false,
            touchEnabled: "ontouchstart" in window,
            globalScale: 1,
        };

        this.c.globalScale = Math.min(1, this.c.size.w / 1400);

        if (this.c.touchEnabled)
            document.documentElement.classList.add("touch-enabled");
        else document.documentElement.classList.add("enable-cursor");

        this.assetList = assetOrder;
        this.assetList.intro = ["ok.png"];
        this.assetList.end = ["wave.mp4"];
        this.assetData = assetData;

        this.timelineEntered = false;
        this.activeMonth = "intro";
        this.months = months;
        this.monthPositions = {};
        this.remainingMonths = [];
        this.enableLoader = true;
        this.gyroEnabled = false;
        this.orientation = {
            gamma: 0,
            beta: 0,
        };
        this.lastColorCheckPos = 0;
        this.lastVideoCheckTime = 0;
        this.loadedMonths = new Set(["intro"]); // Track loaded months for progressive loading
        this.loadedMonths = new Set(["intro"]); // Start with intro loaded
        this.hoveringWhoosh = false; // Initialize hover state
        this.itemOpen = null; // Initialize item state
        this.easterEggEnabled = false; // Initialize easter egg state

        if (!this.enableLoader) {
            const loadingEl = document.querySelector(
                ".loading",
            ) as HTMLElement | null;
            if (loadingEl) loadingEl.style.display = "none";
        }
    }

    isMobile() {
        let a =
            navigator.userAgent || navigator.vendor || (window as any).opera;
        return (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
                a,
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                a.substr(0, 4),
            )
        );
    }

    loadAssets() {
        console.log("[Timeline] loadAssets() called");
        console.log("[Timeline] isMobile:", this.c.isMobile);
        console.log("[Timeline] enableLoader:", this.enableLoader);
        console.log("[Timeline] assetList:", this.assetList);

        // Enable mock data for performance testing - set to false to use real assets
        const USE_MOCK_DATA = false;
        let assetLoader = new AssetLoader(this.c.isMobile);

        if (this.enableLoader) {
            console.log(
                "[Timeline] Loader enabled - waiting 2 seconds before loading",
            );
            setTimeout(() => {
                console.log("[Timeline] Starting asset load with loader");
                assetLoader
                    .load(this.assetList, this.renderer)
                    .then((assets) => {
                        this.assets = assets;
                        console.log(
                            "[Timeline] ASSETS LOADED (with loader)",
                            assets,
                        );

                        // all assets loaded - initialise
                        this.createTimeline();
                    })
                    .catch((error) => {
                        console.error(
                            "[Timeline] Error loading assets:",
                            error,
                        );
                    });
            }, 2000);
        } else {
            console.log("[Timeline] Loader disabled - loading immediately");
            assetLoader
                .load(this.assetList, this.renderer)
                .then((assets) => {
                    this.assets = assets;
                    console.log("[Timeline] ASSETS LOADED (no loader)", assets);

                    // all assets loaded - initialise
                    this.createTimeline();
                })
                .catch((error) => {
                    console.error("[Timeline] Error loading assets:", error);
                });
        }
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance", // Use dedicated GPU if available
            stencil: false, // Disable stencil buffer if not needed
        });
        this.renderer.setPixelRatio(this.c.dpr);
        this.renderer.setSize(this.c.size.w, this.c.size.h);
        document.body.appendChild(this.renderer.domElement);
        this.preventPullToRefresh();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xaec7c3);
        this.scene.fog = new THREE.Fog(0xaec7c3, 1400, 2000);
        this.scene.scale.set(this.c.globalScale, this.c.globalScale, 1);

        let cameraPosition = 800;

        const fov =
            (180 * (2 * Math.atan(this.c.size.h / 2 / cameraPosition))) /
            Math.PI;
        this.camera = new THREE.PerspectiveCamera(
            fov,
            this.c.size.w / this.c.size.h,
            1,
            2000,
        );
        this.camera.position.set(
            0,
            this.enableLoader ? 2000 : 0,
            cameraPosition,
        );

        this.raycaster = new THREE.Raycaster();
        this.raycaster.near = this.camera.near;
        this.raycaster.far = this.camera.far;
        this.raycaster.layers.set(0); // Only raycast layer 0
        this.intersects = [];
        this.linkIntersect = [];
        this.whooshIntersects = [];
        this.frustum = new THREE.Frustum();
        this.cameraViewProjectionMatrix = new THREE.Matrix4();
        this.mouse = new THREE.Vector2();
        this.mousePerspective = new THREE.Vector2();

        window.addEventListener("devicemotion", (event) => {
            if (
                event.rotationRate &&
                (event.rotationRate.alpha ||
                    event.rotationRate.beta ||
                    event.rotationRate.gamma)
            ) {
                this.gyroEnabled = true;
            }
        });
    }

    createTimeline() {
        this.timeline = new THREE.Group();
        this.scene.add(this.timeline);

        this.textMat = new THREE.MeshBasicMaterial({
            color: 0x1b42d8,
            transparent: true,
        });
        this.captionTextMat = new THREE.MeshBasicMaterial({
            color: 0x1b42d8,
            transparent: true,
            opacity: 0,
            visible: false,
        });
        this.linkUnderlineMat = new THREE.MeshBasicMaterial({
            color: 0x1b42d8,
            transparent: true,
            opacity: 0,
            visible: false,
        });
        this.textOutlineMat = new THREE.MeshBasicMaterial({
            color: 0x1b42d8,
            transparent: true,
        });
        this.contactTextMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.sections = {};
        this.items = {};
        this.itemMeshes = []; // array for raycasting mouse
        this.videoItems = [];

        let itemIndexTotal = 0,
            nextMonthPos = 0;

        for (let month in this.months) {
            this.sections[month] = new Section({
                timeline: this,
                section: month,
            });

            if (month !== "intro" && month !== "end") {
                let itemIndex = 0,
                    id;

                // add items
                this.assetList[month].forEach((filename: string) => {
                    id = `${month}/${filename}`;

                    this.items[id] = new Item({
                        timeline: this,
                        texture: this.assets.textures[month][filename],
                        data: this.assetData[month][filename],
                        month: month,
                        itemIndex: itemIndex,
                        itemIndexTotal: itemIndexTotal,
                    });

                    this.sections[month].add(this.items[id]);

                    itemIndex++;
                    itemIndexTotal++;
                });
            }

            let bbox = new THREE.Box3().setFromObject(this.sections[month]);

            this.sections[month].position.z = nextMonthPos;
            this.monthPositions[month] = nextMonthPos + 1100;
            let posOffset = 800; // TODO: get from camera?
            if (month === "intro") posOffset = 1700;
            if (month === "dec") posOffset = 1800;
            nextMonthPos += bbox.min.z - posOffset;

            this.timeline.add(this.sections[month]);

            if (month === "end")
                this.stopScrollPos = this.sections[month].position.z;
        }

        this.videoCount = this.videoItems.length;

        this.contactSection = new Section({
            timeline: this,
            section: "contact",
        });
        this.contactSection.visible = false;
        this.contactSection.isOpen = false; // Initialize isOpen state
        this.scene.add(this.contactSection);

        console.log("[Whoosh Debug] Sections created:", {
            hasEndSection: !!this.sections["end"],
            hasWhoosh: !!this.sections["end"]?.whoosh,
            whooshChildren: this.sections["end"]?.whoosh?.children.length,
        });

        this.linkGroup = new THREE.Group();

        let linkGeom = new TextGeometry("SEE MORE", {
            font: this.assets.fonts["SuisseIntl-Bold"],
            size: 6,
            depth: 0,
            curveSegments: 4,
        }).center();

        this.link = new THREE.Mesh(linkGeom, this.captionTextMat);

        this.linkUnderline = new THREE.Mesh(
            new THREE.PlaneGeometry(45, 1),
            this.linkUnderlineMat,
        );
        this.linkUnderline.position.set(0, -10, 0);

        // for raycasting so it doesn't just pick up on letters
        this.linkBox = new THREE.Mesh(
            new THREE.PlaneGeometry(70, 20),
            new THREE.MeshBasicMaterial({ alphaTest: 0, visible: false }),
        );
        this.linkGroup.visible = false;

        this.linkGroup.add(this.link);
        this.linkGroup.add(this.linkUnderline);
        this.linkGroup.add(this.linkBox);
        this.scene.add(this.linkGroup);

        console.log("[Timeline] Starting animation and initializing listeners");
        this.animate();
        console.log("[Timeline] Initializing cursor listeners");
        this.initCursorListeners();
        console.log("[Timeline] Initializing event listeners");
        this.initListeners();
        console.log("[Timeline] Adding 'ready' class to body");
        document.body.classList.add("ready");
        console.log("[Timeline] Timeline fully initialized and ready");
    }

    moveToStart() {
        gsap.to(this.camera.position, {
            duration: 2,
            y: 0,
            ease: "expo.inOut",
        });

        gsap.to(".loading", {
            duration: 2,
            y: "-100%",
            ease: "expo.inOut",
            onComplete: () => {
                const loadingEl = document.querySelector(
                    ".loading",
                ) as HTMLElement | null;
                if (loadingEl) loadingEl.style.display = "none";
                this.timelineEntered = true;
            },
        });

        gsap.to([".say-hello", ".logo", ".social"], {
            duration: 2,
            y: 0,
            delay: 1,
            ease: "expo.inOut",
        });

        gsap.to([".left", ".right"], {
            duration: 2,
            x: 0,
            delay: 1,
            ease: "expo.inOut",
        });

        if (this.gyroEnabled) {
            gsap.to(this.dom.compass, {
                duration: 2,
                y: 0,
                delay: 1,
                ease: "expo.inOut",
            });
        }
    }

    openItem(item: any) {
        if (!item || !this.sections[this.activeMonth]) {
            console.error(
                "openItem called with invalid item or section not found",
                {
                    item,
                    activeMonth: this.activeMonth,
                    sections: Object.keys(this.sections),
                },
            );
            return;
        }

        console.log("[openItem] DEBUG - Opening item:", {
            itemMonth: item.month,
            activeMonth: this.activeMonth,
            itemPosition: {
                x: item.position.x,
                y: item.position.y,
                z: item.position.z,
            },
            currentTimelinePos: this.timeline.position.z,
            remainingMonths: this.remainingMonths,
        });

        this.itemAnimating = true;
        this.itemOpen = item;
        this.origTimelinePos = this.timeline.position.z;
        this.c.allowScrolling = false;

        // Play video if this is a video item
        let texture = item.mesh.material.uniforms.tDiffuse.value;
        if (texture && texture.image && texture.image.tagName === "VIDEO") {
            if (this.c.isMobile) {
                texture.image.src = "assets/" + texture.name;
            }
            texture.image.play();
        }

        // Use the item's own month section position for accurate centering
        let posOffset = this.sections[item.month].position.z;

        const cameraOffset = this.c.globalScale < 0.5 ? 450 : 300;
        const calculatedZ = -(posOffset - -item.position.z) + cameraOffset;

        gsap.to(item.position, {
            duration: 1.5,
            x: 0,
            y: 0,
            ease: "expo.inOut",
            onComplete: () => {
                this.itemAnimating = false;
                if (this.dom.cursor)
                    (this.dom.cursor as HTMLElement).dataset.cursor = "cross";
            },
        });

        gsap.to(item.uniforms.progress, {
            duration: 1.5,
            value: 1,
            ease: "expo.inOut",
        });

        gsap.to(this.timeline.position, {
            duration: 1.5,
            z: calculatedZ,
            ease: "expo.inOut",
        });

        gsap.to(this.textMat, {
            duration: 1,
            opacity: 0,
            ease: "expo.inOut",
            onComplete: () => {
                this.textMat.visible = false;
            },
        });

        gsap.to(this.captionTextMat, {
            duration: 2,
            opacity: 1,
            ease: "expo.inOut",
            delay: 0.3,
            onStart: () => {
                this.captionTextMat.visible = true;
            },
        });

        gsap.to(this.linkUnderlineMat, {
            duration: 2,
            opacity: 0.4,
            ease: "expo.inOut",
            delay: 0.3,
            onStart: () => {
                this.linkUnderlineMat.visible = true;
            },
        });

        if (item.caption) {
            gsap.fromTo(
                item.caption.position,
                {
                    z: -100,
                },
                {
                    duration: 2,
                    z: 0,
                    delay: 0.2,
                    ease: "expo.inOut",
                    onStart: () => {
                        item.caption.visible = true;
                    },
                },
            );
        }

        if (item.data.link) {
            (this.linkBox as any).onClick = () => {
                window.open(item.data.link, "_blank");
            };

            this.linkGroup.position.y = item.caption
                ? item.caption.position.y - this.SCROLL_SPEED_MULTIPLIER
                : -item.mesh.scale.y / 2 - 50;

            gsap.fromTo(
                this.linkGroup.position,
                {
                    z: 0,
                },
                {
                    duration: 2,
                    z: this.c.globalScale < 0.5 ? 450 : 300,
                    delay: 0.3,
                    ease: "expo.inOut",
                    onStart: () => {
                        this.linkGroup.visible = true;
                    },
                },
            );
        }

        let pos = new THREE.Vector2();

        for (let x in this.items) {
            // TODO: see if can select just in camera range + a bit more for the timeline position

            if (this.items[x].align === 0) pos.set(-700, 700); // bottom left
            if (this.items[x].align === 1) pos.set(700, 700); // bottom right
            if (this.items[x].align === 2) pos.set(700, -700); // top right
            if (this.items[x].align === 3) pos.set(-700, -700); // top left

            if (this.items[x] === item) continue;

            gsap.to(this.items[x].material.uniforms.opacity, {
                duration: 1.3,
                value: 0,
                ease: "expo.inOut",
            });

            gsap.to(this.items[x].position, {
                duration: 1.3,
                x: pos.x,
                y: pos.y,
                ease: "expo.inOut",
            });
        }
    }

    closeItem() {
        if (!this.itemAnimating && this.itemOpen) {
            this.itemAnimating = true;
            if (this.dom.cursor)
                (this.dom.cursor as HTMLElement).dataset.cursor = "pointer";

            // Pause video if this was a video item
            let texture = this.itemOpen.mesh.material.uniforms.tDiffuse.value;
            if (texture && texture.image && texture.image.tagName === "VIDEO") {
                texture.image.pause();
                if (this.c.isMobile) {
                    texture.image.src = "";
                    texture.image.load();
                }
            }

            gsap.to(this.itemOpen.position, {
                duration: 1.5,
                x: this.itemOpen.origPos.x,
                y: this.itemOpen.origPos.y,
                ease: "expo.inOut",
            });

            gsap.to(this.timeline.position, {
                duration: 1.5,
                z: this.origTimelinePos,
                ease: "expo.inOut",
                onComplete: () => {
                    this.c.allowScrolling = true;
                    this.itemOpen = false;
                    this.itemAnimating = false;
                },
            });

            gsap.to(this.itemOpen.uniforms.progress, {
                duration: 1.5,
                value: 0,
                ease: "expo.inOut",
            });

            gsap.to(this.textMat, {
                duration: 1.5,
                opacity: 1,
                ease: "expo.inOut",
                onStart: () => {
                    this.textMat.visible = true;
                },
            });

            gsap.to([this.captionTextMat, this.linkUnderlineMat], {
                duration: 0.4,
                opacity: 0,
                ease: "expo.inOut",
                onComplete: () => {
                    this.captionTextMat.visible = false;
                    this.linkUnderlineMat.visible = false;
                    if (this.itemOpen.caption)
                        this.itemOpen.caption.visible = false;
                    this.linkGroup.visible = false;
                },
            });

            for (let x in this.items) {
                if (this.items[x].active) continue;

                gsap.to(this.items[x].material.uniforms.opacity, {
                    duration: 1.5,
                    value: 1,
                    ease: "expo.inOut",
                });

                gsap.to(this.items[x].position, {
                    duration: 1.5,
                    x: this.items[x].origPos.x,
                    y: this.items[x].origPos.y,
                    ease: "expo.inOut",
                });
            }
        }
    }

    openContact(e: any) {
        e.preventDefault();

        if (this.contactSection.isOpen) return this.closeContact();

        this.setCursor("cross");

        this.contactSection.visible = true;
        this.contactSection.isOpen = true;
        this.c.allowScrolling = false;
        this.linkUnderlineMat.visible = true;
        this.linkUnderlineMat.opacity = 0.3;

        gsap.to(this.camera.position, {
            duration: 2,
            y: this.contactSection.position.y * this.scene.scale.y,
            ease: "expo.inOut",
            onComplete: () => {
                this.timeline.visible = false;
            },
        });
    }

    closeContact() {
        this.timeline.visible = true;
        this.contactSection.isOpen = false;

        gsap.to(this.camera.position, {
            duration: 2,
            y: 0,
            ease: "expo.inOut",
            onComplete: () => {
                this.contactSection.visible = false;
                this.c.allowScrolling = true;
                this.linkUnderlineMat.visible = false;
                this.linkUnderlineMat.opacity = 0;
            },
        });
    }

    scroll(e: any) {
        e.preventDefault();

        let delta = normalizeWheelDelta(e);

        // Don't add directly to scrollPos, add to a velocity/speed variable
        this.c.scrollSpeed = -delta * this.SCROLL_SPEED_MULTIPLIER;
        this.c.scrolling = true;

        function normalizeWheelDelta(e: any) {
            if (e.detail && e.wheelDelta)
                return (e.wheelDelta / e.detail / 40) * (e.detail > 0 ? 1 : -1);
            else if (e.deltaY) return -e.deltaY / 60;
            else return e.wheelDelta / 120;
        }
    }

    mouseDown(e: any) {
        e.preventDefault();
        e.stopPropagation();

        console.log("[Whoosh Debug] mouseDown triggered:", {
            hoveringWhoosh: this.hoveringWhoosh,
            contactOpen: this.contactSection?.isOpen,
            itemOpen: !!this.itemOpen,
            intersectsCount: this.intersects.length,
            activeMonth: this.activeMonth,
            scrollPos: this.c.scrollPos,
            timelineZ: this.timeline.position.z,
        });

        if (this.easterEggEnabled) return;

        this.c.holdingMouseDown = true;

        if (this.contactSection.isOpen) {
            if (this.linkIntersect.length > 0) {
                if (this.linkIntersect[0].object.onClick)
                    this.linkIntersect[0].object.onClick();
            } else {
                this.closeContact();
            }
        } else if (this.itemOpen) {
            if (this.linkIntersect.length > 0) {
                if (this.linkIntersect[0].object.onClick)
                    this.linkIntersect[0].object.onClick();
            } else {
                this.closeItem();
            }
        } else {
            if (this.intersects.length > 0) {
                this.openItem(this.intersects[0].object.parent);
                this.setCursor("cross");
            } else if (this.hoveringWhoosh) {
                console.log(
                    "[Whoosh Debug] WHOOSH CLICKED! Starting scroll to 0",
                );
                this.c.scrolling = true;
                this.c.scrollSpeed = 0; // Reset scroll speed

                gsap.to(this.c, {
                    duration: 4,
                    scrollPos: 0,
                    ease: "expo.inOut",
                    onStart: () => {
                        console.log("[Whoosh Debug] GSAP animation started", {
                            currentScrollPos: this.c.scrollPos,
                            targetScrollPos: 0,
                        });
                    },
                    onUpdate: () => {
                        this.c.scrolling = true;
                        console.log("[Whoosh Debug] Scrolling:", {
                            scrollPos: this.c.scrollPos,
                            timelineZ: this.timeline.position.z,
                        });
                    },
                    onComplete: () => {
                        console.log("[Whoosh Debug] Scroll to 0 complete");
                    },
                });
            } else {
                this.setCursor("move");
                gsap.to(this.c, {
                    duration: 0.5,
                    delay: 0.7,
                    autoMoveSpeed: 8,
                });
            }
        }
    }

    mouseUp() {
        if (!this.itemOpen) this.setCursor("pointer");
        this.c.holdingMouseDown = false;
        // gsap.killTweensOf available but resetting directly is simpler
        this.c.autoMoveSpeed = 0;
    }

    mouseMove(e: any) {
        this.mousePerspective.x = e.clientX / window.innerWidth - 0.5;
        this.mousePerspective.y = e.clientY / window.innerHeight - 0.5;
        this.updatingPerspective = true;

        if (
            !this.renderer ||
            e.target !== this.renderer.domElement ||
            this.easterEggEnabled
        )
            return;

        this.mouse.x =
            (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y =
            -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // raycast for items when in timeline mode
        if (
            !this.contactSection.isOpen &&
            !this.itemOpen &&
            !this.c.holdingMouseDown
        ) {
            if (this.activeMonth === "end") {
                this.intersects = [];
                this.whooshIntersects = this.raycaster.intersectObjects(
                    this.sections["end"].whoosh.children,
                );

                console.log("[Whoosh Debug] Raycasting whoosh:", {
                    intersectsCount: this.whooshIntersects.length,
                    hoveringWhoosh: this.hoveringWhoosh,
                    activeMonth: this.activeMonth,
                });

                if (this.whooshIntersects.length > 0) {
                    console.log("[Whoosh Debug] Hovering over whoosh button");
                    this.setCursor("none");
                    this.hoveringWhoosh = true;
                    this.sections["end"].arrowTween.timeScale(2);
                } else if (this.hoveringWhoosh) {
                    console.log("[Whoosh Debug] Left whoosh button");
                    this.setCursor("pointer");
                    this.hoveringWhoosh = false;
                    this.sections["end"].arrowTween.timeScale(1);
                }
            } else {
                this.intersects = this.raycaster.intersectObjects(
                    this.itemMeshes,
                );

                if (this.intersects.length > 0) {
                    this.setCursor("eye");
                } else if (this.getCursor() !== "pointer") {
                    this.setCursor("pointer");
                }
            }
        }

        // raycast for item link
        if (
            !this.contactSection.isOpen &&
            this.itemOpen &&
            this.itemOpen.data.link
        ) {
            this.linkIntersect = this.raycaster.intersectObject(this.linkBox);

            if (this.linkIntersect.length > 0) {
                this.setCursor("eye");
            } else if (this.getCursor() !== "cross") {
                this.setCursor("cross");
            }
        }

        if (this.contactSection.isOpen) {
            this.linkIntersect = this.raycaster.intersectObject(
                this.contactSection.linkBox,
            );

            if (this.linkIntersect.length > 0) {
                this.setCursor("eye");
            } else if (this.getCursor() !== "cross") {
                this.setCursor("cross");
            }
        }
    }

    updatePerspective() {
        gsap.to(this.camera.rotation, {
            duration: 4,
            x: -this.mousePerspective.y * 0.5,
            y: -this.mousePerspective.x * 0.5,
            ease: "power4.out",
        });

        if (this.activeMonth === "end") {
            gsap.to(this.sections["end"].arrow.rotation, {
                duration: 4,
                x: -1.5 + this.mousePerspective.y * 0.2,
                y: this.mousePerspective.x * 0.8,
                ease: "power4.out",
            });
        }

        this.updatingPerspective = false;
    }

    updateOrientation(e: any) {
        this.orientation.gamma = e.gamma ? e.gamma : 0;
        this.orientation.beta = e.beta ? e.beta : 0;

        if (!this.initialOrientation) {
            this.initialOrientation = {
                gamma: this.orientation.gamma,
                beta: this.orientation.beta,
            };
        }

        gsap.to(this.camera.rotation, {
            duration: 2,
            x: this.orientation.beta
                ? (this.orientation.beta - this.initialOrientation.beta) *
                  (Math.PI / 300)
                : 0,
            y: this.orientation.gamma
                ? (this.orientation.gamma - this.initialOrientation.gamma) *
                  (Math.PI / 300)
                : 0,
            ease: "power4.out",
        });
    }

    resetOrientation(e: any) {
        this.initialOrientation = {
            gamma: this.orientation.gamma,
            beta: this.orientation.beta,
        };
    }

    loadNearbyMonths() {
        // Progressive loading: load months that are within view distance (1500 units)
        const viewDistance = 1500;
        const currentPos = -this.timeline.position.z;

        for (const month in this.monthPositions) {
            if (this.loadedMonths.has(month)) continue;

            const monthPos = this.monthPositions[month];
            const distance = Math.abs(currentPos - monthPos);

            // If month is within view distance and not loaded, load it
            if (distance < viewDistance) {
                this.loadMonthAssets(month);
            }
        }
    }

    loadMonthAssets(month: string) {
        // Mark as loaded to prevent duplicate loading
        this.loadedMonths.add(month);
        console.log(`[Timeline] Lazy loading assets for month: ${month}`);

        // For mock data mode, assets are already loaded
        // In production, you would load real assets here via AssetLoader
        // This is a placeholder for future implementation
    }

    changeColours(override = false) {
        // Only recalculate remaining months when needed
        const currentMonths = Object.keys(this.monthPositions).filter((key) => {
            return this.timeline.position.z > -this.monthPositions[key];
        });

        const newActiveMonth = currentMonths[currentMonths.length - 1];

        // Only update colors if the month actually changed or override is set
        if (
            override ||
            (newActiveMonth && this.activeMonth !== newActiveMonth)
        ) {
            this.remainingMonths = currentMonths;

            if (override) {
                this.activeMonth = override as unknown as string;
            } else {
                console.log("[Whoosh Debug] Active month changed:", {
                    from: this.activeMonth,
                    to: newActiveMonth,
                    timelinePos: this.timeline.position.z,
                });
                this.activeMonth = newActiveMonth;
            }

            let bgColor = new THREE.Color(
                this.months[this.activeMonth].bgColor,
            );
            let textColor = new THREE.Color(
                this.months[this.activeMonth].textColor,
            );
            let tintColor = new THREE.Color(
                this.months[this.activeMonth].tintColor,
            );
            let interfaceColor;

            if (this.scene.fog && this.scene.background) {
                gsap.to([this.scene.fog.color, this.scene.background], {
                    duration: 1,
                    r: bgColor.r,
                    g: bgColor.g,
                    b: bgColor.b,
                    ease: "power4.out",
                });
            }

            gsap.to(this.textMat.color, {
                duration: 1,
                r: textColor.r,
                g: textColor.g,
                b: textColor.b,
                ease: "power4.out",
            });

            gsap.set([this.captionTextMat.color, this.linkUnderlineMat.color], {
                r: textColor.r,
                g: textColor.g,
                b: textColor.b,
            });

            for (let id in this.items) {
                gsap.to(this.items[id].uniforms.gradientColor.value, {
                    duration: 1,
                    r: tintColor.r,
                    g: tintColor.g,
                    b: tintColor.b,
                    ease: "power4.out",
                });
            }

            if (this.months[this.activeMonth].outlineTextColor) {
                let outlineTextColor = new THREE.Color(
                    this.months[this.activeMonth].outlineTextColor,
                );
                interfaceColor = outlineTextColor.getHexString();

                gsap.to([this.textOutlineMat.color], {
                    duration: 1,
                    r: outlineTextColor.r,
                    g: outlineTextColor.g,
                    b: outlineTextColor.b,
                    ease: "power4.out",
                });
            } else {
                interfaceColor = textColor.getHexString();
            }

            if (this.months[this.activeMonth].contactColor)
                this.contactTextMat.color.set(
                    this.months[this.activeMonth].contactColor,
                );
            else this.contactTextMat.color.set(0xffffff);

            gsap.to(this.dom.mainSvgs, {
                duration: 1,
                fill: `#${interfaceColor}`,
                ease: "power4.out",
            });
            if (this.dom.compassSvg) {
                gsap.to(this.dom.compassSvg, {
                    duration: 1,
                    stroke: `#${interfaceColor}`,
                    ease: "power4.out",
                });
            }
            gsap.to(".say-hello .underline", {
                duration: 1,
                borderBottomColor: `#${interfaceColor}`,
                ease: "power4.out",
            });

            const metaTheme = document.querySelector("meta[name=theme-color]");
            if (metaTheme) {
                metaTheme.setAttribute("content", "#" + bgColor.getHexString());
            }

            if (
                this.activeMonth === "end" &&
                !this.sections["end"].arrowTween
            ) {
                this.sections["end"].arrowTween = gsap.to(
                    this.sections["end"].arrow.position,
                    {
                        duration: 1,
                        z: 0,
                        repeat: -1,
                        yoyo: true,
                        ease: "power2.inOut",
                    },
                );
            } else if (this.sections["end"].arrowTween) {
                this.sections["end"].arrowTween = false;
            }
        }
    }

    handleVideos() {
        // Frustum is now calculated once per frame in animate(), reuse it here
        // No need to recalculate - saves matrix operations

        for (let i = 0; i < this.videoCount; i++) {
            // Cache the frustum check result to avoid calling it twice
            const isInFrustum = this.frustum.intersectsObject(
                this.videoItems[i],
            );
            const video =
                this.videoItems[i].material.uniforms.tDiffuse.value.image;

            if (isInFrustum && video.paused) {
                video.play();
            } else if (!isInFrustum && !video.paused) {
                video.pause();
            }
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        // Performance monitoring
        const currentTime = performance.now();
        this.frameCount++;

        // Update FPS every second
        if (currentTime >= this.fpsUpdateTime + 1000) {
            this.fps = Math.round(
                (this.frameCount * 1000) / (currentTime - this.fpsUpdateTime),
            );
            // Only log FPS every 5 seconds to reduce console spam
            if (
                Math.floor(currentTime / 5000) !==
                Math.floor(this.fpsUpdateTime / 5000)
            ) {
                console.log(`[Performance] FPS: ${this.fps}`);
            }

            // Update FPS display
            const fpsDisplay = document.getElementById("fps-value");
            if (fpsDisplay) {
                fpsDisplay.textContent = String(this.fps);
            }

            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        // Track frame time - only warn for very slow frames (>33ms = below 30fps)
        const deltaTime = currentTime - this.lastFrameTime;
        if (deltaTime > 33) {
            console.warn(`[Performance] Slow frame: ${deltaTime.toFixed(2)}ms`);
        }
        this.lastFrameTime = currentTime;

        if (!this.c.touchEnabled && this.updatingPerspective) {
            this.updatePerspective();
            this.updatingPerspective = false;
        }

        if (this.c.autoMoveSpeed > 0) {
            this.c.scrolling = true;
            this.c.scrollPos += this.c.autoMoveSpeed;
        }

        // NEW: Apply scroll speed deceleration
        if (Math.abs(this.c.scrollSpeed) > this.MIN_SCROLL_SPEED) {
            this.c.scrolling = true;
            this.c.scrollPos += this.c.scrollSpeed;

            // Decelerate the scroll speed (friction)
            this.c.scrollSpeed *= this.SCROLL_FRICTION; // Adjust this value (0.8-0.95) for feel
        } else {
            this.c.scrollSpeed = 0;
        }

        // smooth scrolling
        if (this.c.allowScrolling && this.c.scrolling) {
            if (this.c.scrollPos <= 0) {
                this.c.scrollPos = 0;
                this.c.scrollSpeed = 0; // Stop speed at boundaries
            }
            if (this.c.scrollPos >= -this.stopScrollPos) {
                this.c.scrollPos = -this.stopScrollPos;
                this.c.scrollSpeed = 0; // Stop speed at boundaries
            }

            // Use lerp for smooth position transition
            let delta =
                (this.c.scrollPos - this.timeline.position.z) *
                this.POSITION_LERP_FACTOR;
            this.timeline.position.z += delta;

            // Only run expensive operations if there's meaningful movement
            if (Math.abs(delta) > this.MIN_POSITION_DELTA) {
                // if (!this.c.isMobile) this.handleVideos();
                if (!this.easterEggEnabled) this.changeColours();

                this.c.scrolling = true;
            } else if (
                Math.abs(delta) < 0.01 &&
                Math.abs(this.c.scrollSpeed) < this.MIN_SCROLL_SPEED
            ) {
                this.c.scrolling = false;
            }
        }

        if (this.hoveringWhoosh) {
            this.sections["end"].circle.rotation.z += 0.005;
        }

        // Update frustum for visibility culling (reuse from handleVideos calculation)
        this.camera.updateMatrixWorld();
        this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();
        this.cameraViewProjectionMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse,
        );
        this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);

        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        this.c.size = {
            w: window.innerWidth,
            h: window.innerHeight,
        };
        this.camera.fov =
            (180 *
                (2 * Math.atan(this.c.size.h / 2 / this.camera.position.z))) /
            Math.PI;
        this.camera.aspect = this.c.size.w / this.c.size.h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.c.size.w, this.c.size.h);
    }

    eyeCursorElEnter() {
        this.setCursor("eye");
    }

    eyeCursorElLeave() {
        this.setCursor("pointer");
    }

    initListeners() {
        this.resize = this.resize.bind(this);
        this.scroll = this.scroll.bind(this);
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.openContact = this.openContact.bind(this);
        this.moveToStart = this.moveToStart.bind(this);

        window.addEventListener("resize", this.resize, false);
        this.renderer.domElement.addEventListener(
            "mousedown",
            this.mouseDown,
            false,
        );
        this.renderer.domElement.addEventListener(
            "mouseup",
            this.mouseUp,
            false,
        );
        this.renderer.domElement.addEventListener("wheel", this.scroll, {
            passive: false,
        });

        if (this.gyroEnabled) {
            this.updateOrientation = this.updateOrientation.bind(this);
            this.resetOrientation = this.resetOrientation.bind(this);
            window.addEventListener(
                "deviceorientation",
                this.updateOrientation,
            );
            if (this.dom.compass) {
                this.dom.compass.addEventListener(
                    "click",
                    this.resetOrientation,
                    false,
                );
            }
        }

        const sayHello = document.querySelector(".say-hello");
        if (sayHello) {
            sayHello.addEventListener("click", this.openContact, false);
        }

        if (this.enableLoader) {
            const enterBtn = document.querySelector(".enter");
            if (enterBtn) {
                enterBtn.addEventListener("click", this.moveToStart, false);
            }
        }

        this.gesture = new TinyGesture(this.renderer.domElement, {
            mouseSupport: false,
        });

        this.gesture.on("panmove", (e: any) => {
            this.c.scrollPos += -this.gesture.velocityY * 6;
            this.c.scrolling = true;
        });

        this.gesture.on("panend", (e: any) => (this.c.autoMoveSpeed = 0));
        this.gesture.on("longpress", (e: any) => (this.c.autoMoveSpeed = 10));

        if (!this.c.touchEnabled) {
            this.setCursor("pointer");
        }
    }

    initCursorListeners() {
        this.mouseMove = this.mouseMove.bind(this);
        window.addEventListener("mousemove", this.mouseMove, false);
    }

    preventPullToRefresh() {
        var prevent = false;

        this.renderer.domElement.addEventListener("touchstart", function (e) {
            if (e.touches.length !== 1) {
                return;
            }

            var scrollY =
                window.pageYOffset ||
                document.body.scrollTop ||
                document.documentElement.scrollTop;
            prevent = scrollY === 0;
        });

        this.renderer.domElement.addEventListener("touchmove", function (e) {
            if (prevent) {
                prevent = false;
                e.preventDefault();
            }
        });
    }

    setCursor(cursor: string) {
        // Use default browser cursor instead of custom cursor
        if (cursor === "none") {
            document.body.style.cursor = "default";
        } else if (cursor === "eye") {
            document.body.style.cursor = "pointer";
        } else if (cursor === "cross") {
            document.body.style.cursor = "default";
        } else if (cursor === "move") {
            document.body.style.cursor = "move";
        } else {
            document.body.style.cursor = cursor;
        }
    }

    getCursor(): string | undefined {
        if (this.dom.cursor) {
            return (this.dom.cursor as HTMLElement).dataset.cursor;
        }
        return undefined;
    }

    easterEgg() {
        if (!this.timelineEntered) return;

        console.log("CHEATER!");

        this.easterEggEnabled = true;

        gsap.to(this.timeline.rotation, {
            duration: 2,
            z: (360 * Math.PI) / 180,
            ease: "power4.inOut",
        });

        this.discoColours();

        for (let i = 0; i < this.itemMeshes.length - 1; i++) {
            gsap.to(this.itemMeshes[i].rotation, {
                duration: 2,
                z: (360 * Math.PI) / 180,
                ease: "none",
                repeat: -1,
            });
        }

        gsap.to(this.sections["intro"].children[2].rotation, {
            duration: 2,
            z: (360 * Math.PI) / 180,
            ease: "none",
            repeat: -1,
        });

        for (let id in this.sections) {
            gsap.to(this.sections[id].children[0].position, {
                duration: 1,
                z: 150,
                repeat: -1,
                yoyo: true,
                ease: "none",
            });
        }
    }

    discoColours() {
        // rgb(15,252,75)
        // rgb(15,192,252)
        // rgb(252,15,192)
        // rgb(252,75,15)

        for (let id in this.items) {
            gsap.to(this.items[id].uniforms.gradientColor.value, {
                duration: 1,
                r: 0.9882352941,
                g: 0.2941176471,
                b: 0.05882352941,
                ease: "power4.out",
                onComplete: () => {
                    gsap.to(this.items[id].uniforms.gradientColor.value, {
                        duration: 1,
                        r: 0.9882352941,
                        g: 0.05882352941,
                        b: 0.7529411765,
                        ease: "power4.out",
                        onComplete: () => {
                            gsap.to(
                                this.items[id].uniforms.gradientColor.value,
                                {
                                    duration: 1,
                                    r: 0.05882352941,
                                    g: 0.7529411765,
                                    b: 0.9882352941,
                                    ease: "power4.out",
                                    onComplete: () => {
                                        gsap.to(
                                            this.items[id].uniforms
                                                .gradientColor.value,
                                            {
                                                duration: 1,
                                                r: 0.05882352941,
                                                g: 0.9882352941,
                                                b: 0.2941176471,
                                                ease: "power4.out",
                                            },
                                        );
                                    },
                                },
                            );
                        },
                    });
                },
            });
        }

        gsap.to(this.textMat.color, {
            duration: 1,
            r: 0.9882352941,
            g: 0.2941176471,
            b: 0.05882352941,
            ease: "power4.out",
            onComplete: () => {
                gsap.to(this.textMat.color, {
                    duration: 1,
                    r: 0.9882352941,
                    g: 0.05882352941,
                    b: 0.7529411765,
                    ease: "power4.out",
                    onComplete: () => {
                        gsap.to(this.textMat.color, {
                            duration: 1,
                            r: 0.05882352941,
                            g: 0.7529411765,
                            b: 0.9882352941,
                            ease: "power4.out",
                            onComplete: () => {
                                gsap.to(this.textMat.color, {
                                    duration: 1,
                                    r: 0.05882352941,
                                    g: 0.9882352941,
                                    b: 0.2941176471,
                                    ease: "power4.out",
                                });
                            },
                        });
                    },
                });
            },
        });

        if (this.scene.fog && this.scene.background) {
            gsap.to([this.scene.fog.color, this.scene.background], {
                duration: 1,
                r: 0.05882352941,
                g: 0.9882352941,
                b: 0.2941176471,
                ease: "power4.out",
                onComplete: () => {
                    if (this.scene.fog && this.scene.background) {
                        gsap.to([this.scene.fog.color, this.scene.background], {
                            duration: 1,
                            r: 0.05882352941,
                            g: 0.7529411765,
                            b: 0.9882352941,
                            ease: "power4.out",
                            onComplete: () => {
                                if (this.scene.fog && this.scene.background) {
                                    gsap.to(
                                        [
                                            this.scene.fog.color,
                                            this.scene.background,
                                        ],
                                        {
                                            duration: 1,
                                            r: 0.9882352941,
                                            g: 0.05882352941,
                                            b: 0.7529411765,
                                            ease: "power4.out",
                                            onComplete: () => {
                                                if (
                                                    this.scene.fog &&
                                                    this.scene.background
                                                ) {
                                                    gsap.to(
                                                        [
                                                            this.scene.fog
                                                                .color,
                                                            this.scene
                                                                .background,
                                                        ],
                                                        {
                                                            duration: 1,
                                                            r: 0.9882352941,
                                                            g: 0.2941176471,
                                                            b: 0.05882352941,
                                                            ease: "power4.out",
                                                            onComplete: () => {
                                                                this.discoColours();
                                                            },
                                                        },
                                                    );
                                                }
                                            },
                                        },
                                    );
                                }
                            },
                        });
                    }
                },
            });
        }
    }
}
