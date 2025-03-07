import * as THREE from 'three';

export class FloatingImages {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.images = [];
        
        // Map images to specific pages
        this.pageImageMap = {
            0: '/AHY_Dasi_Merah_2024.png',    // Introduction
            1: '/ahy_umum.png',               // Military Career
            2: '/AHY_Ketum_Jas_PD.png',       // Transition to Politics
            3: '/AHY_Ketum_Jas_PD.png',       // Leadership Journey
            4: '/AHY_Dasi_Merah_2024.png',    // Political Achievements
            5: '/ahy_umum.png'                // Future Vision
        };
        
        // Load all images with better quality settings
        const textureLoader = new THREE.TextureLoader();
        Object.values(this.pageImageMap).forEach((url, index) => {
            textureLoader.load(url, (texture) => {
                // Improve texture quality
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.anisotropy = 16; // Increase anisotropic filtering
                
                const aspectRatio = texture.image.width / texture.image.height;
                const width = 25; // Increased base width for better resolution
                const height = width / aspectRatio;
                
                const geometry = new THREE.PlaneGeometry(width, height);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                
                this.images.push({
                    mesh,
                    width,
                    height,
                    url
                });
                
                this.group.add(mesh);
                mesh.visible = false;
            });
        });
    }
    
    positionForPage(pageIndex) {
        // Hide all images first
        this.images.forEach(image => {
            image.mesh.visible = false;
        });
        
        // Find the correct image for this page
        const pageImageUrl = this.pageImageMap[pageIndex];
        const image = this.images.find(img => img.url === pageImageUrl);
        
        if (image) {
            image.mesh.visible = true;
            
            // Position on alternating sides based on page index
            const side = pageIndex % 2 === 0 ? 1 : -1; // Even pages right, odd pages left
            const distanceFromCenter = 30; // Increased distance for better visibility
            
            // Position upright and to the side
            image.mesh.position.set(
                side * distanceFromCenter,
                0,
                -25 // Moved slightly back for better perspective
            );
            
            // Reset rotation
            image.mesh.rotation.set(0, 0, 0);
            // Slight angle toward center
            image.mesh.rotation.y = side * 0.15 * Math.PI; // Adjusted angle
        }
    }
    
    update(time) {
        // No movement animation needed
    }
    
    dispose() {
        this.images.forEach(image => {
            if (image.mesh) {
                image.mesh.geometry.dispose();
                image.mesh.material.dispose();
                if (image.mesh.material.map) {
                    image.mesh.material.map.dispose();
                }
            }
        });
        
        if (this.group) {
            this.scene.remove(this.group);
        }
    }
} 