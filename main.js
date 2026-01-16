
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


// --- Scene 2: Memory Cloud (Three.js) ---
function initMemoryScene() {
    const container = document.getElementById('scene-memory');
    if (!container) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 250; /* Moved back to see cloud */

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // CONTROLS (OrbitControls via CDN usually, but simple mouse drag is easier to implement raw if needed)
    // We will assume OrbitControls is available via CDN or implement simple rotation.
    // Let's implement simple mouse move rotation.
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.1;
        mouseY = (event.clientY - windowHalfY) * 0.1;
    });

    // OBJECTS (Cloud of Planes)
    const floatGroup = new THREE.Group();
    scene.add(floatGroup);

    // Use simple relative paths - ensure web server root is correct
    // If running from file:// protocol, this might fail due to CORS.
    // User should run via a local server (e.g., Live Server).
    const placeholderImages = [
        'img1.jpg',
        'img2.jpg',
        'img1.jpg',
        'img2.jpg'
    ];

    // Load textures with Debugging
    const textureLoader = new THREE.TextureLoader();
    const textures = [];

    placeholderImages.forEach(url => {
        textureLoader.load(url, (tex) => {
            textures.push(tex);
            // Re-render or update material if needed
        }, undefined, (err) => {
            console.error("FAILED to load texture:", url, err);
            // Fallback color logic handled in material if map is missing
        });
    });

    // Wait for textures or use placeholder color
    // Since load is async, we'll just push to array and handle missing textures in loop gracefully

    const geometry = new THREE.PlaneGeometry(20, 30); // Portrait aspect ratio

    const group = new THREE.Group();
    scene.add(group);

    // Initial planes
    for (let i = 0; i < 40; i++) {
        // We might not have textures loaded yet, but we can assign later or default
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff, // Default white
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        // HACK: Assign texture later or check if array has items
        // Since this runs once, let's use a delayed assignment in animate check or just use what we have?
        // Better: Use a placeholder and update.
        // For now, let's just cycle through what we expect to have.

        textureLoader.load(placeholderImages[i % 4], (tex) => {
            material.map = tex;
            material.needsUpdate = true;
            material.color.setHex(0xffffff); // Reset color to white so texture shows
        }, undefined, () => {
            material.color.setHex(Math.random() * 0xff3333); // Reddish fallback
        });

        const mesh = new THREE.Mesh(geometry, material);
        // ... positioning logic ...
        mesh.position.x = Math.random() * 200 - 100;
        mesh.position.y = Math.random() * 100 - 50;
        mesh.position.z = Math.random() * 200 - 100;

        mesh.rotation.x = Math.random() * 0.5;
        mesh.rotation.y = Math.random() * 0.5;
        mesh.rotation.z = Math.random() * 0.5;

        group.add(mesh);
    }

    // BALLOONS
    const balloonGeo = new THREE.SphereGeometry(10, 32, 32);
    const balloonMat = new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 });
    const balloon = new THREE.Mesh(balloonGeo, balloonMat);
    balloon.position.set(-80, 50, 50);
    scene.add(balloon);

    const light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(50, 50, 50);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // ANIMATION LOOP
    const animate = () => {
        requestAnimationFrame(animate);

        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        floatGroup.rotation.y += 0.002;

        // Float logic
        floatGroup.children.forEach(obj => {
            obj.position.add(obj.userData.velocity);

            // Bounds check
            if (Math.abs(obj.position.x) > 100) obj.userData.velocity.x *= -1;
            if (Math.abs(obj.position.y) > 60) obj.userData.velocity.y *= -1;
            if (Math.abs(obj.position.z) > 100) obj.userData.velocity.z *= -1;
        });

        renderer.render(scene, camera);
    };

    animate();

    // Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}


// --- Scene 3: Letter Logic ---
// --- Scene 3: Letter Logic ---
function initLetterInteraction() {
    // We target the CONTAINER to ensure clicks are captured anywhere
    const envelopeContainer = document.querySelector('.envelope-container');
    const envelope = document.querySelector('.envelope');
    const textContentEl = document.querySelector('.text-content');
    const originalTextHTML = textContentEl.innerHTML;

    textContentEl.innerHTML = ''; // Clear for Typed.js

    // Add listener to the CONTAINER
    envelopeContainer.addEventListener('click', function () {
        if (envelope.classList.contains('open')) return;

        envelope.classList.add('open');
        // Hide instruction
        const instruction = document.querySelector('.instruction');
        if (instruction) instruction.style.opacity = '0';

        // Start Typed.js after animation
        setTimeout(() => {
            try {
                if (typeof Typed !== 'undefined') {
                    new Typed('.text-content', {
                        strings: [
                            "Wishing you a day filled with laughter...",
                            "You are special not just today, but every day.",
                            "May this year bring you closer to your dreams.",
                            "Happy Birthday! ^1000"
                        ],
                        typeSpeed: 30,
                        backSpeed: 10,
                        showCursor: false,
                        onComplete: () => {
                            fadeInWishButton();
                        }
                    });
                } else {
                    textContentEl.innerHTML = originalTextHTML;
                    fadeInWishButton();
                }
            } catch (e) {
                textContentEl.innerHTML = originalTextHTML;
                fadeInWishButton();
            }
        }, 1000);
    });
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
