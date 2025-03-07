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
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.anisotropy = 16;
                texture.encoding = THREE.sRGBEncoding; // Ensure correct color space
                texture.generateMipmaps = true;
                
                const aspectRatio = texture.image.width / texture.image.height;
                const width = 25;
                const height = width / aspectRatio;
                
                const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
                const material = new THREE.MeshPhongMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide,
                    shininess: 0, // Remove glossiness
                    emissive: new THREE.Color(0x000000), // No self-illumination
                    emissiveIntensity: 0,
                    reflectivity: 0, // No reflections
                    color: new THREE.Color(0xffffff) // Pure white to preserve image colors
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                
                // Add subtle ambient occlusion
                const aoIntensity = 0.3;
                mesh.material.aoMapIntensity = aoIntensity;
                
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
        
        // Add dedicated lighting for images
        const imageLight = new THREE.DirectionalLight(0xffffff, 0.8);
        imageLight.position.set(0, 0, 10);
        this.group.add(imageLight);
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
            const side = pageIndex % 2 === 0 ? 1 : -1;
            const distanceFromCenter = 30;
            
            // Position upright and to the side
            image.mesh.position.set(
                side * distanceFromCenter,
                0,
                -25
            );
            
            // Reset rotation
            image.mesh.rotation.set(0, 0, 0);
            // Slight angle toward center
            image.mesh.rotation.y = side * 0.15 * Math.PI;
            
            // Ensure proper rendering order
            image.mesh.renderOrder = 1;
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