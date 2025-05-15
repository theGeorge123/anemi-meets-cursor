// Language handling
let currentLanguage = localStorage.getItem('language') || 'en';
let translations = {};

// Load translations
async function loadTranslations() {
    try {
        const response = await fetch('/lang.json');
        translations = await response.json();
        updateLanguage();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

function updateLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[`${key}_${currentLanguage}`];
        if (translation) {
            element.textContent = translation;
        }
    });
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'nl' : 'en';
    localStorage.setItem('language', currentLanguage);
    updateLanguage();
}

// Progress bar
function updateProgress(percent) {
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
}

// Form handling
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });

    return isValid;
}

// Time slot handling
function addTimeSlot() {
    const timeSlots = document.getElementById('timeSlots');
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.innerHTML = `
        <input type="datetime-local" required>
        <button type="button" class="button secondary" onclick="removeTimeSlot(this)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" stroke-width="2"/>
            </svg>
        </button>
    `;
    timeSlots.appendChild(timeSlot);
}

function removeTimeSlot(button) {
    const timeSlots = document.getElementById('timeSlots');
    if (timeSlots.children.length > 1) {
        button.parentElement.remove();
    }
}

// Café handling
const defaultCafes = [
    "Coffee & Coconuts",
    "Back to Black",
    "Lot Sixty One",
    "Scandinavian Embassy",
    "Toki",
    "Bocca Coffee"
];

function addCafe() {
    const cafeList = document.getElementById('cafeList');
    const cafeItem = document.createElement('div');
    cafeItem.className = 'cafe-item';
    cafeItem.innerHTML = `
        <input type="text" name="cafes[]" required>
        <button type="button" class="button secondary" onclick="removeCafe(this)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" stroke-width="2"/>
            </svg>
        </button>
    `;
    cafeList.appendChild(cafeItem);
}

function removeCafe(button) {
    const cafeList = document.getElementById('cafeList');
    if (cafeList.children.length > 1) {
        button.parentElement.remove();
    }
}

function shuffleCafes() {
    const cafeInputs = document.querySelectorAll('#cafeList input');
    const shuffledCafes = [...defaultCafes].sort(() => Math.random() - 0.5);
    
    cafeInputs.forEach((input, index) => {
        input.value = shuffledCafes[index % shuffledCafes.length];
    });
}

// Cookie banner
function showCookieBanner() {
    if (!localStorage.getItem('cookiesAccepted')) {
        const banner = document.querySelector('.cookie-banner');
        if (banner) {
            banner.classList.add('visible');
        }
    }
}

function acceptCookies() {
    localStorage.setItem('cookiesAccepted', 'true');
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.classList.remove('visible');
    }
}

function declineCookies() {
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.classList.remove('visible');
    }
}

// Lottie animation
function initLottie() {
    const container = document.querySelector('.lottie-container');
    if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Load Lottie script dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.7.14/lottie.min.js';
        script.onload = () => {
            lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: false,
                autoplay: true,
                path: 'https://assets2.lottiefiles.com/packages/lf20_obhph3sh.json'
            });
        };
        document.head.appendChild(script);
    }
}

// Share link handling
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    
    // Show feedback
    const button = shareLink.nextElementSibling;
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').textContent = currentLanguage === 'en' ? 'Copied!' : 'Gekopieerd!';
    
    setTimeout(() => {
        button.querySelector('span').textContent = originalText;
    }, 2000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTranslations();
    showCookieBanner();
    
    // Initialize Lottie on success page
    if (window.location.pathname === '/success.html') {
        initLottie();
    }
    
    // Set progress based on current page
    const path = window.location.pathname;
    if (path === '/create.html') {
        updateProgress(25);
    } else if (path === '/invite.html') {
        updateProgress(75);
    } else if (path === '/success.html') {
        updateProgress(100);
    }
    
    // Form submission handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!validateForm(form)) {
                e.preventDefault();
                return;
            }
            
            // Store form data in localStorage
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            localStorage.setItem('meetupData', JSON.stringify(data));
        });
    });
}); 