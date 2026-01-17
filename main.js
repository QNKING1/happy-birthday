
// --- Story Manager ---
class StoryManager {
    constructor() {
        this.scenes = ['intro', 'memory', 'letter', 'finale'];
        this.currentSceneIndex = 0;
        this.audioContext = null;
        this.bgMusic = document.getElementById('bg-music');
        this.isMusicPlaying = false;

        this.init();
    }

    init() {
        // Setup initial state
        this.showScene(this.scenes[0]);
        this.setupEventListeners();

        // Setup visualizer/background effects (Particles)
        this.initBackgroundVisuals();
    }

    setupEventListeners() {
        // Start Button (Intro)
        const startBtn = document.querySelector('.btn-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startExperience();
            });
        }

        // Scene Transition Buttons
        document.getElementById('to-memory-btn').addEventListener('click', () => {
            this.transitionTo('memory');
            // Init Three.js when entering memory scene to save performance
            if (!this.memorySceneInitialized) {
                initMemoryScene();
                this.memorySceneInitialized = true;
            }
        });

        document.getElementById('to-letter-btn').addEventListener('click', () => {
            this.transitionTo('letter');
            // Init Letter interactions
            if (!this.letterSceneInitialized) {
                initLetterInteraction();
                this.letterSceneInitialized = true;
            }
        });

        // Back button from letter scene to memory scene
        const backToMemoryBtn = document.getElementById('back-to-memory-btn');
        if (backToMemoryBtn) {
            backToMemoryBtn.addEventListener('click', () => {
                resetEnvelopeState();
                this.transitionTo('memory');
            });
        }

        const openLetterBtn = document.getElementById('open-letter-btn');
        if (openLetterBtn) {
            openLetterBtn.addEventListener('click', (e) => {
                // Envelope logic handled separately, but this triggers the flow
            });
        }

        // Envelope click also handled in specific logic section, 
        // but we need to listen for when reading is done.

        // Direct Listener for Make a Wish Button
        const wishBtn = document.getElementById('make-wish-btn');
        if (wishBtn) {
            wishBtn.addEventListener('click', (e) => {
                console.log("Direct Click: Make a Wish Clicked!");
                e.preventDefault();
                e.stopPropagation();

                this.transitionTo('finale');

                requestAnimationFrame(() => {
                    if (window.initFinale) window.initFinale();
                    else if (typeof initFinale === 'function') initFinale();
                });
            });
        }

        // Backup Delegation (in case of re-renders)
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('#make-wish-btn');
            if (btn && btn !== wishBtn) { // Avoid double fire if direct listener worked
                console.log("Delegation Click: Make a Wish Clicked!");
                e.preventDefault();
                e.stopPropagation();
                this.transitionTo('finale');
                requestAnimationFrame(() => {
                    if (window.initFinale) window.initFinale();
                    else if (typeof initFinale === 'function') initFinale();
                });
            }
        });

        // Music Toggle
        document.getElementById('music-toggle').addEventListener('click', () => {
            this.toggleMusic();
        });
    }

    startExperience() {
        // Init Audio Context for auto-play policy
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Play Music
        this.bgMusic.volume = 0.5;
        this.bgMusic.loop = true; // Setup loop implicitly if not set
        this.bgMusic.play().then(() => {
            this.isMusicPlaying = true;
            document.getElementById('music-icon').classList.remove('fa-volume-mute');
            document.getElementById('music-icon').classList.add('fa-volume-up');
        }).catch(e => console.log("Audio play failed:", e));

        // FAISAFE: Guaranteed button show after 8 seconds
        // Moved here so it runs INDEPENDENTLY of the animation success/failure
        setTimeout(() => {
            const nextBtn = document.getElementById('to-memory-btn');
            if (nextBtn) {
                console.log("Global Failsafe: Revealing next button");
                nextBtn.classList.add('visible');
                nextBtn.style.opacity = '1';
                nextBtn.style.pointerEvents = 'auto';
            }
        }, 8000);

        // Hide Start Button and Start Animation
        gsap.to('.happy', {
            opacity: 0, duration: 0.5, onComplete: () => {
                document.querySelector('.happy').style.display = 'none';

                // Start Flower Animation
                initFlowerAnimation(() => {
                    const nextBtn = document.getElementById('to-memory-btn');
                    if (nextBtn) nextBtn.classList.add('visible');
                });
            }
        });
    }

    transitionTo(sceneName) {
        const targetIndex = this.scenes.indexOf(sceneName);
        if (targetIndex === -1) return;

        // If leaving letter scene, reset envelope state
        if (this.currentSceneIndex === 2 && sceneName !== 'letter') {
            resetEnvelopeState();
        }

        // Hide ALL scenes to ensure clean state
        this.scenes.forEach(s => {
            const el = document.getElementById(`scene-${s}`);
            if (el) el.classList.remove('active');
        });

        // Show next
        const nextId = `scene-${sceneName}`;
        const nextEl = document.getElementById(nextId);
        if (nextEl) nextEl.classList.add('active');

        this.currentSceneIndex = targetIndex;
    }

    toggleMusic() {
        if (this.bgMusic.paused) {
            this.bgMusic.play();
            document.getElementById('music-icon').classList.remove('fa-volume-mute');
            document.getElementById('music-icon').classList.add('fa-volume-up');
        } else {
            this.bgMusic.pause();
            document.getElementById('music-icon').classList.remove('fa-volume-up');
            document.getElementById('music-icon').classList.add('fa-volume-mute');
        }
    }

    initBackgroundVisuals() {
        // Simple Canvas Particles for background
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 2 + 1,
                dx: (Math.random() - 0.5) * 0.5,
                dy: (Math.random() - 0.5) * 0.5,
                alpha: Math.random()
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';

            particles.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            requestAnimationFrame(animate);
        };
        animate();
    }

    showScene(sceneName) {
        this.scenes.forEach(s => {
            const el = document.getElementById(`scene-${s}`);
            if (s === sceneName) el.classList.add('active');
            else el.classList.remove('active');
        });
    }
}

// --- Scene 1: Flower Animation (Ported from script.js) ---
function initFlowerAnimation(onCompleteCallback) {
    // Note: Replaced Premium DrawSVG with Vanilla GSAP strokeDashoffset logic
    // gsap.registerPlugin(DrawSVGPlugin); 

    // Data Preparation
    const stems = document.querySelectorAll("path[id^='Stem']");
    const leaves = document.querySelectorAll("path[id^='Leaf']");
    const buds = document.querySelectorAll("g[id^='Bud']");
    const flowers = document.querySelectorAll("[id^='PinkFlowerGroup']");

    // Setup initial states
    // Stems: Prepare for stroke animation
    stems.forEach(el => {
        try {
            const len = el.getTotalLength();
            el.style.strokeDasharray = len;
            el.style.strokeDashoffset = len;
            el.style.opacity = '1';
            // We set opacity 1 here because we are hiding it via dashoffset
        } catch (e) {
            gsap.set(el, { opacity: 0 });
        }
    });

    // Leaves, Buds, Flowers: Scale from 0
    gsap.set(leaves, { scale: 0, opacity: 0, transformOrigin: "center" });
    gsap.set(buds, { scale: 0, opacity: 0, transformOrigin: "bottom center" });
    gsap.set(flowers, { scale: 0, opacity: 0, transformOrigin: "center bottom", rotation: -15 });

    const tl = gsap.timeline({
        onComplete: onCompleteCallback
    });

    // 1. Draw Stems (Manual Stroke Dash Animation)
    // We animate the 'strokeDashoffset' attribute/style to 0
    tl.to(stems, {
        strokeDashoffset: 0,
        duration: 2.5,
        stagger: { each: 0.05, from: "center" },
        ease: "power2.inOut"
    })
        // 2. Pop Leaves (Energetic pop)
        .to(leaves, {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            stagger: { each: 0.03, from: "random" },
            ease: "back.out(2)"
        }, "-=1.5")
        // 3. Bloom Buds & Flowers (Big finish)
        .to(buds, {
            scale: 1,
            opacity: 1,
            duration: 1,
            stagger: 0.05,
            ease: "elastic.out(1, 0.75)"
        }, "-=1.0")
        .to(flowers, {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 1.8,
            stagger: 0.1,
            ease: "elastic.out(1, 0.5)"
        }, "-=0.8");

    // Fallback: If no elements found (timeline empty), fire callback explicitly
    if (tl.duration() < 0.1) {
        if (onCompleteCallback) onCompleteCallback();
    }
}


// --- Enhanced Interactive Memory Manager (Raycasting, Zooming & Physics) ---
class InteractiveMemoryManager {
    constructor(scene, camera, floatGroup, memories) {
        this.scene = scene;
        this.camera = camera;
        this.floatGroup = floatGroup;
        this.memories = memories; // Array of memory plane meshes

        // State management
        this.isZoomedIn = false;
        this.currentFocusedMemory = null;
        this.originalCameraPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        this.floatingPaused = false;
        this.floatGroupRotationSpeed = 0.002; // Normal rotation speed
        this.floatGroupRotationSpeedPaused = 0.0001; // Paused rotation speed (very slow)

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.mousePos = { x: 0, y: 0 }; // For parallax effect

        // Hover state
        this.hoveredMemory = null;
        this.hoveredMemoryOriginalScale = null;
        this.hoveredMemoryOriginalEmissive = null;

        // Advanced floating physics
        this.floatTime = 0;
        this.floatingEnabled = true;
        this.cardPhysicsData = new Map(); // Store each card's physics data

        // Parallax settings
        this.parallaxStrength = 0.3; // How much fog/background moves (0-1)
        this.parallaxOriginalFogColor = this.scene.fog ? this.scene.fog.color.getHex() : 0x000000;

        // Configuration
        this.zoomDistance = 80; // Distance from card when zoomed in
        this.zoomDuration = 1.2; // GSAP animation duration (seconds)

        this.init();
    }

    init() {
        this.setupMouseListeners();
        this.setupCloseButton();
        this.setupKeyboardListeners();
    }

    setupMouseListeners() {
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('click', (event) => this.onMouseClick(event));
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isZoomedIn) {
                this.closeZoom();
            }
        });
    }

    setupCloseButton() {
        // Create close button UI
        if (!document.getElementById('memory-close-btn')) {
            const closeBtn = document.createElement('button');
            closeBtn.id = 'memory-close-btn';
            closeBtn.innerHTML = '<i class="fas fa-times"></i> Close';
            closeBtn.className = 'memory-close-btn';
            closeBtn.style.position = 'fixed';
            closeBtn.style.top = '20px';
            closeBtn.style.right = '20px';
            closeBtn.style.zIndex = '1000';
            closeBtn.style.padding = '10px 20px';
            closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            closeBtn.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            closeBtn.style.color = '#fff';
            closeBtn.style.borderRadius = '25px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.fontFamily = "'Outfit', sans-serif";
            closeBtn.style.fontSize = '14px';
            closeBtn.style.opacity = '0';
            closeBtn.style.pointerEvents = 'none';
            closeBtn.style.transition = 'all 0.3s ease';

            closeBtn.addEventListener('click', () => this.closeZoom());
            closeBtn.addEventListener('mouseenter', function () {
                this.style.background = 'rgba(255, 255, 255, 0.2)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            });
            closeBtn.addEventListener('mouseleave', function () {
                this.style.background = 'rgba(255, 255, 255, 0.1)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            });

            document.body.appendChild(closeBtn);
        }
    }

    onMouseMove(event) {
        // Update mouse position for raycasting
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Store mouse position for parallax effect (normalize to -1 to 1)
        this.mousePos.x = (event.clientX / window.innerWidth) - 0.5;
        this.mousePos.y = (event.clientY / window.innerHeight) - 0.5;

        // Perform raycasting for hover detection
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.memories);

        // Handle hover effects
        if (intersects.length > 0) {
            const hoveredMemory = intersects[0].object;

            if (this.hoveredMemory !== hoveredMemory) {
                // Reset previous hovered memory
                if (this.hoveredMemory && this.hoveredMemory !== this.currentFocusedMemory) {
                    gsap.to(this.hoveredMemory.scale, {
                        x: this.hoveredMemoryOriginalScale.x,
                        y: this.hoveredMemoryOriginalScale.y,
                        z: this.hoveredMemoryOriginalScale.z,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                    gsap.to(this.hoveredMemory.material, {
                        opacity: 0.8,
                        duration: 0.3
                    });

                    // Remove glow effect
                    if (this.hoveredMemory.material.emissive) {
                        gsap.to(this.hoveredMemory.material.emissive, {
                            r: this.hoveredMemoryOriginalEmissive.r,
                            g: this.hoveredMemoryOriginalEmissive.g,
                            b: this.hoveredMemoryOriginalEmissive.b,
                            duration: 0.3
                        });
                        this.hoveredMemory.material.needsUpdate = true;
                    }
                }

                // New hovered memory
                this.hoveredMemory = hoveredMemory;
                this.hoveredMemoryOriginalScale = { ...this.hoveredMemory.scale };

                // Store original emissive color
                this.hoveredMemoryOriginalEmissive = {
                    r: this.hoveredMemory.material.emissive.r,
                    g: this.hoveredMemory.material.emissive.g,
                    b: this.hoveredMemory.material.emissive.b
                };

                // Scale up and brighten on hover
                gsap.to(this.hoveredMemory.scale, {
                    x: 1.15,
                    y: 1.15,
                    z: 1.15,
                    duration: 0.3,
                    ease: 'back.out'
                });
                gsap.to(this.hoveredMemory.material, {
                    opacity: 1.0,
                    duration: 0.3
                });

                // Add subtle glow (emissive effect - white light)
                gsap.to(this.hoveredMemory.material.emissive, {
                    r: 0.35,
                    g: 0.35,
                    b: 0.35,
                    duration: 0.3
                });
                this.hoveredMemory.material.needsUpdate = true;

                // Update cursor
                document.body.style.cursor = 'pointer';
            }
        } else {
            // No intersection - reset hovered state
            if (this.hoveredMemory && this.hoveredMemory !== this.currentFocusedMemory) {
                gsap.to(this.hoveredMemory.scale, {
                    x: this.hoveredMemoryOriginalScale.x,
                    y: this.hoveredMemoryOriginalScale.y,
                    z: this.hoveredMemoryOriginalScale.z,
                    duration: 0.3,
                    ease: 'power2.out'
                });
                gsap.to(this.hoveredMemory.material, {
                    opacity: 0.8,
                    duration: 0.3
                });

                // Remove glow
                if (this.hoveredMemory.material.emissive && this.hoveredMemoryOriginalEmissive) {
                    gsap.to(this.hoveredMemory.material.emissive, {
                        r: this.hoveredMemoryOriginalEmissive.r,
                        g: this.hoveredMemoryOriginalEmissive.g,
                        b: this.hoveredMemoryOriginalEmissive.b,
                        duration: 0.3
                    });
                    this.hoveredMemory.material.needsUpdate = true;
                }
            }

            this.hoveredMemory = null;
            document.body.style.cursor = 'default';
        }
    }

    onMouseClick(event) {
        // Skip if clicking UI elements
        if (event.target.closest('.memory-ui') || event.target.closest('.memory-close-btn') ||
            event.target.closest('#memory-close-btn')) {
            return;
        }

        // Perform raycasting for click detection
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.memories);

        if (intersects.length > 0) {
            const clickedMemory = intersects[0].object;

            if (this.isZoomedIn && this.currentFocusedMemory === clickedMemory) {
                // Clicking focused card again closes it
                this.closeZoom();
            } else if (this.isZoomedIn && this.currentFocusedMemory !== clickedMemory) {
                // Transition to new card
                this.closeZoom(() => {
                    this.zoomIntoMemory(clickedMemory);
                });
            } else {
                // Initial zoom
                this.zoomIntoMemory(clickedMemory);
            }
        }
    }

    zoomIntoMemory(memory) {
        if (this.isZoomedIn) return; // Prevent multiple zooms

        this.isZoomedIn = true;
        this.currentFocusedMemory = memory;

        // Pause floating animation
        this.floatingPaused = true;

        // Get card world position
        const cardPosition = new THREE.Vector3();
        memory.getWorldPosition(cardPosition);

        // Calculate camera position looking at card
        const direction = new THREE.Vector3();
        direction.subVectors(cardPosition, this.camera.position).normalize();
        const cameraTargetPos = new THREE.Vector3();
        cameraTargetPos.subVectors(cardPosition, direction.multiplyScalar(this.zoomDistance));

        // Rotate card to face camera perfectly (flatten rotation)
        const cardTargetRotation = {
            x: 0,
            y: 0,
            z: 0
        };

        // Animate card rotation for perfect alignment
        gsap.to(memory.rotation, {
            x: cardTargetRotation.x,
            y: cardTargetRotation.y,
            z: cardTargetRotation.z,
            duration: this.zoomDuration,
            ease: 'power2.inOut'
        });

        // Animate camera with GSAP
        gsap.to(this.camera.position, {
            x: cameraTargetPos.x,
            y: cameraTargetPos.y,
            z: cameraTargetPos.z,
            duration: this.zoomDuration,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.lookAt(cardPosition);
            }
        });

        // Show close button
        const closeBtn = document.getElementById('memory-close-btn');
        if (closeBtn) {
            gsap.to(closeBtn, {
                opacity: 1,
                pointerEvents: 'auto',
                duration: 0.5,
                delay: 0.3
            });
        }
    }

    closeZoom(callback) {
        if (!this.isZoomedIn) return;

        this.isZoomedIn = false;

        // Resume floating animation
        this.floatingPaused = false;

        // Get current focused card and reset its rotation
        const focusedCard = this.currentFocusedMemory;
        this.currentFocusedMemory = null;

        // Animate card back to random rotation (resume floating rotation)
        if (focusedCard) {
            gsap.to(focusedCard.rotation, {
                x: Math.random() * 0.5 - 0.25,
                y: Math.random() * 0.5 - 0.25,
                z: Math.random() * 0.5 - 0.25,
                duration: this.zoomDuration,
                ease: 'power2.inOut'
            });
        }

        // Animate camera back to original position
        gsap.to(this.camera.position, {
            x: this.originalCameraPos.x,
            y: this.originalCameraPos.y,
            z: this.originalCameraPos.z,
            duration: this.zoomDuration,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.camera.lookAt(this.scene.position);
            },
            onComplete: () => {
                if (callback) callback();
            }
        });

        // Hide close button
        const closeBtn = document.getElementById('memory-close-btn');
        if (closeBtn) {
            gsap.to(closeBtn, {
                opacity: 0,
                pointerEvents: 'none',
                duration: 0.3
            });
        }
    }

    // Modularity: Adjust zoom distance
    setZoomDistance(distance) {
        this.zoomDistance = distance;
    }

    // Modularity: Adjust animation speed
    setZoomDuration(duration) {
        this.zoomDuration = duration;
    }

    // Advanced floating physics - improved smooth motion
    updateFloatingPhysics() {
        // Increment time for sine-wave based floating
        this.floatTime += 0.001;

        // If paused, slow rotation significantly (keep some subtle motion)
        const rotationSpeed = this.floatingPaused ? this.floatGroupRotationSpeedPaused : this.floatGroupRotationSpeed;

        // Update each memory card with smooth sine-wave floating motion
        this.memories.forEach((memory, index) => {
            // Create unique physics data if not exists
            if (!this.cardPhysicsData.has(index)) {
                this.cardPhysicsData.set(index, {
                    amplitude: 0.3 + Math.random() * 0.2,
                    frequency: 0.5 + Math.random() * 0.3,
                    phase: Math.random() * Math.PI * 2,
                    axisX: Math.random() - 0.5,
                    axisY: Math.random() - 0.5,
                    axisZ: Math.random() - 0.5
                });
            }

            const physics = this.cardPhysicsData.get(index);

            // Calculate sine-wave based motion for smooth floating
            const floatingMotion = Math.sin(this.floatTime * physics.frequency + physics.phase) * physics.amplitude;

            // Apply subtle rotation
            memory.rotation.x += rotationSpeed * physics.axisX * (this.floatingPaused ? 0.3 : 1);
            memory.rotation.y += rotationSpeed * physics.axisY * (this.floatingPaused ? 0.3 : 1);
            memory.rotation.z += rotationSpeed * physics.axisZ * (this.floatingPaused ? 0.3 : 1);

            // Store original position if not stored
            if (!memory.userData.originalPos) {
                memory.userData.originalPos = {
                    x: memory.position.x,
                    y: memory.position.y,
                    z: memory.position.z
                };
            }

            // Apply floating motion to position
            memory.position.y = memory.userData.originalPos.y + floatingMotion;
        });
    }

    // Parallax effect - camera/fog responds to mouse position
    updateParallaxEffect(camera, fog) {
        if (this.isZoomedIn) return; // Disable parallax when zoomed in

        // Calculate parallax offset based on mouse position
        const parallaxOffsetX = this.mousePos.x * this.parallaxStrength * 5;
        const parallaxOffsetY = -this.mousePos.y * this.parallaxStrength * 5;

        // Smoothly animate camera offset for parallax
        gsap.to(camera.position, {
            x: parallaxOffsetX,
            y: parallaxOffsetY,
            duration: 0.5,
            overwrite: 'auto'
        });

        // Optional: Apply subtle fog color change based on mouse (immersive effect)
        // This creates a depth-based color shift
        const fogTint = 0.15 + this.mousePos.x * 0.1;
        if (fog) {
            // Fog color responds subtly to mouse position
            fog.color.setHSL(0, 0, Math.max(0, Math.min(1, fogTint)));
        }
    }

    // Initialize physics data for all memory cards
    initializeCardPhysics(memories) {
        memories.forEach((memory, index) => {
            // Pre-initialize physics data for smooth startup
            this.cardPhysicsData.set(index, {
                amplitude: 0.3 + Math.random() * 0.2,
                frequency: 0.5 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                axisX: Math.random() - 0.5,
                axisY: Math.random() - 0.5,
                axisZ: Math.random() - 0.5
            });

            // Store original position
            memory.userData.originalPos = {
                x: memory.position.x,
                y: memory.position.y,
                z: memory.position.z
            };
        });
    }

    // Cleanup on scene change
    destroy() {
        document.removeEventListener('mousemove', (event) => this.onMouseMove(event));
        document.removeEventListener('click', (event) => this.onMouseClick(event));
        document.removeEventListener('keydown', (event) => this.onMouseMove(event));
    }
}


// --- Scene 2: Memory Cloud (Three.js) ---
function initMemoryScene() {
    const container = document.getElementById('scene-memory');
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const floatGroup = new THREE.Group();
    scene.add(floatGroup);

    const textureLoader = new THREE.TextureLoader();
    const placeholderImages = ['img1.jpg', 'img2.jpg'];
    const textures = placeholderImages.map(url => textureLoader.load(url));

    const geometry = new THREE.PlaneGeometry(25, 35);

    // Cards create karna
    for (let i = 0; i < 40; i++) {
        const material = new THREE.MeshBasicMaterial({
            map: textures[i % textures.length],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            color: 0xffffff
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(Math.random() * 400 - 200, Math.random() * 200 - 100, Math.random() * 200 - 100);
        mesh.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);

        // Custom data for animation
        mesh.userData = {
            originalPos: mesh.position.clone(),
            originalRot: mesh.rotation.clone(),
            phase: Math.random() * Math.PI * 2
        };

        floatGroup.add(mesh);
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Interaction Variables
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let isZoomed = false;
    let focusedObj = null;

    // Mouse Move for Hover & Parallax
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Hover Effect
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(floatGroup.children);

        if (intersects.length > 0 && !isZoomed) {
            document.body.style.cursor = 'pointer';
            gsap.to(intersects[0].object.scale, { x: 1.2, y: 1.2, duration: 0.3 });
        } else {
            document.body.style.cursor = 'default';
            floatGroup.children.forEach(child => {
                if (child !== focusedObj) gsap.to(child.scale, { x: 1, y: 1, duration: 0.3 });
            });
        }
    });

    // Click to Zoom
    window.addEventListener('click', () => {
        if (isZoomed) {
            returnToCloud();
            return;
        }

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(floatGroup.children);

        if (intersects.length > 0) {
            focusedObj = intersects[0].object;
            zoomIn(focusedObj);
        }
    });

    function zoomIn(obj) {
        isZoomed = true;
        // Move camera in front of card
        const targetPos = obj.position.clone().add(new THREE.Vector3(0, 0, 50));

        gsap.to(camera.position, {
            x: obj.position.x,
            y: obj.position.y,
            z: obj.position.z + 60,
            duration: 1.5,
            ease: "power2.inOut"
        });

        gsap.to(obj.rotation, { x: 0, y: 0, z: 0, duration: 1 });
        // Show Close Button (Optional: aap HTML mein button dikha sakte hain)
    }

    function returnToCloud() {
        isZoomed = false;
        gsap.to(camera.position, { x: 0, y: 0, z: 250, duration: 1.5, ease: "power2.inOut" });
        if (focusedObj) {
            gsap.to(focusedObj.rotation, {
                x: focusedObj.userData.originalRot.x,
                y: focusedObj.userData.originalRot.y,
                z: focusedObj.userData.originalRot.z,
                duration: 1
            });
        }
        focusedObj = null;
    }

    const animate = () => {
        requestAnimationFrame(animate);

        if (!isZoomed) {
            // Natural Floating Movement
            floatGroup.children.forEach(obj => {
                const time = Date.now() * 0.001;
                obj.position.y = obj.userData.originalPos.y + Math.sin(time + obj.userData.phase) * 5;
            });
            floatGroup.rotation.y += 0.001;
        }

        renderer.render(scene, camera);
    };

    animate();
}


// --- Scene 3: Letter Logic (Enhanced 3D with GSAP) ---
function initLetterInteraction() {
    const envelopeContainer = document.querySelector('.envelope-container');
    const envelope3D = document.querySelector('.envelope-3d');
    const letterWrapper = document.querySelector('.letter-wrapper');
    const textContentEl = document.querySelector('.text-content');
    const instructionEl = document.querySelector('.envelope-instruction');
    const makeWishBtn = document.getElementById('make-wish-btn');

    let isAnimating = false;
    let isOpen = false;

    // Clear text content for Typed.js
    textContentEl.innerHTML = '';

    // Add click listener to envelope
    envelopeContainer.addEventListener('click', function () {
        if (isOpen || isAnimating) return;

        isAnimating = true;
        isOpen = true;

        // Create GSAP timeline for smooth sequential animations
        const tl = gsap.timeline();

        // Step 1: Flip the envelope flap open (0.7s)
        tl.to('.envelope-flap', {
            rotationX: 180,
            duration: 0.7,
            ease: 'power2.out'
        }, 0);

        // Step 2: Hide the envelope decoration heart during flip
        tl.to('.envelope-decoration', {
            opacity: 0,
            duration: 0.3
        }, 0);

        // Step 3: Hide the instruction text
        tl.to('.envelope-instruction', {
            opacity: 0,
            visibility: 'hidden',
            duration: 0.3
        }, 0);

        // Step 4: Slide and expand the letter from inside the envelope (starts at 0.5s, overlaps with flap)
        tl.to('.letter-wrapper', {
            opacity: 1,
            visibility: 'visible',
            transform: 'translate(-50%, -50%) scale(1) translateY(0px)',
            duration: 0.8,
            ease: 'back.out(1.2)',
            onStart: () => {
                letterWrapper.classList.add('letter-visible');
            }
        }, 0.2); // Start after brief delay to let flap start opening

        // Step 5: Apply class to envelope for styling
        tl.add(() => {
            envelope3D.classList.add('envelope-open');
        }, 0);

        // Step 6: Start typewriter effect after letter is fully visible (at 1.2s)
        tl.add(() => {
            startTypewriterEffect();
        }, 1.2);

        tl.eventCallback('complete', () => {
            isAnimating = false;
        });
    });

    function startTypewriterEffect() {
        try {
            if (typeof Typed !== 'undefined') {
                new Typed('.text-content', {
                    strings: [
                        "Wishing you a day filled with laughter, love, and starlight...",
                        "You are truly special not just today, but every single day.",
                        "May this year bring you closer to all your dreams.",
                        "Happy Birthday! ^1000"
                    ],
                    typeSpeed: 25,
                    backSpeed: 5,
                    backDelay: 1500,
                    showCursor: true,
                    cursorChar: "✦",
                    onComplete: () => {
                        fadeInWishButton();
                    }
                });
            } else {
                textContentEl.innerHTML = 'Wishing you a day filled with laughter, love, and starlight!<br>You are truly special not just today, but every single day.';
                fadeInWishButton();
            }
        } catch (e) {
            console.error('Typed.js error:', e);
            textContentEl.innerHTML = 'Wishing you a day filled with laughter, love, and starlight!<br>You are truly special not just today, but every single day.';
            fadeInWishButton();
        }
    }
}

function fadeInWishButton() {
    gsap.to('#make-wish-btn', {
        display: 'inline-block',
        opacity: 1,
        duration: 1,
        delay: 0.5,
        onStart: () => {
            const btn = document.getElementById('make-wish-btn');
            btn.style.display = 'inline-block';
            btn.style.pointerEvents = 'auto'; // Ensure clickable
        }
    });
}

// Reset envelope state when transitioning away
function resetEnvelopeState() {
    const envelope3D = document.querySelector('.envelope-3d');
    const letterWrapper = document.querySelector('.letter-wrapper');
    const envelopeFlap = document.querySelector('.envelope-flap');
    const textContent = document.querySelector('.text-content');
    const envelopeDecoration = document.querySelector('.envelope-decoration');
    const envelopeInstruction = document.querySelector('.envelope-instruction');

    // Kill any running GSAP animations on these elements
    gsap.killTweensOf('.envelope-3d');
    gsap.killTweensOf('.envelope-flap');
    gsap.killTweensOf('.letter-wrapper');
    gsap.killTweensOf('.envelope-decoration');
    gsap.killTweensOf('.envelope-instruction');

    // Reset classes
    if (envelope3D) envelope3D.classList.remove('envelope-open');
    if (letterWrapper) letterWrapper.classList.remove('letter-visible');

    // Reset inline styles
    if (envelopeFlap) {
        envelopeFlap.style.transform = '';
        envelopeFlap.style.zIndex = '';
    }
    if (letterWrapper) {
        letterWrapper.style.opacity = '';
        letterWrapper.style.visibility = '';
        letterWrapper.style.transform = '';
        letterWrapper.style.pointerEvents = '';
    }
    if (envelopeDecoration) {
        envelopeDecoration.style.opacity = '';
    }
    if (envelopeInstruction) {
        envelopeInstruction.style.opacity = '';
        envelopeInstruction.style.visibility = '';
    }

    // Clear text content
    if (textContent) {
        textContent.innerHTML = '';
    }

    // Kill Typed.js instance if it exists
    if (window.Typed && window.Typed.instances) {
        window.Typed.instances.forEach(instance => instance.destroy());
    }

    // Reset button
    const makeWishBtn = document.getElementById('make-wish-btn');
    if (makeWishBtn) {
        makeWishBtn.style.opacity = '0';
        makeWishBtn.style.display = 'none';
        makeWishBtn.style.pointerEvents = 'none';
    }
}


// --- Scene 4: Cake & Finale ---
// --- Scene 4: Cake & Finale ---
function initFinale() {
    if (window.finaleInitialized) return;
    window.finaleInitialized = true;
    console.log("initFinale START");

    // 1. Trigger the SVG Cake Animation Manually
    const firstAnim = document.getElementById('bizcocho_1');
    if (firstAnim && typeof firstAnim.beginElement === 'function') {
        firstAnim.beginElement(); // This starts the chain reaction
    }

    // 2. Drop the candle AFTER the cake builds (approx 3 seconds later)
    setTimeout(() => {
        const candle = document.querySelector('.candle');
        if (candle) {
            candle.classList.add('drop-in'); // This triggers the CSS animation
        }
    }, 3000);

    // --- Existing Candle Blow Logic Below ---
    const approaches = ['.candle', '.cake-container .candle'];
    let candle = null;
    for (let sel of approaches) {
        candle = document.querySelector(sel);
        if (candle) break;
    }

    if (!candle) return;
    candle.style.pointerEvents = 'auto';
    candle.style.cursor = 'pointer';

    // Instruction Overlay
    if (!document.querySelector('.candle-instruction')) {
        const instr = document.createElement('div');
        instr.className = 'candle-instruction';
        instr.innerText = "Make a wish and blow out the candle!";
        instr.style.position = 'absolute';
        instr.style.top = '15%';
        instr.style.width = '100%';
        instr.style.textAlign = 'center';
        instr.style.color = '#fff';
        instr.style.fontFamily = "'Amethysta', serif";
        instr.style.fontSize = '1.5rem';
        instr.style.opacity = '0';
        instr.style.transition = 'opacity 1s';
        instr.style.pointerEvents = 'none';
        document.getElementById('scene-finale').appendChild(instr);
        setTimeout(() => { instr.style.opacity = '0.8'; }, 1000);
    }

    let blownOut = false;

    function blowOutCandle() {
        if (blownOut) return;
        blownOut = true;
        candle.classList.add('out');
        gsap.to('#scene-finale', { backgroundColor: '#000', duration: 1 });

        // Hide instruction
        const instr = document.querySelector('.candle-instruction');
        if (instr) instr.style.opacity = '0';

        // Confetti logic...
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        setTimeout(() => {
            const finalText = document.querySelector('.finale-text');
            if (finalText) finalText.classList.add('visible');
        }, 1000);
    }

    candle.addEventListener('click', (e) => {
        e.stopPropagation();
        blowOutCandle();
    });
}


// --- BOOTSTRAP ---
window.initFinale = initFinale; // Expose for button interactions

window.addEventListener('load', () => {
    // Expose manager to window for debugging or easy access
    window.storyApp = new StoryManager();

    // Init scene specific listeners immediately (so they are ready when transitioned)
    initLetterInteraction();
    // initFinale(); // <-- Removed: We only want this when the scene starts
});
