import * as THREE from 'three';
import { gsap } from 'gsap';

export class FutureVision {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Create materials with custom shaders
        this.createMaterials();
        
        // Create the visualization elements
        this.createHumanFigures();
        this.createAscendingStairs();
        this.createLightBeams();

        // Initial state
        this.group.position.set(0, -5, 0);
        this.group.scale.set(0, 0, 0);
        this.group.rotation.y = Math.PI * 0.25;

        // Animation timeline
        this.timeline = null;
    }

    createMaterials() {
        // Human figure material with glow effect
        this.humanMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x4a90e2) },
                glowColor: { value: new THREE.Color(0x00ff88) },
                glowStrength: { value: 0.5 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    // Add subtle movement
                    vec3 pos = position;
                    pos.y += sin(time * 2.0 + position.x) * 0.1;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform vec3 baseColor;
                uniform vec3 glowColor;
                uniform float glowStrength;
                uniform float time;
                
                void main() {
                    float glow = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                    vec3 finalColor = mix(baseColor, glowColor, glow * glowStrength);
                    
                    // Add pulsing effect
                    float pulse = sin(time * 3.0) * 0.5 + 0.5;
                    finalColor += glowColor * pulse * 0.2;
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        // Stair material with flowing light effect
        this.stairMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x1a237e) },
                flowColor: { value: new THREE.Color(0x4a90e2) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform vec3 color;
                uniform vec3 flowColor;
                
                void main() {
                    float flow = mod(vUv.y - time * 0.5, 1.0);
                    float glow = smoothstep(0.0, 0.2, flow) * smoothstep(1.0, 0.8, flow);
                    vec3 finalColor = mix(color, flowColor, glow * 0.6);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            transparent: true
        });
    }

    createHumanFigures() {
        const figureCount = 5;
        this.figures = [];

        for (let i = 0; i < figureCount; i++) {
            // Create abstract human figure using merged geometries
            const figure = new THREE.Group();
            
            // Body
            const bodyGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 4, 8);
            const body = new THREE.Mesh(bodyGeometry, this.humanMaterial.clone());
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
            const head = new THREE.Mesh(headGeometry, this.humanMaterial.clone());
            head.position.y = 0.5;
            
            figure.add(body, head);
            
            // Position figure
            const angle = (i / figureCount) * Math.PI * 2;
            figure.position.set(
                Math.cos(angle) * 3,
                i * 0.5,
                Math.sin(angle) * 3
            );
            
            figure.rotation.y = -angle + Math.PI / 2;
            
            this.group.add(figure);
            this.figures.push(figure);
        }
    }

    createAscendingStairs() {
        const stairCount = 8;
        this.stairs = [];

        for (let i = 0; i < stairCount; i++) {
            const stairGeometry = new THREE.BoxGeometry(1, 0.2, 1);
            const stair = new THREE.Mesh(stairGeometry, this.stairMaterial.clone());
            
            // Position in spiral pattern
            const angle = (i / stairCount) * Math.PI * 2;
            const radius = 2 + (i / stairCount);
            stair.position.set(
                Math.cos(angle) * radius,
                i * 0.4,
                Math.sin(angle) * radius
            );
            
            stair.rotation.y = -angle;
            
            this.group.add(stair);
            this.stairs.push(stair);
        }
    }

    createLightBeams() {
        const beamCount = 6;
        this.beams = [];

        for (let i = 0; i < beamCount; i++) {
            const beamGeometry = new THREE.CylinderGeometry(0.05, 0.2, 4, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0x4a90e2,
                transparent: true,
                opacity: 0.3
            });
            
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            const angle = (i / beamCount) * Math.PI * 2;
            beam.position.set(
                Math.cos(angle) * 4,
                2,
                Math.sin(angle) * 4
            );
            
            beam.rotation.x = Math.PI / 2;
            beam.rotation.z = angle;
            
            this.group.add(beam);
            this.beams.push(beam);
        }
    }

    update(time, mousePosition) {
        // Update shader uniforms
        this.figures.forEach(figure => {
            figure.children.forEach(mesh => {
                if (mesh.material.uniforms) {
                    mesh.material.uniforms.time.value = time;
                }
            });
        });

        this.stairs.forEach(stair => {
            stair.material.uniforms.time.value = time;
        });

        // Animate figures
        this.figures.forEach((figure, index) => {
            const yOffset = Math.sin(time * 2 + index) * 0.1;
            figure.position.y += yOffset;
            figure.rotation.y += 0.001;
        });

        // Animate stairs
        this.stairs.forEach((stair, index) => {
            const yOffset = Math.sin(time + index) * 0.05;
            stair.position.y += yOffset;
            stair.rotation.y += 0.002;
        });

        // Animate light beams
        this.beams.forEach((beam, index) => {
            beam.material.opacity = 0.3 + Math.sin(time * 3 + index) * 0.1;
            beam.scale.y = 1 + Math.sin(time * 2 + index) * 0.2;
        });

        // Rotate entire group slowly
        this.group.rotation.y += 0.001;
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
            .fromTo(this.figures.map(f => f.scale), {
                x: 0, y: 0, z: 0
            }, {
                x: 1, y: 1, z: 1,
                duration: 1.5,
                stagger: 0.2
            }, '-=1.5')
            .fromTo(this.stairs.map(s => s.scale), {
                x: 0, y: 0, z: 0
            }, {
                x: 1, y: 1, z: 1,
                duration: 1.5,
                stagger: 0.1
            }, '-=1')
            .fromTo(this.beams.map(b => b.material), {
                opacity: 0
            }, {
                opacity: 0.3,
                duration: 1,
                stagger: 0.1
            }, '-=1');
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
            .to(this.beams.map(b => b.material), {
                opacity: 0,
                duration: 1,
                stagger: 0.05
            })
            .to(this.figures.map(f => f.scale), {
                x: 0, y: 0, z: 0,
                duration: 1,
                stagger: 0.1
            }, '-=0.5')
            .to(this.stairs.map(s => s.scale), {
                x: 0, y: 0, z: 0,
                duration: 1,
                stagger: 0.05
            }, '-=0.8')
            .to(this.group.position, {
                y: -5,
                duration: 1.5
            }, '-=0.5')
            .to(this.group.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1.5
            }, '<');
    }

    dispose() {
        // Kill any running animations
        if (this.timeline) {
            this.timeline.kill();
        }

        // Clean up resources
        this.figures.forEach(figure => {
            figure.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    object.material.dispose();
                }
            });
        });

        this.stairs.forEach(stair => {
            stair.geometry.dispose();
            stair.material.dispose();
        });

        this.beams.forEach(beam => {
            beam.geometry.dispose();
            beam.material.dispose();
        });
    }
} 