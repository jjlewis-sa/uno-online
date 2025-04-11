// Background animation
function initBackgroundAnimation() {
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create background elements (fewer for mobile)
    const gameContainer = document.getElementById('game-container');
    const bgContainer = document.createElement('div');
    bgContainer.className = 'background-animation';
    gameContainer.prepend(bgContainer);
    
    // Add animated elements - reduce count for mobile
    const elementCount = isMobile ? 5 : 20;
    
    for (let i = 0; i < elementCount; i++) {
        const element = document.createElement('div');
        element.className = 'animated-bg-element';
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        element.style.backgroundColor = ['#ff5555', '#55ff55', '#5555ff', '#ffff55'][Math.floor(Math.random() * 4)];
        element.style.opacity = '0.2';
        bgContainer.appendChild(element);
    }
    
    // Animate background elements - simpler animation for mobile
    anime({
        targets: '.animated-bg-element',
        translateX: function() { return anime.random(-150, 150); },
        translateY: function() { return anime.random(-150, 150); },
        scale: function() { return anime.random(1, isMobile ? 2 : 3); },
        opacity: function() { return anime.random(0.1, 0.3); },
        duration: function() { return anime.random(4000, 6000); }, // Slower animations
        delay: function() { return anime.random(0, 1000); },
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutQuad'
    });
}

// Card animations - simplified for mobile
function animateCardPlay(element) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create particle effects
    if (!isMobile) {
        createCardParticles(element);
    }
    
    // Add the played class which has the keyframe animation
    element.classList.add('played');
    
    // Additional anime.js animation
    anime({
        targets: element,
        scale: [1.2, 1],
        rotate: isMobile ? 0 : { value: '+=360', duration: 800 },
        opacity: [1, 0],
        duration: isMobile ? 400 : 800,
        easing: isMobile ? 'easeOutQuad' : 'easeOutElastic(1, .5)'
    });
}

// Button hover animations - disable on mobile
function initButtonAnimations() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Skip hover animations on mobile
    if (isMobile) return;
    
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            anime({
                targets: button,
                scale: 1.1,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
        
        button.addEventListener('mouseleave', () => {
            anime({
                targets: button,
                scale: 1,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
}

// Title animation - simplified
function animateTitle() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    anime({
        targets: 'h1',
        translateY: [-30, 0], // Less movement on all devices
        opacity: [0, 1],
        duration: isMobile ? 800 : 1500, // Faster on mobile
        easing: 'easeOutQuad' // Simpler easing for all devices
    });
}

// Screen transition animations - simplified
function animateScreenTransition(hideElement, showElement) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Simple fade for mobile
        hideElement.style.display = 'none';
        showElement.style.display = 'block';
        return;
    }
    
    anime({
        targets: hideElement,
        opacity: [1, 0],
        translateY: [0, -20],
        duration: 500,
        easing: 'easeOutQuad',
        complete: function() {
            hideElement.style.display = 'none';
            showElement.style.display = 'block';
            anime({
                targets: showElement,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 500,
                easing: 'easeOutQuad'
            });
        }
    });
}

// Color picker animation - simplified
function animateColorPicker() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    anime({
        targets: '#color-picker',
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: isMobile ? 300 : 500,
        easing: isMobile ? 'easeOutQuad' : 'easeOutElastic(1, .5)'
    });
    
    anime({
        targets: '.color-btn',
        scale: [0, 1],
        opacity: [0, 1],
        delay: isMobile ? anime.stagger(50) : anime.stagger(100),
        duration: isMobile ? 300 : 600,
        easing: isMobile ? 'easeOutQuad' : 'easeOutElastic(1, .5)'
    });
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Delay initialization to ensure page loads properly first
    setTimeout(() => {
        initBackgroundAnimation();
        initButtonAnimations();
        animateTitle();
    }, 300);
    
    // Override the original toggleGameRules function
    window.toggleGameRules = function() {
        const gameRules = document.getElementById('game-rules');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (gameRules.style.display === "none" || gameRules.style.display === "") {
            gameRules.style.display = "block";
            
            if (!isMobile) {
                anime({
                    targets: '#game-rules',
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 500,
                    easing: 'easeOutQuad'
                });
            }
        } else {
            if (!isMobile) {
                anime({
                    targets: '#game-rules',
                    opacity: [1, 0],
                    translateY: [0, 20],
                    duration: 500,
                    easing: 'easeOutQuad',
                    complete: function() {
                        gameRules.style.display = "none";
                    }
                });
            } else {
                gameRules.style.display = "none";
            }
        }
    };
});

// Create particle effects when a card is played
function createCardParticles(cardElement) {
    const rect = cardElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Get card color
    let color = '#ffffff';
    if (cardElement.classList.contains('red')) color = '#ff5555';
    if (cardElement.classList.contains('blue')) color = '#5555ff';
    if (cardElement.classList.contains('green')) color = '#55ff55';
    if (cardElement.classList.contains('yellow')) color = '#ffff55';
    
    // Create particle container if it doesn't exist
    let particleContainer = document.getElementById('particle-container');
    if (!particleContainer) {
        particleContainer = document.createElement('div');
        particleContainer.id = 'particle-container';
        particleContainer.style.position = 'fixed';
        particleContainer.style.top = '0';
        particleContainer.style.left = '0';
        particleContainer.style.width = '100%';
        particleContainer.style.height = '100%';
        particleContainer.style.pointerEvents = 'none';
        particleContainer.style.zIndex = '9999';
        document.body.appendChild(particleContainer);
    }
    
    // Create particles
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'card-particle';
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.backgroundColor = color;
        particle.style.borderRadius = '50%';
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particleContainer.appendChild(particle);
        particles.push(particle);
    }
    
    // Animate particles
    anime({
        targets: particles,
        translateX: function() { return anime.random(-150, 150); },
        translateY: function() { return anime.random(-150, 150); },
        scale: [1, 0],
        opacity: [1, 0],
        easing: 'easeOutExpo',
        duration: 1000,
        complete: function() {
            particles.forEach(p => p.remove());
        }
    });
}

// Card flip animation
function animateCardFlip(cardElement) {
    // Create flip container if not already wrapped
    if (!cardElement.classList.contains('card-flip')) {
        const flipContainer = document.createElement('div');
        flipContainer.className = 'card-flip';
        
        const inner = document.createElement('div');
        inner.className = 'card-inner';
        
        const front = document.createElement('div');
        front.className = 'card-front';
        
        const back = document.createElement('div');
        back.className = 'card-back';
        
        // Move card element's content to front
        while (cardElement.firstChild) {
            front.appendChild(cardElement.firstChild);
        }
        
        inner.appendChild(front);
        inner.appendChild(back);
        flipContainer.appendChild(inner);
        
        // Replace original card with flip container
        cardElement.parentNode.replaceChild(flipContainer, cardElement);
    }
}

// Export functions to be used in game.js
window.gameAnimations = {
    animateCardPlay,
    animateScreenTransition,
    animateColorPicker,
    initCardAnimations
};

// Anime-style card animations
function initCardAnimations() {
    // Wild card animation
    anime({
        targets: '.card.wild',
        background: [
            { value: 'linear-gradient(45deg, #ff5555 0%, #55ff55 25%, #5555ff 50%, #ffff55 75%, #ff5555 100%)' }
        ],
        backgroundSize: '400% 400%',
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        easing: 'linear',
        duration: 3000,
        loop: true
    });
    
    // Add subtle floating animation to all cards in hand
    anime({
        targets: '#player-hand .card',
        translateY: [0, -5, 0],
        duration: function() { return anime.random(2000, 4000); },
        delay: function() { return anime.random(0, 1000); },
        easing: 'easeInOutSine',
        loop: true,
        autoplay: true
    });
}