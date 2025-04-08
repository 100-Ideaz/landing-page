// Modern JavaScript with Three.js implementation

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const logo = document.querySelector('.logo');
    const tagline = document.querySelector('.tagline');
    const typedElement = document.querySelector('.typed-text');
    const themeToggle = document.querySelector('.theme-toggle');
    const links = document.querySelectorAll('.link-item');
    
    // Set up GSAP animations
    gsap.registerPlugin(ScrollTrigger);
    
    // Typing animation for tagline - fixed implementation
    if (typedElement) {
        const textToType = "one-person studio building cool iOS, macOS, and visionOS apps";
        let i = 0;
        
        function typeText() {
            if (i < textToType.length) {
                typedElement.innerHTML += textToType.charAt(i);
                i++;
                setTimeout(typeText, Math.random() * 50 + 30); // Random delay for realistic typing
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeText, 800);
    }
    
    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('three-container').appendChild(renderer.domElement);
    
    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    
    const positionArray = new Float32Array(particlesCount * 3);
    const scaleArray = new Float32Array(particlesCount);
    
    // Fill position and scale arrays
    for (let i = 0; i < particlesCount * 3; i++) {
        // Position (x, y, z)
        positionArray[i] = (Math.random() - 0.5) * 10;
        
        // Set scale for each particle (every 3rd value)
        if (i % 3 === 0) {
            scaleArray[i / 3] = Math.random();
        }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));
    
    // Create particle material
    const particlesMaterial = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uSize: { value: 8 * renderer.getPixelRatio() },
            uColor1: { value: new THREE.Color(0x9d4edd) }, // Primary color
            uColor2: { value: new THREE.Color(0xff8906) }, // Accent color
        },
        vertexShader: `
            uniform float uTime;
            uniform float uSize;
            attribute float aScale;
            
            varying float vDistance;
            
            void main() {
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                
                // Add some movement
                float speed = 0.2;
                float angle = uTime * speed;
                float radius = 0.25;
                
                modelPosition.x += sin(modelPosition.y * 0.3 + angle) * radius;
                modelPosition.z += cos(modelPosition.y * 0.3 + angle) * radius;
                
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;
                
                gl_Position = projectedPosition;
                
                // Calculate point size based on distance and attribute
                vDistance = length(position) * 0.25;
                gl_PointSize = uSize * aScale * (1.0 / -viewPosition.z);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            
            varying float vDistance;
            
            void main() {
                // Calculate distance from center of point
                float strength = distance(gl_PointCoord, vec2(0.5));
                strength = 1.0 - strength;
                strength = pow(strength, 3.0);
                
                // Mix colors based on distance
                vec3 color = mix(uColor1, uColor2, vDistance);
                
                gl_FragColor = vec4(color, strength);
            }
        `
    });
    
    // Create particle system
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Create stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 200;
    
    const starPositions = new Float32Array(starCount * 3);
    const starScales = new Float32Array(starCount);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        // Position stars further away
        starPositions[i] = (Math.random() - 0.5) * 15;
        starPositions[i + 1] = (Math.random() - 0.5) * 15;
        starPositions[i + 2] = (Math.random() - 0.5) * 15 - 5; // Push back
        
        starScales[i / 3] = Math.random() * 2 + 1;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('aScale', new THREE.BufferAttribute(starScales, 1));
    
    const starMaterial = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uSize: { value: 15 * renderer.getPixelRatio() }
        },
        vertexShader: `
            uniform float uTime;
            uniform float uSize;
            attribute float aScale;
            
            void main() {
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;
                
                gl_Position = projectedPosition;
                
                // Pulsating size based on time and position
                float pulse = sin(uTime * 0.3 + position.x * 100.0) * 0.5 + 0.5;
                gl_PointSize = uSize * aScale * (0.8 + pulse * 0.4) * (1.0 / -viewPosition.z);
            }
        `,
        fragmentShader: `
            void main() {
                // Create a shining star shape
                float strength = distance(gl_PointCoord, vec2(0.5));
                strength = 1.0 - strength;
                strength = pow(strength, 3.0);
                
                // Blue-ish white color
                vec3 color = mix(vec3(0.7, 0.8, 1.0), vec3(1.0), strength);
                
                gl_FragColor = vec4(color, strength);
            }
        `
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Position camera
    camera.position.z = 5;
    
    // Mouse tracking for interactive effects
    const mouse = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        speed: 0.1
    };
    
    // Detect if device is likely mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // If mobile, adjust particle count for better performance
    if (isMobile) {
        // Reduce particle count by 60% on mobile for better performance
        const newParticlesCount = Math.floor(particlesCount * 0.4);
        const positions = particlesGeometry.attributes.position.array;
        const scales = particlesGeometry.attributes.aScale.array;
        
        // Only use a subset of the particles
        const newPositions = new Float32Array(newParticlesCount * 3);
        const newScales = new Float32Array(newParticlesCount);
        
        for (let i = 0; i < newParticlesCount * 3; i++) {
            newPositions[i] = positions[i];
            if (i % 3 === 0) {
                newScales[i / 3] = scales[i / 3];
            }
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
        particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(newScales, 1));
        
        // Also reduce star count
        const newStarCount = Math.floor(starCount * 0.6);
        const starPositions = starGeometry.attributes.position.array;
        const starScales = starGeometry.attributes.aScale.array;
        
        const newStarPositions = new Float32Array(newStarCount * 3);
        const newStarScales = new Float32Array(newStarCount);
        
        for (let i = 0; i < newStarCount * 3; i++) {
            newStarPositions[i] = starPositions[i];
            if (i % 3 === 0) {
                newStarScales[i / 3] = starScales[i / 3];
            }
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(newStarPositions, 3));
        starGeometry.setAttribute('aScale', new THREE.BufferAttribute(newStarScales, 1));
        
        // Adjust camera distance for mobile
        camera.position.z = 6;
    }
    
    // Mouse movement event
    document.addEventListener('mousemove', (event) => {
        // Normalize coordinates to be between -1 and 1
        mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
        mouse.targetY = -(event.clientY / window.innerHeight - 0.5) * 2;
    });
    
    // Touch events for mobile
    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            // Prevent scrolling while interacting with the 3D scene
            event.preventDefault();
            
            mouse.targetX = (event.touches[0].clientX / window.innerWidth - 0.5) * 2;
            mouse.targetY = -(event.touches[0].clientY / window.innerHeight - 0.5) * 2;
        }
    }, { passive: false });
    
    // Reset on touch end
    document.addEventListener('touchend', () => {
        // Gradually return to center
        gsap.to(mouse, {
            targetX: 0,
            targetY: 0,
            duration: 1.5,
            ease: "power2.out"
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Update sizes
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    
    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-mode');
            
            // Change icon based on theme
            const icon = themeToggle.querySelector('i');
            if (document.documentElement.classList.contains('light-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }
    
    // Social links hover animations with GSAP
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            gsap.to(link, {
                y: -6,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2), 0 0 20px rgba(157, 78, 221, 0.3)',
                backgroundColor: 'rgba(157, 78, 221, 0.15)',
                borderColor: 'rgba(157, 78, 221, 0.3)',
                color: '#c77dff',
                duration: 0.4,
                ease: "back.out(1.7)"
            });
            
            // Lower opacity of other links
            links.forEach(otherLink => {
                if (otherLink !== link) {
                    gsap.to(otherLink, {
                        opacity: 0.5,
                        duration: 0.3
                    });
                }
            });
        });
        
        link.addEventListener('mouseleave', () => {
            gsap.to(link, {
                y: 0,
                boxShadow: '0 0 15px rgba(157, 78, 221, 0.05)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(157, 78, 221, 0.1)',
                color: 'var(--text-secondary)',
                duration: 0.4,
                ease: "power2.out"
            });
            
            // Restore opacity of other links
            links.forEach(otherLink => {
                gsap.to(otherLink, {
                    opacity: 1,
                    duration: 0.3
                });
            });
        });
    });
    
    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
        const elapsedTime = clock.getElapsedTime();
        
        // Update particles uniforms
        particlesMaterial.uniforms.uTime.value = elapsedTime;
        starMaterial.uniforms.uTime.value = elapsedTime;
        
        // Smooth mouse movement
        mouse.x += (mouse.targetX - mouse.x) * mouse.speed;
        mouse.y += (mouse.targetY - mouse.y) * mouse.speed;
        
        // Rotate particles based on mouse
        particles.rotation.x = mouse.y * 0.3;
        particles.rotation.y = mouse.x * 0.3;
        
        // Rotate stars more subtly
        stars.rotation.x = mouse.y * 0.1;
        stars.rotation.y = mouse.x * 0.1;
        
        // Render scene
        renderer.render(scene, camera);
        
        // Continue animation loop
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Add CSS class for light theme
    const lightThemeStyles = document.createElement('style');
    lightThemeStyles.innerHTML = `
        .light-mode {
            --bg-color: #f8f9fa;
            --card-bg: #ffffff;
            --text-color: #252525;
            --text-secondary: #555555;
        }
        
        .light-mode #three-container canvas {
            opacity: 0.8;
        }
        
        .light-mode .link-item {
            background-color: rgba(0, 0, 0, 0.03);
            border-color: rgba(157, 78, 221, 0.15);
        }
        
        .light-mode .link-item:hover {
            background-color: rgba(157, 78, 221, 0.1);
            color: #9d4edd;
        }
    `;
    document.head.appendChild(lightThemeStyles);
}); 