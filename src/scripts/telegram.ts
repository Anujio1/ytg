// src/scripts/telegram.ts
export default function initTelegram() {
  // Safely check for Telegram WebApp environment
  if (typeof window === 'undefined' || !(window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
    const profileContainer = document.getElementById('profile-container');
    if (profileContainer) profileContainer.style.display = 'none';
    return;
  }

  // Type assertion for TypeScript
  const telegram = (window as any).Telegram;
  const user = telegram.WebApp.initDataUnsafe.user;
  
  try {
    // Get all required DOM elements
    const elements = {
      container: document.getElementById('profile-container'),
      circle: document.getElementById('profile-circle'),
      pic: document.getElementById('profile-pic') as HTMLImageElement | null,
      fullPic: document.getElementById('full-profile-pic') as HTMLImageElement | null,
      name: document.getElementById('profile-name'),
      username: document.getElementById('profile-username'),
      infoDialog: document.getElementById('profile-info') as HTMLDialogElement | null,
      closeBtn: document.getElementById('close-profile')
    };

    // Validate required elements exist
    if (!elements.container || !elements.circle || !elements.infoDialog) {
      console.error('Missing required profile elements');
      return;
    }

    // Show the profile container
    elements.container.style.display = 'block';

    // Set profile pictures (with fallback)
    const avatarUrl = user.photo_url || '/default-avatar.png';
    if (elements.pic) elements.pic.src = avatarUrl;
    if (elements.fullPic) elements.fullPic.src = avatarUrl;

    // Set profile text content
    if (elements.name) {
      elements.name.textContent = [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    
    if (elements.username && user.username) {
      elements.username.textContent = `@${user.username}`;
    }

    // Add event listeners
    elements.circle.addEventListener('click', () => {
      elements.infoDialog?.showModal();
    });

    elements.closeBtn?.addEventListener('click', () => {
      elements.infoDialog?.close();
    });

    // Expand the WebApp to full viewport
    if (telegram.WebApp.expand) {
      telegram.WebApp.expand();
    }

  } catch (error) {
    console.error('Error initializing Telegram profile:', error);
    const container = document.getElementById('profile-container');
    if (container) container.style.display = 'none';
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initTelegram();
  } else {
    window.addEventListener('DOMContentLoaded', initTelegram);
  }
}