
// --- Cinematic Effects Manager (God Rays, Parallax, Bokehs) ---
class CinematicEffectsManager {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.godRaysOverlay = document.querySelector('.god-rays-overlay');
        this.blurredLeaves = {
            tl: document.getElementById('leaf-tl'),
            tr: document.getElementById('leaf-tr'),
            br: document.getElementById('leaf-br')
        };

        // Environmental elements
        this.firefliesContainer = document.getElementById('fireflies');
        this.dustContainer = document.getElementById('dust-motes');
        this.petalLayer = document.getElementById('petal-layer');
        this.vignette = document.querySelector('.vignette-overlay');

        // State holders
        this.fireflies = [];
        this.dustMotes = [];
        this.petalTimeout = null;

        // Petal spawn configuration
        this.maxPetals = 14;         // maximum petals on-screen
        this.initialPetalBurst = 6;  // spawn a small burst immediately to avoid empty first-frame
        // Runtime flag to prevent double-starting loops
        this.petalsRunning = false;

        this.init();
    }

    init() {
        // Setup mouse tracking for parallax
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Initialize subtle effects
        this.initFireflies();
        this.initDustMotes();
        // Petals are intentionally started only after the user clicks Start
        // (call this.cinemaEffectsManager.startPetalLoop() from StoryManager.startExperience())

        // Slight vignette fade-in for subtlety
        if (this.vignette) gsap.to(this.vignette, { opacity: 0.6, duration: 2, ease: 'power1.out' });
    }

    // Fireflies: twinkling, drifting orbs
    initFireflies() {
        if (!this.firefliesContainer) return;
        const count = 6; // 5-8 range
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'firefly';
            this.firefliesContainer.appendChild(el);
            this.fireflies.push(el);

            // Initial random position
            const startX = Math.random() * window.innerWidth;
            const startY = Math.random() * window.innerHeight;
            gsap.set(el, { x: startX, y: startY, opacity: 0.6, scale: 1 });

            // Twinkle (opacity pulse)
            gsap.to(el, {
                opacity: () => 0.2 + Math.random() * 0.9,
                duration: 0.8 + Math.random() * 1.8,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
                delay: Math.random() * 2
            });

            // Gentle wandering movement
            const drift = () => {
                gsap.to(el, {
                    x: '+= ' + (Math.random() * 300 - 150),
                    y: '+= ' + (Math.random() * 300 - 150),
                    duration: 6 + Math.random() * 8,
                    ease: 'sine.inOut',
                    onComplete: drift,
                    overwrite: 'auto'
                });
            };
            drift();
        }
    }

    // Dust motes: very small particles that brighten when inside god rays
    initDustMotes() {
        if (!this.dustContainer) return;
        const count = 30;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'dust-mote';
            this.dustContainer.appendChild(el);
            this.dustMotes.push(el);

            const startX = Math.random() * window.innerWidth;
            const startY = Math.random() * window.innerHeight;
            gsap.set(el, { x: startX, y: startY, opacity: 0.02 });

            // Slow float with random durations. Use onUpdate to check god ray intersection
            gsap.to(el, {
                x: '+= ' + (Math.random() * 300 - 150),
                y: '+= ' + (Math.random() * 200 - 100),
                duration: 12 + Math.random() * 18,
                ease: 'none',
                repeat: -1,
                yoyo: true,
                onUpdate: () => {
                    const rect = el.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    if (this.isInGodRay(cx, cy)) {
                        gsap.to(el, { opacity: 0.16, duration: 0.25, overwrite: 'auto' });
                    } else {
                        gsap.to(el, { opacity: 0.02, duration: 0.6, overwrite: 'auto' });
                    }
                }
            });
        }
    }

    // Approximate whether a screen point (x,y) is within the diagonal god rays band
    isInGodRay(x, y) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const nx = x / w;
        const ny = y / h;
        // For the 135deg diagonal beam, points where nx and ny are similar sit along the diagonal
        return Math.abs(nx - ny) < 0.08; // tweak threshold for width
    }

    // Falling petals: schedule and spawn frequent petals with an initial burst
    startPetalLoop() {
        if (this.petalsRunning) return; // already running
        this.petalsRunning = true;

        // Initial burst so the screen doesn't feel empty on start
        const burst = this.initialPetalBurst || 5;
        for (let i = 0; i < burst; i++) {
            this.spawnPetal();
        }

        const schedule = () => {
            const next = 800 + Math.random() * 1200; // 0.8 - 2.0s
            this.petalTimeout = setTimeout(() => {
                const spawnCount = Math.random() < 0.25 ? 2 : 1; // occasionally spawn doubles for density
                for (let i = 0; i < spawnCount; i++) this.spawnPetal();
                schedule();
            }, next);
        };
        schedule();
    }

    spawnPetal() {
        if (!this.petalLayer) return;

        // Prevent too many on-screen petals
        const current = this.petalLayer.children.length;
        if (this.maxPetals && current >= this.maxPetals) return;

        const petal = document.createElement('div');
        petal.className = 'petal';

        // Slightly vary the SVG size for depth
        const size = 28 + Math.random() * 28; // 28px - 56px
        const colorVariants = ['#f7a6b0', '#f8b3bd', '#f7c7d0'];
        const color = colorVariants[Math.floor(Math.random() * colorVariants.length)];

        petal.innerHTML = `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M32 4 C40 12, 56 24, 40 44 C24 64, 16 52, 12 36 C8 20, 24 8, 32 4 Z" fill="${color}"/></svg>`;
        this.petalLayer.appendChild(petal);

        const startX = Math.random() * 100; // percent across screen
        const startLeft = `${startX}%`;
        gsap.set(petal, { left: startLeft, top: -60, rotation: Math.random() * 60 - 30, opacity: 0.95, scale: 0.9 + Math.random() * 0.4 });

        // Slight variation for duration so petals don't all land together
        const duration = 4 + Math.random() * 6; // 4 - 10s
        const driftX = (Math.random() * 240 - 120);
        gsap.to(petal, {
            top: window.innerHeight + 80,
            left: `+=${driftX}`,
            rotation: `+=${(Math.random() * 360 - 180)}`,
            duration: duration,
            ease: 'power1.inOut',
            onComplete: () => { if (petal && petal.parentNode) petal.parentNode.removeChild(petal); }
        });
    }

    onMouseMove(event) {
        // Normalize mouse position to -1 to 1
        this.mouseX = (event.clientX / window.innerWidth) - 0.5;
        this.mouseY = (event.clientY / window.innerHeight) - 0.5;

        // Update god rays position (subtle opposite parallax)
        this.updateGodRaysParallax();

        // Update blurred leaves parallax (stronger effect)
        this.updateBlurredLeavesParallax();
    }

    updateGodRaysParallax() {
        if (!this.godRaysOverlay) return;

        // God rays move in opposite direction of mouse (creates depth illusion)
        const offsetX = -this.mouseX * 15; // Subtle 15px max offset
        const offsetY = -this.mouseY * 15;

        gsap.to(this.godRaysOverlay, {
            x: offsetX,
            y: offsetY,
            duration: 0.8,
            overwrite: 'auto'
        });
    }

    updateBlurredLeavesParallax() {
        // Each leaf has different parallax strength for depth effect
        const strengths = {
            tl: 40,  // Stronger parallax
            tr: 50,  // Strongest
            br: 35   // Medium
        };

        Object.keys(this.blurredLeaves).forEach(key => {
            const leaf = this.blurredLeaves[key];
            if (!leaf) return;

            const offsetX = this.mouseX * strengths[key];
            const offsetY = this.mouseY * strengths[key];

            gsap.to(leaf, {
                x: offsetX,
                y: offsetY,
                duration: 1,
                overwrite: 'auto'
            });
        });
    }

    destroy() {
        // Cleanup when scene changes
        document.removeEventListener('mousemove', (e) => this.onMouseMove(e));

        // Kill GSAP tweens for generated elements
        gsap.killTweensOf('.firefly');
        gsap.killTweensOf('.dust-mote');
        gsap.killTweensOf('.petal');

        // Clear any scheduled petal timeouts
        if (this.petalTimeout) {
            clearTimeout(this.petalTimeout);
            this.petalTimeout = null;
        }
        this.petalsRunning = false;

        // Remove DOM children
        if (this.firefliesContainer) this.firefliesContainer.innerHTML = '';
        if (this.dustContainer) this.dustContainer.innerHTML = '';
        if (this.petalLayer) this.petalLayer.innerHTML = '';
    }
}

// --- Story Manager ---
class StoryManager {
    constructor() {
        this.scenes = ['intro', 'memory', 'letter', 'finale'];
        this.currentSceneIndex = 0;
        this.audioContext = null;
        this.bgMusic = document.getElementById('bg-music');
        this.isMusicPlaying = false;
        this.cinemaEffectsManager = null;

        this.init();
    }

    init() {
        // Setup initial state
        this.showScene(this.scenes[0]);
        this.setupEventListeners();

        // Setup visualizer/background effects (Particles)
        this.initBackgroundVisuals();

        // Setup cinematic effects for intro scene
        this.cinemaEffectsManager = new CinematicEffectsManager();
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

        // Start petals after user clicked Start
        if (this.cinemaEffectsManager && typeof this.cinemaEffectsManager.startPetalLoop === 'function') {
            this.cinemaEffectsManager.startPetalLoop();
        }

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

        // Cleanup cinematic effects when leaving intro scene
        if (this.currentSceneIndex === 0 && this.cinemaEffectsManager) {
            this.cinemaEffectsManager.destroy();
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

        // Reinitialize cinematic effects if transitioning to intro
        if (sceneName === 'intro' && !this.cinemaEffectsManager) {
            this.cinemaEffectsManager = new CinematicEffectsManager();
        }

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
        if (this.isZoomedIn && this.currentFocusedMemory === memory) return; // Prevent double focusing same card

        // If another card is currently focused, return it first then focus this one
        if (this.isZoomedIn && this.currentFocusedMemory && this.currentFocusedMemory !== memory) {
            this.closeZoom(() => this.zoomIntoMemory(memory));
            return;
        }

        this.isZoomedIn = true;
        this.currentFocusedMemory = memory;

        // Do NOT pause floating — other cards should continue subtle motion

        // Target world position: center of screen at depth just in front of camera
        const targetWorld = new THREE.Vector3(0, 0, this.camera.position.z - 50);

        // Convert to local coordinates relative to the floatGroup
        const localTarget = this.floatGroup.worldToLocal(targetWorld.clone());

        // Animate the selected memory to the center position and reset rotation
        gsap.to(memory.position, {
            x: localTarget.x,
            y: localTarget.y,
            z: localTarget.z,
            duration: this.zoomDuration,
            ease: 'power2.inOut'
        });

        gsap.to(memory.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: this.zoomDuration,
            ease: 'power2.inOut'
        });

        // Bring focused card visually forward: full opacity + slight scale
        gsap.to(memory.material, { opacity: 1.0, duration: this.zoomDuration, ease: 'power2.inOut' });
        gsap.to(memory.scale, { x: 1.08, y: 1.08, z: 1.08, duration: this.zoomDuration, ease: 'power2.inOut' });

        // Dim other cards to create a subtle overlay effect without stopping their motion
        this.memories.forEach(mem => {
            if (mem !== memory) {
                if (mem.material) gsap.to(mem.material, { opacity: 0.22, duration: this.zoomDuration, ease: 'power2.inOut' });
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
        if (!this.isZoomedIn) {
            if (callback) callback();
            return;
        }

        this.isZoomedIn = false;

        // Get current focused card and reset its rotation/position
        const focusedCard = this.currentFocusedMemory;
        this.currentFocusedMemory = null;

        if (focusedCard) {
            // Restore position and rotation from userData
            const orig = focusedCard.userData.originalPos;
            const oriRot = focusedCard.userData.originalRot;

            gsap.to(focusedCard.position, {
                x: orig.x,
                y: orig.y,
                z: orig.z,
                duration: this.zoomDuration,
                ease: 'power2.inOut'
            });

            gsap.to(focusedCard.rotation, {
                x: oriRot.x,
                y: oriRot.y,
                z: oriRot.z,
                duration: this.zoomDuration,
                ease: 'power2.inOut'
            });

            gsap.to(focusedCard.scale, { x: 1, y: 1, z: 1, duration: this.zoomDuration, ease: 'power2.inOut' });
        }

        // Restore opacity of other cards
        this.memories.forEach(mem => {
            if (mem.material) gsap.to(mem.material, { opacity: 0.8, duration: this.zoomDuration, ease: 'power2.inOut' });
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

        // Call callback after restore completes
        if (callback) {
            setTimeout(() => callback(), (this.zoomDuration + 0.05) * 1000);
        }
    }

    // Create a glowing highlight plane slightly larger than the card and attach it behind the card
    createHighlightFor(memory) {
        if (!memory) return;

        // Avoid duplicate highlight
        if (memory.userData.highlight) return;

        // Derive geometry size from card if possible
        const geoW = (memory.geometry && memory.geometry.parameters && memory.geometry.parameters.width) ? memory.geometry.parameters.width : 25;
        const geoH = (memory.geometry && memory.geometry.parameters && memory.geometry.parameters.height) ? memory.geometry.parameters.height : 35;

        const plane = new THREE.PlaneGeometry(geoW * 1.1, geoH * 1.1);

        // Create a soft gradient texture using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
        grad.addColorStop(0, 'rgba(255, 200, 160, 0.95)'); // warm golden center
        grad.addColorStop(0.5, 'rgba(255, 140, 180, 0.45)'); // neon-pink mid
        grad.addColorStop(1, 'rgba(255, 140, 180, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;

        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });

        const mesh = new THREE.Mesh(plane, mat);
        mesh.position.copy(memory.position);
        mesh.position.z = memory.position.z - 1; // place slightly behind
        mesh.renderOrder = (memory.renderOrder || 0) - 1;

        mesh.scale.set(memory.scale.x * 1.08, memory.scale.y * 1.08, 1);

        this.floatGroup.add(mesh);
        memory.userData.highlight = mesh;

        // Animate highlight in (fade+scale)
        gsap.to(mat, { opacity: 1.0, duration: this.zoomDuration, ease: 'power2.inOut' });
        gsap.to(mesh.scale, { x: memory.scale.x * 1.12, y: memory.scale.y * 1.12, duration: this.zoomDuration, ease: 'power2.inOut' });
    }

    removeHighlightFor(memory) {
        if (!memory || !memory.userData.highlight) return;
        const mesh = memory.userData.highlight;
        if (mesh.material) {
            gsap.to(mesh.material, {
                opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => {
                    if (mesh.parent) mesh.parent.remove(mesh);
                    mesh.geometry.dispose();
                    if (mesh.material.map) mesh.material.map.dispose();
                    mesh.material.dispose();
                }
            });
        } else {
            if (mesh.parent) mesh.parent.remove(mesh);
        }
        memory.userData.highlight = null;
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
            // If this card is locked (focused or returning), skip floating updates to avoid snapping
            if (memory.userData && memory.userData.locked) {
                return; // do not override the animation in progress
            }

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

    // Calculate responsive dimensions
    const isSmallScreen = window.innerWidth < 768;
    const cardWidthBase = isSmallScreen ? 15 : 25;
    const cardHeightBase = isSmallScreen ? 21 : 35;
    const cardSpreadRange = isSmallScreen ? 250 : 400;
    const cardVerticalRange = isSmallScreen ? 120 : 200;
    const cardDepthRange = isSmallScreen ? 120 : 200;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add responsive resize listener
    const onWindowResize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
    };
    window.addEventListener('resize', onWindowResize);

    const floatGroup = new THREE.Group();
    scene.add(floatGroup);

    const textureLoader = new THREE.TextureLoader();
    const placeholderImages = ['img1.jpg', 'img2.jpg'];
    const textures = placeholderImages.map(url => textureLoader.load(url));

    const geometry = new THREE.PlaneGeometry(cardWidthBase, cardHeightBase);

    // Cards create with responsive sizing
    for (let i = 0; i < 40; i++) {
        const material = new THREE.MeshBasicMaterial({
            map: textures[i % textures.length],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            color: 0xaaaaaa // Start dim/gray to allow "glow" (brightening to white)
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            Math.random() * cardSpreadRange - (cardSpreadRange / 2),
            Math.random() * cardVerticalRange - (cardVerticalRange / 2),
            Math.random() * cardDepthRange - (cardDepthRange / 2)
        );
        mesh.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);

        // Custom data for animation
        mesh.userData = {
            originalPos: mesh.position.clone(),
            originalRot: mesh.rotation.clone(),
            phase: Math.random() * Math.PI * 2
        };

        floatGroup.add(mesh);
    }

    // Smooth Entry Transition (Explosion Element)
    // Start small and center, then stagger out
    floatGroup.children.forEach(mesh => {
        mesh.scale.set(0, 0, 0); // Start invisible/tiny
    });

    // Animate in
    gsap.to(floatGroup.children.map(m => m.scale), {
        x: 1, y: 1, z: 1,
        duration: 1.5,
        stagger: {
            amount: 1.0,
            from: "random"
        },
        ease: "back.out(1.7)"
    });

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Interaction Variables
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let isZoomed = false;
    let focusedObj = null;

    // Mouse Move for Hover & Parallax
    // Mouse Move for Hover & Parallax
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Hover Effect: Check both cloud and focused card
        const targets = [...floatGroup.children];
        if (focusedObj) targets.push(focusedObj);

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(targets);

        if (intersects.length > 0 && !isZoomed) {
            document.body.style.cursor = 'pointer';
            const target = intersects[0].object;
            gsap.to(target.scale, { x: 1.2, y: 1.2, duration: 0.3 });
            // Glow Effect: Brighten color
            if (target.material) gsap.to(target.material.color, { r: 1, g: 1, b: 1, duration: 0.3 });
        } else {
            document.body.style.cursor = 'default';
            // Scale and Color Reset
            floatGroup.children.forEach(child => {
                if (child !== focusedObj) {
                    gsap.to(child.scale, { x: 1, y: 1, duration: 0.3 });
                    if (child.material) gsap.to(child.material.color, { r: 0.66, g: 0.66, b: 0.66, duration: 0.3 }); // Reset to 0xaaaaaa
                }
            });
        }
    });

    // Click to Focus (Card-to-Center)
    window.addEventListener('click', () => {
        const targets = [...floatGroup.children];
        if (focusedObj) targets.push(focusedObj);

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(targets);

        if (intersects.length > 0) {
            const clicked = intersects[0].object;

            // If same card clicked while focused -> return it
            if (isZoomed && focusedObj === clicked) {
                returnToCloud();
                return;
            }

            // If another card is focused, return it first then focus new one
            if (isZoomed && focusedObj && focusedObj !== clicked) {
                returnToCloud();
                setTimeout(() => zoomIn(clicked), 1300);
                return;
            }

            // Otherwise focus clicked card
            if (!isZoomed) {
                zoomIn(clicked);
            }
        } else {
            // Clicked empty space: if focused, return to cloud
            if (isZoomed) returnToCloud();
        }
    });

    function zoomIn(obj) {
        if (!obj) return;
        isZoomed = true;
        focusedObj = obj;

        // Lock object so floating doesn't override the animation
        obj.userData.locked = true;

        // Create highlight plane behind the object
        createHighlightFor(obj);

        // Detach from rotating floatGroup and attach to stable Scene
        // This ensures world rotation (0,0,0) is truly straight relative to camera
        scene.attach(obj);

        // Target world position just in front of camera (Camera is at Z=250)
        // Since obj is now child of scene, we use global coords
        gsap.to(obj.position, {
            x: 0,
            y: 0,
            z: camera.position.z - 50,
            duration: 1.2,
            ease: 'power2.inOut'
        });

        // Strict Rotation Overwrite: Force 0,0,0 (World Space)
        gsap.to(obj.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.2,
            ease: 'power2.out',
            overwrite: true
        });

        gsap.to(obj.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 1.2, ease: 'power2.inOut' });

        // Dim other cards
        floatGroup.children.forEach(child => {
            if (child.material) gsap.to(child.material, { opacity: 0.25, duration: 1.2, ease: 'power2.inOut' });
        });
    }

    function createHighlightFor(obj) {
        if (!obj) return;
        if (obj.userData.highlight) return;

        const geoW = (obj.geometry && obj.geometry.parameters && obj.geometry.parameters.width) ? obj.geometry.parameters.width : 25;
        const geoH = (obj.geometry && obj.geometry.parameters && obj.geometry.parameters.height) ? obj.geometry.parameters.height : 35;

        // Premium Border: Slightly larger Plane
        const planeGeo = new THREE.PlaneGeometry(geoW * 1.2, geoH * 1.2);

        // Dynamic Texture for Glow
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
        grad.addColorStop(0, 'rgba(255,220,180,0.9)'); // Warm golden core
        grad.addColorStop(0.6, 'rgba(255,100,150,0.5)'); // Soft pink mid
        grad.addColorStop(1, 'rgba(255,100,150,0)'); // Fade out
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(canvas);

        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(planeGeo, mat);

        // Parent to the card so it follows automatically
        obj.add(mesh);
        mesh.position.set(0, 0, -1); // Local offset behind
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1.1, 1.1, 1);

        obj.userData.highlight = mesh;

        // Animation: Fade in and Scale up
        gsap.to(mat, { opacity: 1.0, duration: 1.2, ease: 'power2.inOut' });
        gsap.to(mesh.scale, { x: 1.2, y: 1.2, duration: 1.2, ease: 'power2.inOut' });
    }

    function removeHighlightFor(obj) {
        if (!obj || !obj.userData.highlight) return;
        const mesh = obj.userData.highlight;
        if (mesh.material) {
            gsap.to(mesh.material, {
                opacity: 0, duration: 0.4, ease: 'power2.out', onComplete: () => {
                    if (mesh.parent) mesh.parent.remove(mesh);
                    mesh.geometry.dispose();
                    if (mesh.material.map) mesh.material.map.dispose();
                    mesh.material.dispose();
                }
            });
        } else {
            if (mesh.parent) mesh.parent.remove(mesh);
        }
        obj.userData.highlight = null;
    }

    function returnToCloud() {
        if (!focusedObj) return;
        const obj = focusedObj;

        // Ensure locked during return
        obj.userData.locked = true;

        // Re-attach to floatGroup to restore coordinate system
        // 'attach' maintains the world transform, so visually it doesn't jump
        floatGroup.attach(obj);

        const orig = obj.userData.originalPos;
        const oriRot = obj.userData.originalRot;

        // Animate return to original LOCAL position within the group
        gsap.to(obj.position, {
            x: orig.x,
            y: orig.y,
            z: orig.z,
            duration: 1.2,
            ease: 'power2.inOut',
            onComplete: () => {
                // UNLOCK only after animation completes
                obj.userData.locked = false;

                // Reset state
                if (focusedObj === obj) {
                    focusedObj = null;
                    isZoomed = false;
                }
            }
        });

        gsap.to(obj.rotation, {
            x: oriRot.x,
            y: oriRot.y,
            z: oriRot.z,
            duration: 1.2,
            ease: 'power2.inOut'
        });

        gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'power2.inOut' });

        // Remove highlight
        removeHighlightFor(obj);

        // Restore opacities
        floatGroup.children.forEach(child => {
            if (child.material) gsap.to(child.material, { opacity: 0.8, duration: 1.2, ease: 'power2.inOut' });
        });
    }

    // --- 1. Starfield Logic ---
    function createStarfield() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const posArray = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 1500; // Spread wide
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const starMat = new THREE.PointsMaterial({
            size: 2,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            map: new THREE.TextureLoader().load('https://assets.codepen.io/16327/star.png'), // Optional simple star or circle
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const starMesh = new THREE.Points(starGeo, starMat);
        scene.add(starMesh);
        return starMesh;
    }
    const stars = createStarfield();

    // --- 2. Floating Dust Logic ---
    function createDust() {
        const dustGeo = new THREE.BufferGeometry();
        const dustCount = 100;
        const dustPos = new Float32Array(dustCount * 3);
        const dustSizes = new Float32Array(dustCount);

        for (let i = 0; i < dustCount; i++) {
            dustPos[i * 3] = (Math.random() - 0.5) * 800;
            dustPos[i * 3 + 1] = (Math.random() - 0.5) * 800;
            dustPos[i * 3 + 2] = (Math.random() - 0.5) * 800;
            dustSizes[i] = Math.random() * 3;
        }

        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

        const dustMat = new THREE.PointsMaterial({
            color: 0xffd700, // Gold dust
            size: 4,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const dustMesh = new THREE.Points(dustGeo, dustMat);
        scene.add(dustMesh);
        return { mesh: dustMesh, speeds: Array(dustCount).fill(0).map(() => Math.random() * 0.05 + 0.02) };
    }
    const dustSystem = createDust();

    const animate = () => {
        requestAnimationFrame(animate);

        // Starfield Parallax
        stars.rotation.y = mouse.x * 0.05;
        stars.rotation.x = -mouse.y * 0.05;

        // Dust Movement (Drift towards camera)
        const positions = dustSystem.mesh.geometry.attributes.position.array;
        for (let i = 0; i < 100; i++) {
            positions[i * 3 + 2] += dustSystem.speeds[i]; // Move Z towards camera
            if (positions[i * 3 + 2] > 300) positions[i * 3 + 2] = -500; // Reset loop
        }
        dustSystem.mesh.geometry.attributes.position.needsUpdate = true;
        dustSystem.mesh.rotation.y += 0.0005;

        if (!isZoomed) {
            // Natural Floating Movement
            floatGroup.children.forEach(obj => {
                // strict check: if obj is focused or locked, DO NOT TOUCH IT
                if (obj === focusedObj) return;
                if (obj.userData && obj.userData.locked) return;

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
    const envelopeFlap = document.querySelector('.envelope-flap');

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
        const tl = gsap.timeline({
            onComplete: () => {
                // Architectural switch to Reading Mode
                // Clear GSAP transforms to allow CSS .reading-mode class to take over 100%
                gsap.set(letterWrapper, { clearProps: "all" });
                letterWrapper.classList.add('reading-mode');

                isAnimating = false;
                startTypewriterEffect();
            }
        });

        // --- SEQUENCE START (State: Envelope Context) ---

        // 1. Initial State
        tl.set(envelopeFlap, { zIndex: 10 });
        tl.set(letterWrapper, {
            opacity: 0,
            visibility: 'visible',
            y: 0, // start inside
            scale: 0.8,
            zIndex: 5
        });

        // 2. Rotate Flap Open
        tl.to(envelopeFlap, {
            rotationX: 180,
            duration: 0.8,
            ease: 'power2.inOut'
        }, 0);

        // 3. Hide Decors
        tl.to(['.envelope-decoration', '.envelope-instruction'], {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                gsap.set(['.envelope-decoration', '.envelope-instruction'], { visibility: 'hidden' });
            }
        }, 0);

        // 4. Tuck Flap Behind
        tl.set(envelopeFlap, { zIndex: 1 }, 0.6);

        // 5. Letter Slide Up (Relative to Envelope)
        // We use a combination of opacity and translateY for standard "exiting" feel
        tl.to(letterWrapper, {
            opacity: 1,
            y: -150, // slide up out of pocket
            scale: 0.9,
            duration: 0.7,
            ease: 'power2.out',
            onStart: () => {
                envelope3D.classList.add('envelope-open');
            }
        }, 0.5);

        // 6. Final Reach to Viewport Center (While still absolute)
        // This is a "visual bridge" before the class switch.
        // We simulate the fixed center position.
        const vh = window.innerHeight;
        const rect = envelopeContainer.getBoundingClientRect();
        const distToCenter = (vh / 2) - (rect.top + rect.height / 2);

        tl.to(letterWrapper, {
            y: distToCenter, // move to screen center
            scale: 1,
            duration: 0.8,
            ease: 'power3.inOut'
        }, "+=0.1");
    });

    function startTypewriterEffect() {
        try {
            if (typeof Typed !== 'undefined') {
                new Typed('.text-content', {
                    strings: [
                        "Dearest,<br><br>Wishing you a day filled with laughter,<br>love, and starlight...<br><br>^500You are truly special not just today,<br>but every single day.<br><br>^500May this year bring you closer<br>to all your dreams.<br><br>^1000Happy Birthday!"
                    ],
                    typeSpeed: 40,
                    startDelay: 300,
                    showCursor: false, // EXPLICITLY DISABLED
                    onComplete: () => {
                        fadeInWishButton();
                    }
                });
            } else {
                // Fallback
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
    // 1. Trigger the SVG Cake Animation Manually with DELAY
    setTimeout(() => {
        const firstAnim = document.getElementById('bizcocho_1');
        if (firstAnim && typeof firstAnim.beginElement === 'function') {
            firstAnim.beginElement(); // This starts the chain reaction
        }
    }, 2000); // 2-second delay as requested

    // 2. Drop the candle AFTER the cake builds (approx 5 seconds later)
    setTimeout(() => {
        const candle = document.querySelector('.candle');
        if (candle) {
            candle.classList.add('drop-in'); // This triggers the CSS animation
        }
    }, 5000); // Increased from 3000 to 5000 to sync with cake delay

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
    let audioContext = null;
    let micStream = null;

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

        // --- Cleanup Microphone ---
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }

    candle.addEventListener('click', (e) => {
        e.stopPropagation();
        blowOutCandle();
    });

    // --- Microphone Blow Detection ---
    setTimeout(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    micStream = stream;
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    // Resume context if suspended (browser autoplay policy)
                    if (audioContext.state === 'suspended') {
                        audioContext.resume();
                    }

                    const analyser = audioContext.createAnalyser();
                    const microphone = audioContext.createMediaStreamSource(stream);
                    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                    analyser.smoothingTimeConstant = 0.8;
                    analyser.fftSize = 1024;

                    microphone.connect(analyser);
                    analyser.connect(javascriptNode);
                    javascriptNode.connect(audioContext.destination);

                    let blowTriggerCount = 0;

                    javascriptNode.onaudioprocess = function () {
                        if (blownOut) return; // Stop processing if already done

                        const array = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(array);

                        // Calculate volume only from higher frequencies (typical for blow/wind)
                        let blowValue = 0;
                        for (let i = 10; i < 30; i++) {
                            blowValue += array[i];
                        }

                        const averageBlow = blowValue / 20;

                        // FIX: Increased threshold to 75 to avoid instant blowout from background noise
                        if (averageBlow > 75) {
                            blowTriggerCount++;
                            // Require 5 consecutive frames of "blowing" to trigger (approx 0.1s)
                            if (blowTriggerCount > 5) {
                                console.log("Blow Detected! Level:", averageBlow);
                                blowOutCandle();
                            }
                        } else {
                            blowTriggerCount = 0; // Reset if silence/noise drops
                        }
                    };
                })
                .catch(err => {
                    console.log("Microphone access denied or not available. Fallback to click.", err);
                });
        }
    }, 4500); // Increased delay to 4.5s to ensure candle is ready
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
