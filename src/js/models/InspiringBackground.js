import * as THREE from 'three';
import { gsap } from 'gsap';

export class InspiringBackground {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Parameters
        this.params = {
            particleCount: 2000,
            particleSize: 0.1,
            areaSize: 30,
            glowIntensity: 2.0,
            colors: [
                new THREE.Color(0xff7e5f), // Warm sunset orange
                new THREE.Color(0xfeb47b), // Soft peach
                new THREE.Color(0x7ec0ff)  // Sky blue
            ]
        };

        // Create particles
        this.createParticles();

        // Initial state
        this.group.scale.set(0.001, 0.001, 0.001);
        this.group.position.y = -10;

        // Animation timeline
        this.timeline = null;
    }

    createParticles() {
        const positions = new Float32Array(this.params.particleCount * 3);
        const colors = new Float32Array(this.params.particleCount * 3);
        const sizes = new Float32Array(this.params.particleCount);
        const random = new Float32Array(this.params.particleCount);

        for (let i = 0; i < this.params.particleCount; i++) {
            // Position with better distribution
            const radius = Math.random() * this.params.areaSize;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Color
            const color = this.params.colors[Math.floor(Math.random() * this.params.colors.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Size and random value for animation
            sizes[i] = this.params.particleSize * (0.5 + Math.random() * 0.5);
            random[i] = Math.random() * Math.PI * 2;
        }

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('random', new THREE.BufferAttribute(random, 1));

        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                glowIntensity: { value: this.params.glowIntensity }
            },
            vertexShader: `
                attribute float size;
                attribute float random;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // More complex floating motion
                    float offset = random + time;
                    pos.x += sin(offset) * 0.3;
                    pos.y += cos(offset * 0.7) * 0.2;
                    pos.z += sin(offset * 0.5) * 0.3;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Size attenuation
                    float distanceScale = 1000.0 / length(mvPosition.xyz);
                    gl_PointSize = size * distanceScale;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                uniform float glowIntensity;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    float strength = 1.0 - smoothstep(0.0, 0.5, dist);
                    strength = pow(strength, 2.0);
                    
                    vec3 glowColor = vColor * glowIntensity;
                    gl_FragColor = vec4(glowColor, strength);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        // Create points
        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }

    update() {
        if (this.particles) {
            this.particles.material.uniforms.time.value += 0.005;
            this.group.rotation.y += 0.0005;
        }
    }

    show() {
        console.log('Showing particles...');
        if (this.timeline) {
            this.timeline.kill();
        }

        this.timeline = gsap.timeline({
            defaults: { duration: 2.5, ease: 'power3.out' }
        });

        this.timeline
            .to(this.group.position, {
                y: 0,
                duration: 2.5
            })
            .to(this.group.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 2.5
            }, '<');
    }

    hide() {
        if (this.timeline) {
            this.timeline.kill();
        }

        this.timeline = gsap.timeline({
            defaults: { duration: 1.5, ease: 'power3.in' }
        });

        this.timeline
            .to(this.group.position, {
                y: -10,
                duration: 1.5
            })
            .to(this.group.scale, {
                x: 0.001,
                y: 0.001,
                z: 0.001,
                duration: 1.5
            }, '<');
    }

    dispose() {
        if (this.timeline) {
            this.timeline.kill();
        }

        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.group.remove(this.particles);
            this.scene.remove(this.group);
        }
    }
} 