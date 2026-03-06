// Path waypoints - defines where the character can move
const pathWaypoints = [
    // Top left island (Projects)
    { x: 15, y: 10, connections: [1] },
    { x: 15, y: 21, connections: [0, 2] },
    
    // Horizontal connector (left)
    { x: 21, y: 21, connections: [1, 3] },
    
    // Vertical path down (left side)
    { x: 21, y: 30, connections: [2, 4] },
    { x: 21, y: 40, connections: [3, 5] },
    { x: 21, y: 50, connections: [4, 6] },
    
    // Bridge crossing
    { x: 30, y: 50, connections: [5, 7] },
    { x: 40, y: 50, connections: [6, 8] },
    { x: 50, y: 50, connections: [7, 9, 13] }, // Center junction
    { x: 60, y: 50, connections: [8, 10] },
    { x: 70, y: 50, connections: [9, 11] },
    
    // Right side vertical
    { x: 79, y: 50, connections: [10, 12] },
    { x: 79, y: 40, connections: [11, 14] },
    
    // Down from center to bottom island
    { x: 50, y: 60, connections: [8, 15] },
    
    // Right side up
    { x: 79, y: 30, connections: [12, 16] },
    
    // Bottom island (Hobbies)
    { x: 50, y: 70, connections: [13, 17] },
    
    // Top right connections
    { x: 79, y: 21, connections: [14, 18] },
    { x: 50, y: 77, connections: [15] }, // Hobbies node
    { x: 85, y: 21, connections: [16, 19] },
    
    // Top right island (About)
    { x: 85, y: 15, connections: [18] },
];

// Game state
const gameState = {
    character: {
        currentWaypoint: 0,
        speed: 0.5
    },
    keys: {},
    nearbyNode: null,
    moving: false
};

// DOM elements
const character = document.getElementById('character');
const gameWorld = document.getElementById('gameWorld');
const interactionPrompt = document.getElementById('interactionPrompt');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('closeBtn');
const modalBody = document.getElementById('modalBody');
const nodes = document.querySelectorAll('.node');

// Initialize character position
function initCharacter() {
    const startPoint = pathWaypoints[gameState.character.currentWaypoint];
    character.style.left = startPoint.x + '%';
    character.style.top = startPoint.y + '%';
}

// Key press handlers
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        gameState.keys[key] = true;
        e.preventDefault();
    }
    
    // Space bar for interaction
    if (e.key === ' ' && gameState.nearbyNode) {
        e.preventDefault();
        openModal(gameState.nearbyNode);
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    gameState.keys[key] = false;
});

// Find the best next waypoint based on direction
function getNextWaypoint(currentIdx, direction) {
    const current = pathWaypoints[currentIdx];
    const connections = current.connections;
    
    let bestWaypoint = null;
    let bestScore = -Infinity;
    
    connections.forEach(connIdx => {
        const conn = pathWaypoints[connIdx];
        const dx = conn.x - current.x;
        const dy = conn.y - current.y;
        
        let score = 0;
        
        switch(direction) {
            case 'w': // up
                score = -dy;
                break;
            case 's': // down
                score = dy;
                break;
            case 'a': // left
                score = -dx;
                break;
            case 'd': // right
                score = dx;
                break;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestWaypoint = connIdx;
        }
    });
    
    return bestScore > 0 ? bestWaypoint : null;
}

// Move character along path
function moveCharacter() {
    if (gameState.moving) return;
    
    let targetWaypoint = null;
    
    if (gameState.keys['w']) {
        targetWaypoint = getNextWaypoint(gameState.character.currentWaypoint, 'w');
    } else if (gameState.keys['s']) {
        targetWaypoint = getNextWaypoint(gameState.character.currentWaypoint, 's');
    } else if (gameState.keys['a']) {
        targetWaypoint = getNextWaypoint(gameState.character.currentWaypoint, 'a');
    } else if (gameState.keys['d']) {
        targetWaypoint = getNextWaypoint(gameState.character.currentWaypoint, 'd');
    }
    
    if (targetWaypoint !== null) {
        animateMovement(targetWaypoint);
    }
}

// Animate movement to target waypoint
function animateMovement(targetIdx) {
    gameState.moving = true;
    character.classList.add('moving');
    
    const current = pathWaypoints[gameState.character.currentWaypoint];
    const target = pathWaypoints[targetIdx];
    
    const startX = current.x;
    const startY = current.y;
    const endX = target.x;
    const endY = target.y;
    
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const duration = distance * 30; // Adjust speed here
    
    let startTime = null;
    
    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-in-out function
        const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentX = startX + (endX - startX) * easeProgress;
        const currentY = startY + (endY - startY) * easeProgress;
        
        character.style.left = currentX + '%';
        character.style.top = currentY + '%';
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            gameState.character.currentWaypoint = targetIdx;
            gameState.moving = false;
            character.classList.remove('moving');
            checkProximity();
        }
    }
    
    requestAnimationFrame(animate);
}

// Check if character is near any node
function checkProximity() {
    const charRect = character.getBoundingClientRect();
    const charCenterX = charRect.left + charRect.width / 2;
    const charCenterY = charRect.top + charRect.height / 2;
    
    let foundNearby = false;
    
    nodes.forEach(node => {
        const nodeRect = node.getBoundingClientRect();
        const nodeCenterX = nodeRect.left + nodeRect.width / 2;
        const nodeCenterY = nodeRect.top + nodeRect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(charCenterX - nodeCenterX, 2) + 
            Math.pow(charCenterY - nodeCenterY, 2)
        );
        
        if (distance < 150) {
            node.classList.add('nearby');
            gameState.nearbyNode = node.dataset.page;
            foundNearby = true;
            interactionPrompt.classList.add('visible');
        } else {
            node.classList.remove('nearby');
        }
    });
    
    if (!foundNearby) {
        gameState.nearbyNode = null;
        interactionPrompt.classList.remove('visible');
    }
}

// Open modal with content
function openModal(page) {
    const contentMap = {
        'projects': 'projectsContent',
        'about': 'aboutContent',
        'hobbies': 'hobbiesContent'
    };
    
    const contentId = contentMap[page];
    const content = document.getElementById(contentId);
    
    if (content) {
        modalBody.innerHTML = content.innerHTML;
        modal.classList.add('active');
    }
}

// Close modal
function closeModal() {
    modal.classList.remove('active');
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Game loop
function gameLoop() {
    moveCharacter();
    requestAnimationFrame(gameLoop);
}

// Click on nodes to open (alternative to WASD + space)
nodes.forEach(node => {
    node.addEventListener('click', () => {
        openModal(node.dataset.page);
    });
});

// Initialize and start
initCharacter();
checkProximity();
gameLoop();

// Debug: visualize waypoints (remove this in production)
/*
pathWaypoints.forEach((point, idx) => {
    const dot = document.createElement('div');
    dot.style.position = 'absolute';
    dot.style.left = point.x + '%';
    dot.style.top = point.y + '%';
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.background = 'red';
    dot.style.borderRadius = '50%';
    dot.style.zIndex = '1000';
    dot.title = idx;
    gameWorld.appendChild(dot);
});
*/