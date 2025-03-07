import * as THREE from 'three';
import { gsap } from 'gsap';

export class MilitaryAchievements {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Create medal
        this.createMedal();
        // Create sword
        this.createSword();

        // Initial state
        this.group.position.set(0, -5, 0);
        this.group.scale.set(0, 0, 0);
        this.group.rotation.y = Math.PI * 0.25;

        // Animation timeline
        this.timeline = null;
    }

    createMedal() {
        // Medal base (circle)
        const medalGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 32);
        const medalMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });
        const medal = new THREE.Mesh(medalGeometry, medalMaterial);
        
        // Medal details (star)
        const starGeometry = new THREE.BufferGeometry();
        const starPoints = [];
        const starRadius = 0.8;
        const starInnerRadius = 0.4;
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? starRadius : starInnerRadius;
            const angle = (i * Math.PI) / 5;
            starPoints.push(
                new THREE.Vector3(
                    Math.cos(angle) * radius,
                    0.06,
                    Math.sin(angle) * radius
                )
            );
        }
        starPoints.push(starPoints[0].clone());
        
        const starMaterial = new THREE.LineBasicMaterial({ color: 0xFFD700 });
        const starLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(starPoints),
            starMaterial
        );
        medal.add(starLine);

        // Medal ribbon
        const ribbonGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.05);
        const ribbonMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a237e,
            metalness: 0,
            roughness: 0.8
        });
        const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
        ribbon.position.y = 0.8;
        medal.add(ribbon);

        medal.position.set(-1, 0, 0);
        this.group.add(medal);
    }

    createSword() {
        // Sword handle
        const handleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            metalness: 0.3,
            roughness: 0.7
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);

        // Sword guard
        const guardGeometry = new THREE.BoxGeometry(1, 0.1, 0.2);
        const guardMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.y = 0.4;
        handle.add(guard);

        // Sword blade
        const bladeGeometry = new THREE.BoxGeometry(0.2, 3, 0.05);
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0,
            metalness: 0.9,
            roughness: 0.1
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 2;
        handle.add(blade);

        handle.position.set(1, 0, 0);
        handle.rotation.z = Math.PI / 6;
        this.group.add(handle);
    }

    update() {
        // Add subtle rotation animation
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
        this.group.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                object.material.dispose();
            }
        });
    }
} 