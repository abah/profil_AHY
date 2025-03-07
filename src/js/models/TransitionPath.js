import * as THREE from 'three';
import { gsap } from 'gsap';

export class TransitionPath {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Create materials
        this.createMaterials();
        
        // Create path elements
        this.createPath();
        
        // Create milestone markers
        this.createMilestones();

        // Initial state
        this.group.position.set(0, -5, 0);
        this.group.scale.set(0, 0, 0);
        this.group.rotation.y = Math.PI * 0.25;

        // Animation timeline
        this.timeline = null;
        this.time = 0;
        this.pathProgress = 0;
    }

    createMaterials() {
        // Path material with flowing effect
        this.pathMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                progress: { value: 0 },
                color1: { value: new THREE.Color(0x1a237e) }, // Military blue
                color2: { value: new THREE.Color(0x304ffe) }  // Political blue
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform float progress;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    vec3 pos = position;
                    float wave = sin(pos.x * 2.0 + time * 2.0) * 0.1;
                    pos.y += wave;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform float progress;
                uniform vec3 color1;
                uniform vec3 color2;
                
                void main() {
                    float flow = mod(vUv.x - time * 0.5, 1.0);
                    float transition = smoothstep(progress - 0.1, progress + 0.1, vUv.x);
                    vec3 color = mix(color1, color2, transition);
                    
                    float glow = smoothstep(0.0, 0.2, flow) * smoothstep(1.0, 0.8, flow);
                    color += mix(color1, color2, transition) * glow * 0.5;
                    
                    gl_FragColor = vec4(color, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        // Milestone material
        this.milestoneMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xffd700) },
                glowColor: { value: new THREE.Color(0xffa000) }
            },
            vertexShader: `
                varying vec3 vNormal;
                uniform float time;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec3 pos = position;
                    float scale = 1.0 + sin(time * 2.0) * 0.1;
                    pos *= scale;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                uniform vec3 color;
                uniform vec3 glowColor;
                uniform float time;
                
                void main() {
                    float glow = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                    vec3 finalColor = mix(color, glowColor, glow * 0.5);
                    float pulse = sin(time * 3.0) * 0.5 + 0.5;
                    finalColor += glowColor * pulse * 0.2;
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });
    }

    createPath() {
        // Create curved path
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-4, 0, 0),
            new THREE.Vector3(-2, 1, 2),
            new THREE.Vector3(0, 0.5, -1),
            new THREE.Vector3(2, 1.5, 1),
            new THREE.Vector3(4, 0, 0)
        ]);

        const geometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
        this.path = new THREE.Mesh(geometry, this.pathMaterial);
        this.group.add(this.path);

        // Create particles along the path
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const point = curve.getPoint(t);
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x4a90e2,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.group.add(this.particles);
    }

    createMilestones() {
        this.milestones = [];
        const milestoneCount = 4;
        
        for (let i = 0; i < milestoneCount; i++) {
            const geometry = new THREE.OctahedronGeometry(0.3);
            const milestone = new THREE.Mesh(geometry, this.milestoneMaterial.clone());
            
            // Position along the path
            const t = i / (milestoneCount - 1);
            const x = -4 + t * 8;
            const y = Math.sin(t * Math.PI) * 1.5;
            const z = Math.cos(t * Math.PI) * 2;
            
            milestone.position.set(x, y, z);
            
            this.group.add(milestone);
            this.milestones.push(milestone);
        }
    }

    update(time) {
        this.time = time;

        // Update path material
        this.path.material.uniforms.time.value = time;
        this.path.material.uniforms.progress.value = this.pathProgress;

        // Animate milestones
        this.milestones.forEach((milestone, index) => {
            milestone.material.uniforms.time.value = time;
            milestone.rotation.y = time * 0.5;
            milestone.position.y += Math.sin(time * 2 + index) * 0.002;
        });

        // Animate particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(time * 2 + positions[i]) * 0.002;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // Progress animation
        this.pathProgress = (Math.sin(time * 0.5) * 0.5 + 0.5) * 0.7 + 0.3;
    }

    show() {
        // Kill any existing animations
        if (this.timeline) {
            this.timeline.kill();
        }

        // Create new timeline
        this.timeline = gsap.timeline({
            defaults: { duration: 2, ease: 'power3.out' }
        });

        // Add animations to timeline
        this.timeline
            .to(this.group.position, {
                y: 0,
                duration: 2
            })
            .to(this.group.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 2
            }, '<') // Start at same time as previous animation
            .to(this, {
                pathProgress: 1,
                duration: 3,
                ease: 'power1.inOut'
            }, '-=1.5'); // Start 1.5s before previous animation ends
    }

    hide() {
        // Kill any existing animations
        if (this.timeline) {
            this.timeline.kill();
        }

        // Create new timeline
        this.timeline = gsap.timeline({
            defaults: { duration: 1.5, ease: 'power3.in' }
        });

        // Add animations to timeline
        this.timeline
            .to(this, {
                pathProgress: 0,
                duration: 1,
                ease: 'power1.in'
            })
            .to(this.group.position, {
                y: -5,
                duration: 1.5
            }, '-=0.5')
            .to(this.group.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1.5
            }, '<'); // Start at same time as previous animation
    }

    dispose() {
        // Kill any running animations
        if (this.timeline) {
            this.timeline.kill();
        }

        // Clean up resources
        this.path.geometry.dispose();
        this.path.material.dispose();
        
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }

        this.milestones.forEach(milestone => {
            milestone.geometry.dispose();
            milestone.material.dispose();
        });
    }
} 