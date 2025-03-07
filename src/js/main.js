import { pages } from './content.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InspiringBackground } from './models/InspiringBackground.js';
import { SpaceParticles } from './models/SpaceParticles.js';
import { FloatingLogo } from './models/FloatingLogo.js';
import { FloatingImages } from './models/FloatingImages.js';
import gsap from 'gsap';

// DOM Elements
const canvas = document.querySelector('#webgl');
const narrativeContainer = document.querySelector('.narrative-container') || createNarrativeContainer();
const narrativeText = document.querySelector('.narrative-text') || createNarrativeText();
const pageTitle = document.querySelector('.page-title') || createPageTitle();
const timeline = document.querySelector('.timeline');
const prevBtn = document.querySelector('.nav-btn.prev');
const nextBtn = document.querySelector('.nav-btn.next');
const progressFill = document.querySelector('.progress-fill');
const loadingScreen = document.querySelector('.loading-screen');

function createNarrativeContainer() {
    const container = document.createElement('div');
    container.className = 'narrative-container';
    document.body.appendChild(container);
    return container;
}

function createNarrativeText() {
    const text = document.createElement('div');
    text.className = 'narrative-text';
    narrativeContainer.appendChild(text);
    return text;
}

function createPageTitle() {
    const title = document.createElement('h1');
    title.className = 'page-title';
    narrativeContainer.insertBefore(title, narrativeContainer.firstChild);
    return title;
}

// WebGL Detection
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl2') || 
             canvas.getContext('webgl') || 
             canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

function showWebGLError() {
    loadingScreen.innerHTML = `
        <div class="error-message">
            <p>Browser Anda tidak mendukung WebGL.</p>
            <p>Solusi:</p>
            <ol>
                <li>Aktifkan Hardware Acceleration di chrome://settings/system</li>
                <li>Atau buka chrome://flags/ dan aktifkan:</li>
                <ul>
                    <li>Override Software Rendering List</li>
                    <li>WebGL Developer Extensions</li>
                    <li>WebGL Draft Extensions</li>
                </ul>
                <li>Restart browser setelah mengubah pengaturan</li>
            </ol>
        </div>
    `;
    throw new Error('WebGL not available');
}

// Check WebGL Support
if (!isWebGLAvailable()) {
    showWebGLError();
}

// Three.js setup with better error handling
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000510);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 0, 100); // Start much further back

// Renderer setup with fallbacks
const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Basic lighting
const light = new THREE.AmbientLight(0xffffff, 2.0); // Increased intensity
scene.add(light);

// Add directional light for better visibility
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Add point lights for dramatic effect
const pointLight1 = new THREE.PointLight(0x00ffff, 2, 100);
const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100);
scene.add(pointLight1);
scene.add(pointLight2);

// Simple controls with adjusted settings
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;
controls.minDistance = 30;
controls.maxDistance = 150;

let currentModel = null;
let backgroundParticles = null;
let floatingLogo = null;
let floatingImages = null;
let currentPage = 0;
let clock;

// Create timeline points
pages.forEach((_, index) => {
    const point = document.createElement('div');
    point.className = 'timeline-point';
    point.addEventListener('click', () => goToPage(index));
    timeline.appendChild(point);
});

// Simplified navigation
async function goToPage(index) {
    if (index < 0 || index >= pages.length) return;
    
    // Create background particles if not exists
    if (!backgroundParticles) {
        backgroundParticles = new SpaceParticles(scene);
        backgroundParticles.show();
    }
    
    // Cleanup previous model
    if (currentModel) {
        // Dramatic zoom out animation before hiding
        const timeline = gsap.timeline();
        
        timeline.to(camera.position, {
            z: 200,
            duration: 1.2,
            ease: 'power3.in'
        })
        .to(currentModel.group.scale, {
            x: 0.1,
            y: 0.1,
            z: 0.1,
            duration: 0.8,
            ease: 'power2.in'
        }, '<');
        
        currentModel.hide();
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Ensure complete cleanup
        if (currentModel.group) {
            scene.remove(currentModel.group);
            currentModel.group.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        if (currentModel.dispose) {
            currentModel.dispose();
        }
        currentModel = null;
    }
    
    currentPage = index;
    
    try {
        const pageTitle = pages[currentPage].title;
        console.log('Loading model for page:', pageTitle);
        
        // Dynamic import based on page title
        let ModelClass;
        let cameraPosition;
        let modelScale;
        let modelRotation;
        
        switch (pageTitle) {
            case 'Introduction':
                ModelClass = InspiringBackground;
                cameraPosition = { x: 0, y: 0, z: 35 };
                modelScale = 6.0;
                modelRotation = Math.PI * 4;
                break;
            case 'Military Career':
                const { MilitaryAchievements } = await import('./models/MilitaryAchievements.js');
                ModelClass = MilitaryAchievements;
                cameraPosition = { x: 12, y: 5, z: 30 };
                modelScale = 8.0;
                modelRotation = Math.PI * 3;
                break;
            case 'Transition to Politics':
                const { TransitionPath } = await import('./models/TransitionPath.js');
                ModelClass = TransitionPath;
                cameraPosition = { x: 0, y: 12, z: 40 };
                modelScale = 7.0;
                modelRotation = Math.PI * 2;
                break;
            case 'Leadership Journey':
                const { LeadershipRibbons } = await import('./models/LeadershipRibbons.js');
                ModelClass = LeadershipRibbons;
                cameraPosition = { x: 8, y: 8, z: 32 };
                modelScale = 8.0;
                modelRotation = Math.PI * 3;
                break;
            case 'Political Achievements':
                const { PoliticalNetwork } = await import('./models/PoliticalNetwork.js');
                ModelClass = PoliticalNetwork;
                cameraPosition = { x: 0, y: 0, z: 38 };
                modelScale = 7.0;
                modelRotation = Math.PI * 2.5;
                break;
            case 'Future Vision':
                const { FutureVision } = await import('./models/FutureVision.js');
                ModelClass = FutureVision;
                cameraPosition = { x: 5, y: 10, z: 35 };
                modelScale = 7.0;
                modelRotation = Math.PI * 3;
                break;
            default:
                console.warn('No model found for page:', pageTitle);
                return;
        }

        if (ModelClass) {
            console.log('Creating model:', ModelClass.name);
            currentModel = new ModelClass(scene);
            
            // Start model from very far away and tiny
            if (currentModel.group) {
                currentModel.group.scale.set(0.1, 0.1, 0.1);
                currentModel.group.position.z = -200;
                currentModel.group.rotation.y = -modelRotation;
            }
            
            console.log('Showing model...');
            currentModel.show();
            
            // Super dramatic animation sequence
            const timeline = gsap.timeline({
                defaults: { duration: 3, ease: 'power2.inOut' }
            });
            
            // First quick zoom out
            timeline.to(camera.position, {
                z: 250,
                duration: 1,
                ease: 'power2.in'
            })
            // Then dramatic zoom in with model scaling and rotation
            .to([camera.position, currentModel.group.position], {
                x: (i) => i === 0 ? cameraPosition.x : 0,
                y: (i) => i === 0 ? cameraPosition.y : 0,
                z: (i) => i === 0 ? cameraPosition.z : 0,
                duration: 2.5,
                ease: 'power3.out'
            }, '>')
            .to(currentModel.group.scale, {
                x: modelScale,
                y: modelScale,
                z: modelScale,
                duration: 2.5,
                ease: 'power2.out'
            }, '<')
            .to(currentModel.group.rotation, {
                y: 0,
                duration: 2.8,
                ease: 'power1.out'
            }, '<')
            // Add floating point lights
            .to(pointLight1.position, {
                x: Math.random() * 50 - 25,
                y: Math.random() * 50 - 25,
                z: Math.random() * 50 - 25,
                duration: 2,
                ease: 'power1.inOut'
            }, '<0.5')
            .to(pointLight2.position, {
                x: Math.random() * 50 - 25,
                y: Math.random() * 50 - 25,
                z: Math.random() * 50 - 25,
                duration: 2,
                ease: 'power1.inOut'
            }, '<0.2');
            
            // Reset and adjust controls
            controls.reset();
            controls.target.set(0, 0, 0);
            controls.update();
        }
        
        updateUI();
        
        // Reposition floating images for new page
        if (floatingImages) {
            floatingImages.positionForPage(index);
        }
        
    } catch (error) {
        console.error('Error loading model:', error);
        currentModel = null;
    }
}

function updateUI() {
    // Reset classes
    narrativeContainer.className = 'narrative-container';
    narrativeText.className = 'narrative-text';
    
    // Add page-specific class
    narrativeContainer.classList.add(`page-${currentPage}`);
    
    // Update content
    const titles = {
        0: "VISI INSPIRATIF",
        1: "DEDIKASI MILITER",
        2: "TRANSFORMASI POLITIK",
        3: "JEJAK KEPEMIMPINAN",
        4: "PRESTASI POLITIK",
        5: "VISI MASA DEPAN"
    };
    
    // Set content
    pageTitle.textContent = titles[currentPage];
    narrativeText.textContent = pages[currentPage].content;
    
    // Update timeline points
    const points = timeline.querySelectorAll('.timeline-point');
    points.forEach((point, index) => {
        point.classList.toggle('active', index === currentPage);
    });
    
    // Update progress
    progressFill.style.width = `${((currentPage + 1) / pages.length) * 100}%`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === pages.length - 1;
}

// Animate point lights continuously
function animatePointLights(time) {
    if (pointLight1 && pointLight2) {
        pointLight1.position.x = Math.sin(time * 0.3) * 30;
        pointLight1.position.y = Math.cos(time * 0.5) * 30;
        pointLight2.position.x = Math.cos(time * 0.4) * 30;
        pointLight2.position.y = Math.sin(time * 0.6) * 30;
    }
}

// Simple animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    const time = clock ? clock.getElapsedTime() : 0;
    
    if (backgroundParticles) {
        backgroundParticles.update(time);
    }
    
    if (currentModel && currentModel.update) {
        try {
            currentModel.update(time);
        } catch (error) {
            try {
                currentModel.update();
            } catch (innerError) {
                console.error('Error updating model:', innerError);
            }
        }
    }
    
    // Update floating logo only
    if (floatingLogo) {
        floatingLogo.update(time);
    }
    
    animatePointLights(time);
    
    try {
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Render error:', error);
    }
}

// Basic resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Event listeners
prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

// Add keyboard navigation
window.addEventListener('keydown', (event) => {
    // Prevent default behavior for arrow keys
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
    }

    switch (event.key) {
        case 'ArrowLeft':
            if (currentPage > 0) {
                // Add visual feedback for button
                prevBtn.classList.add('active');
                setTimeout(() => prevBtn.classList.remove('active'), 200);
                goToPage(currentPage - 1);
            }
            break;
        case 'ArrowRight':
            if (currentPage < pages.length - 1) {
                // Add visual feedback for button
                nextBtn.classList.add('active');
                setTimeout(() => nextBtn.classList.remove('active'), 200);
                goToPage(currentPage + 1);
            }
            break;
    }
});

// Start
try {
    clock = new THREE.Clock();
    
    // Create persistent floating logo and images
    floatingLogo = new FloatingLogo(scene);
    floatingImages = new FloatingImages(scene);
    
    goToPage(0);
    animate();
    loadingScreen.style.display = 'none';
    
    // Show keyboard navigation hint
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.innerHTML = `
        <div class="hint-content">
            <span>⬅️ Gunakan tombol panah untuk navigasi ➡️</span>
        </div>
    `;
    document.body.appendChild(hint);
    
    // Hide hint after 3 seconds
    setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 500);
    }, 3000);
} catch (error) {
    console.error('Error:', error);
    loadingScreen.innerHTML = '<div class="error-message"><p>Terjadi kesalahan saat memuat aplikasi.</p></div>';
}

// Clean up on window unload
window.addEventListener('unload', () => {
    if (backgroundParticles) {
        backgroundParticles.dispose();
    }
    if (currentModel) {
        currentModel.dispose();
    }
    if (floatingLogo) {
        floatingLogo.dispose();
    }
    if (floatingImages) {
        floatingImages.dispose();
    }
}); 