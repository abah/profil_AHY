import * as THREE from 'three';
import { gsap } from 'gsap';

export class PoliticalNetwork {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Add isActive flag
        this.isActive = false;

        // Network data
        this.nodes = [
            { id: 'jakarta', position: new THREE.Vector3(0, 0, 0), label: 'Jakarta - Pusat Pemerintahan' },
            { id: 'surabaya', position: new THREE.Vector3(3, 0, 2), label: 'Surabaya - Basis Jawa Timur' },
            { id: 'medan', position: new THREE.Vector3(-3, 0, 2), label: 'Medan - Gerbang Sumatera' },
            { id: 'makassar', position: new THREE.Vector3(2, 0, -3), label: 'Makassar - Pusat Indonesia Timur' },
            { id: 'bandung', position: new THREE.Vector3(-2, 0, -2), label: 'Bandung - Basis Jawa Barat' },
            { id: 'semarang', position: new THREE.Vector3(1, 0, 1), label: 'Semarang - Jawa Tengah' },
            { id: 'palembang', position: new THREE.Vector3(-2, 0, 1), label: 'Palembang - Sumatera Selatan' },
            { id: 'pontianak', position: new THREE.Vector3(1, 0, -2), label: 'Pontianak - Kalimantan' }
        ];

        // Create materials
        this.createMaterials();
        
        // Create network visualization
        this.createNetwork();

        // Create hover plane for raycasting
        this.createHoverPlane();

        // Setup raycaster
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.2;

        // Initial state
        this.group.position.set(0, -5, 0);
        this.group.scale.set(0, 0, 0);
        this.group.rotation.y = Math.PI * 0.25;

        // Animation timeline
        this.timeline = null;
    }

    createMaterials() {
        // Node material with custom shader
        this.nodeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x304ffe) },
                hoverStrength: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = 15.0 * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float time;
                uniform float hoverStrength;
                
                void main() {
                    float r = length(gl_PointCoord - vec2(0.5));
                    if (r > 0.5) discard;
                    
                    float pulse = sin(time * 3.0) * 0.5 + 0.5;
                    float strength = smoothstep(0.5, 0.0, r);
                    vec3 finalColor = mix(color, vec3(1.0), pulse * 0.3 + hoverStrength);
                    
                    gl_FragColor = vec4(finalColor, strength);
                }
            `,
            transparent: true,
            depthWrite: false
        });

        // Connection line material
        this.lineMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x1a237e) }
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform vec3 color;
                uniform float time;
                
                void main() {
                    float flow = mod(vUv.x - time * 0.5, 1.0);
                    float strength = smoothstep(0.0, 0.1, flow) * smoothstep(1.0, 0.9, flow);
                    gl_FragColor = vec4(color, strength * 0.5);
                }
            `,
            transparent: true
        });
    }

    createNetwork() {
        // Create nodes
        const nodeGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.nodes.length * 3);

        this.nodes.forEach((node, i) => {
            positions[i * 3] = node.position.x;
            positions[i * 3 + 1] = node.position.y;
            positions[i * 3 + 2] = node.position.z;
        });

        nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.nodePoints = new THREE.Points(nodeGeometry, this.nodeMaterial);
        this.group.add(this.nodePoints);

        // Create connections
        this.connections = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const points = [];
                points.push(this.nodes[i].position);
                
                // Add control points for curved lines
                const mid = this.nodes[i].position.clone().add(this.nodes[j].position).multiplyScalar(0.5);
                mid.y += Math.random() * 2;
                points.push(mid);
                
                points.push(this.nodes[j].position);

                const curve = new THREE.QuadraticBezierCurve3(
                    points[0],
                    points[1],
                    points[2]
                );

                const geometry = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
                const line = new THREE.Mesh(geometry, this.lineMaterial.clone());
                this.connections.push(line);
                this.group.add(line);
            }
        }

        // Create labels
        this.labels = this.nodes.map(node => {
            const div = document.createElement('div');
            div.className = 'network-label';
            div.textContent = node.label;
            div.style.position = 'absolute';
            div.style.display = 'none';
            document.body.appendChild(div);
            return div;
        });
    }

    createHoverPlane() {
        const geometry = new THREE.PlaneGeometry(20, 20);
        const material = new THREE.MeshBasicMaterial({
            visible: false
        });
        this.hoverPlane = new THREE.Mesh(geometry, material);
        this.group.add(this.hoverPlane);
    }

    update(time, camera, mouse) {
        if (!this.isActive) return;
        
        this.time = time;

        // Update shader uniforms
        if (this.nodeMaterial && this.nodeMaterial.uniforms) {
            this.nodeMaterial.uniforms.time.value = time;
        }
        
        if (this.connections) {
            this.connections.forEach(line => {
                if (line.material && line.material.uniforms) {
                    line.material.uniforms.time.value = time;
                }
            });
        }

        // Update node positions with subtle movement
        if (this.nodePoints && this.nodePoints.geometry) {
            const positions = this.nodePoints.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const originalY = this.nodes[i / 3].position.y;
                positions[i + 1] = originalY + Math.sin(time * 0.5 + i) * 0.1;
            }
            this.nodePoints.geometry.attributes.position.needsUpdate = true;
        }

        // Rotate group slowly
        if (this.group) {
            this.group.rotation.y += 0.001;
        }

        // Update labels if camera and mouse are provided
        if (camera && mouse) {
            this.updateLabels(camera, mouse);
        }
    }

    updateLabels(camera, mouse) {
        // Raycast to find hovered node
        this.raycaster.setFromCamera(mouse, camera);
        const intersects = this.raycaster.intersectObject(this.nodePoints);

        // Reset all labels
        this.labels.forEach(label => {
            label.style.display = 'none';
        });

        // Show label for hovered node
        if (intersects.length > 0) {
            const index = intersects[0].index;
            const node = this.nodes[index];
            const position = node.position.clone();
            position.project(camera);

            const label = this.labels[index];
            label.style.display = 'block';
            label.style.left = (position.x * 0.5 + 0.5) * window.innerWidth + 'px';
            label.style.top = (-position.y * 0.5 + 0.5) * window.innerHeight + 'px';
        }
    }

    show() {
        // Kill any existing animations
        if (this.timeline) {
            this.timeline.kill();
        }
        
        this.isActive = true;
        
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
            .fromTo(this.connections, {
                opacity: 0
            }, {
                opacity: 1,
                duration: 1.5,
                stagger: 0.1
            }, '-=1.5'); // Start 1.5s before previous animation ends
    }

    hide() {
        // Kill any existing animations
        if (this.timeline) {
            this.timeline.kill();
        }
        
        this.isActive = false;
        
        // Create new timeline
        this.timeline = gsap.timeline({
            defaults: { duration: 1.5, ease: 'power3.in' }
        });

        // Add animations to timeline
        this.timeline
            .to(this.connections, {
                opacity: 0,
                duration: 1,
                stagger: 0.05
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

        // Hide all labels
        this.labels.forEach(label => {
            label.style.display = 'none';
        });
    }

    dispose() {
        // Kill any running animations
        if (this.timeline) {
            this.timeline.kill();
        }
        
        this.isActive = false;

        // Remove labels from DOM
        if (this.labels) {
            this.labels.forEach(label => {
                if (label && label.parentNode) {
                    label.parentNode.removeChild(label);
                }
            });
        }

        // Clean up resources
        if (this.nodePoints) {
            this.nodePoints.geometry.dispose();
            this.nodePoints.material.dispose();
        }

        if (this.connections) {
            this.connections.forEach(connection => {
                if (connection) {
                    connection.geometry.dispose();
                    connection.material.dispose();
                }
            });
        }
        
        // Remove from scene
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }
    }
} 