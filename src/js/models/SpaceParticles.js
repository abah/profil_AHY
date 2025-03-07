import * as THREE from 'three';
import { gsap } from 'gsap';

export class SpaceParticles {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Parameters
        this.params = {
            particleCount: 10000,
            particleSize: 0.25,
            areaSize: 100,
            mouseInfluence: 1.0,
            particleSpeed: 0.4
        };

        // Mouse tracking
        this.mouse = new THREE.Vector2(0, 0);
        this.target = new THREE.Vector2(0, 0);
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        this.createParticles();
        
        // Initial state
        this.group.scale.set(0.001, 0.001, 0.001);
        this.group.position.z = -30;
    }

    onMouseMove(event) {
        // Convert mouse position to normalized device coordinates (-1 to +1)
        this.target.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.target.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.params.particleCount * 3);
        const velocities = new Float32Array(this.params.particleCount * 3);
        const colors = new Float32Array(this.params.particleCount * 3);
        const sizes = new Float32Array(this.params.particleCount);

        const palette = [
            new THREE.Color(0x4facfe), // Bright blue
            new THREE.Color(0x00f2fe), // Cyan
            new THREE.Color(0x0af4e9), // Turquoise
            new THREE.Color(0x43e97b), // Green
            new THREE.Color(0x00ff87), // Bright green
            new THREE.Color(0x00ffcc), // Aqua
            new THREE.Color(0x00ccff)  // Sky blue
        ];

        for (let i = 0; i < this.params.particleCount; i++) {
            // Random position in sphere with more variation
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.pow(Math.random(), 0.5) * this.params.areaSize; // Better distribution

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Random velocity with more movement
            velocities[i * 3] = (Math.random() - 0.5) * 0.04;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;

            // Random color from expanded palette
            const color = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Random size with more variation
            sizes[i] = (Math.random() * 0.5 + 0.5) * this.params.particleSize;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
                mousePos: { value: new THREE.Vector3() }
            },
            vertexShader: `
                attribute vec3 velocity;
                attribute float size;
                varying vec3 vColor;
                uniform float time;
                uniform float pixelRatio;
                uniform vec3 mousePos;

                void main() {
                    vColor = color;
                    
                    // Calculate position with velocity and more dynamic movement
                    vec3 pos = position + velocity * time * 15.0;
                    
                    // Add sinusoidal motion
                    pos.x += sin(time * 0.5 + pos.y * 0.1) * 2.0;
                    pos.y += cos(time * 0.5 + pos.x * 0.1) * 2.0;
                    pos.z += sin(time * 0.3 + pos.z * 0.1) * 2.0;
                    
                    // Enhanced mouse influence
                    float dist = length(pos - mousePos);
                    float influence = smoothstep(20.0, 0.0, dist) * 3.0;
                    vec3 toMouse = normalize(mousePos - pos);
                    pos += toMouse * influence;
                    
                    // Keep particles within bounds with smoother wrapping
                    float maxRadius = 100.0;
                    float currentRadius = length(pos);
                    if(currentRadius > maxRadius) {
                        pos = normalize(pos) * (maxRadius - (currentRadius - maxRadius));
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Enhanced size attenuation
                    float distanceAttenuation = smoothstep(100.0, 5.0, -mvPosition.z);
                    gl_PointSize = size * pixelRatio * (400.0 / -mvPosition.z) * distanceAttenuation;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Enhanced circular particle with softer edge
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float r = length(xy);
                    if(r > 0.5) discard;
                    
                    // Enhanced glow effect
                    float glow = exp(-r * 3.0);
                    vec3 color = vColor * (glow * 2.5 + 0.5);
                    
                    gl_FragColor = vec4(color, glow * 0.8);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this.particles = new THREE.Points(geometry, particleMaterial);
        this.group.add(this.particles);
    }

    update(time) {
        if (!this.particles) return;

        // Enhanced smooth mouse movement
        this.mouse.x += (this.target.x - this.mouse.x) * 0.15;
        this.mouse.y += (this.target.y - this.mouse.y) * 0.15;

        // Update uniforms with enhanced range
        const mousePos = new THREE.Vector3(
            this.mouse.x * this.params.areaSize * 1.5,
            this.mouse.y * this.params.areaSize * 1.5,
            0
        );
        
        this.particles.material.uniforms.time.value = time;
        this.particles.material.uniforms.mousePos.value = mousePos;

        // Enhanced group movement
        this.group.rotation.y = Math.sin(time * 0.15) * 0.15;
        this.group.rotation.x = Math.cos(time * 0.2) * 0.15;
    }

    show() {
        gsap.to(this.group.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 2.5,
            ease: 'power3.out'
        });

        gsap.to(this.group.position, {
            z: -10, // Closer to camera
            duration: 2.5,
            ease: 'power3.out'
        });
    }

    hide() {
        gsap.to(this.group.scale, {
            x: 0.001,
            y: 0.001,
            z: 0.001,
            duration: 1.5,
            ease: 'power3.in'
        });

        gsap.to(this.group.position, {
            z: -30,
            duration: 1.5,
            ease: 'power3.in'
        });
    }

    dispose() {
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
    }
} 