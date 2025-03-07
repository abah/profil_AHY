import * as THREE from 'three';
import { gsap } from 'gsap';

export class LeadershipRibbons {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Create materials
        this.createMaterials();
        
        // Create ribbons
        this.createRibbons();

        // Initial state
        this.group.position.set(0, -5, 0);
        this.group.scale.set(0, 0, 0);
        this.group.rotation.y = Math.PI * 0.25;

        // Animation timeline
        this.timeline = null;
    }

    createMaterials() {
        // Ribbon material with flowing effect
        this.ribbonMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x304ffe) },
                flowColor: { value: new THREE.Color(0x76ff03) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Add wave effect
                    vec3 pos = position;
                    float wave = sin(pos.x * 2.0 + time * 2.0) * 0.2;
                    pos.y += wave;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform vec3 baseColor;
                uniform vec3 flowColor;
                uniform float time;
                
                void main() {
                    float flow = mod(vUv.x - time * 0.5, 1.0);
                    float glow = smoothstep(0.0, 0.2, flow) * smoothstep(1.0, 0.8, flow);
                    vec3 finalColor = mix(baseColor, flowColor, glow * 0.6);
                    
                    // Add shimmer effect
                    float shimmer = sin(vUv.x * 20.0 + time * 5.0) * 0.5 + 0.5;
                    finalColor += flowColor * shimmer * 0.2;
                    
                    gl_FragColor = vec4(finalColor, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    createRibbons() {
        this.ribbons = [];
        const ribbonCount = 5;
        
        for (let i = 0; i < ribbonCount; i++) {
            // Create ribbon geometry
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-4, i * 1.5, 0),
                new THREE.Vector3(-2, i * 1.5 + 1, 2),
                new THREE.Vector3(0, i * 1.5 + 0.5, -1),
                new THREE.Vector3(2, i * 1.5 + 1.5, 1),
                new THREE.Vector3(4, i * 1.5, 0)
            ]);

            const geometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
            const ribbon = new THREE.Mesh(geometry, this.ribbonMaterial.clone());
            
            this.group.add(ribbon);
            this.ribbons.push({
                mesh: ribbon,
                initialY: i * 1.5
            });
        }

        // Add achievement markers
        this.markers = [];
        const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const markerMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffa000,
            shininess: 100
        });

        for (let i = 0; i < ribbonCount; i++) {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(
                (Math.random() - 0.5) * 6,
                i * 1.5 + Math.random(),
                (Math.random() - 0.5) * 3
            );
            this.group.add(marker);
            this.markers.push(marker);
        }
    }

    update(time) {
        this.time = time;

        // Update ribbon materials
        this.ribbons.forEach((ribbon, index) => {
            ribbon.mesh.material.uniforms.time.value = time;
            
            // Add floating motion
            const yOffset = Math.sin(time * 2 + index) * 0.2;
            ribbon.mesh.position.y = ribbon.initialY + yOffset;
        });

        // Animate markers
        this.markers.forEach((marker, index) => {
            marker.rotation.y = time * 0.5;
            marker.position.y += Math.sin(time * 3 + index) * 0.01;
            marker.scale.setScalar(1 + Math.sin(time * 2 + index) * 0.1);
        });

        // Rotate entire group slowly
        this.group.rotation.y = Math.sin(time * 0.2) * 0.2;
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
            }, '<'); // Start at same time as previous animation
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
            .to(this.group.position, {
                y: -5,
                duration: 1.5
            })
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
        this.ribbons.forEach(ribbon => {
            ribbon.mesh.geometry.dispose();
            ribbon.mesh.material.dispose();
        });

        this.markers.forEach(marker => {
            marker.geometry.dispose();
            marker.material.dispose();
        });
    }
} 