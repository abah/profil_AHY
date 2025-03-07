import * as THREE from 'three';

export class FloatingLogo {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Load logo texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/Logo-AHY-SEO.png', (texture) => {
            // Get aspect ratio from the loaded texture
            const aspectRatio = texture.image.width / texture.image.height;
            const width = 8;
            const height = width / aspectRatio;
            
            // Create plane geometry with the correct aspect ratio
            const geometry = new THREE.PlaneGeometry(width, height);
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
                emissive: 0x222222,
                emissiveIntensity: 0.5,
                shininess: 50
            });
            
            this.logo = new THREE.Mesh(geometry, material);
            this.group.add(this.logo);
            
            // Position the logo in the top-right corner
            this.group.position.set(15, 12, -15);
            this.group.rotation.y = -Math.PI / 6; // Slight angle
            
            // Add rim light
            const rimLight = new THREE.PointLight(0x4a90e2, 2, 20);
            rimLight.position.set(-2, 0, 5);
            this.group.add(rimLight);
            this.rimLight = rimLight;
            
            // Add glow effect
            const glowGeometry = new THREE.PlaneGeometry(width * 1.2, height * 1.2);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x4a90e2,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
            this.glow.position.z = -0.1;
            this.group.add(this.glow);
        });
    }
    
    update(time) {
        if (this.group) {
            // Floating animation
            this.group.position.y = 12 + Math.sin(time * 0.5) * 0.5;
            
            // Gentle rotation
            this.group.rotation.y = -Math.PI / 6 + Math.sin(time * 0.2) * 0.1;
            
            // Glow pulse
            if (this.glow) {
                this.glow.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
            }
            
            // Light animation
            if (this.rimLight) {
                this.rimLight.intensity = 2 + Math.sin(time * 1.5) * 0.5;
            }
        }
    }
    
    dispose() {
        if (this.logo) {
            this.logo.geometry.dispose();
            this.logo.material.dispose();
            if (this.logo.material.map) {
                this.logo.material.map.dispose();
            }
        }
        if (this.glow) {
            this.glow.geometry.dispose();
            this.glow.material.dispose();
        }
        if (this.rimLight) {
            this.scene.remove(this.rimLight);
        }
        if (this.group) {
            this.scene.remove(this.group);
        }
    }
} 