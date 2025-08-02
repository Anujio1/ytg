export default function initTelegram() {
  // Safely check for Telegram WebApp environment
  if (typeof window === 'undefined' || !(window as any).Telegram?.WebApp) {
    const profileContainer = document.getElementById('profile-container');
    if (profileContainer) profileContainer.style.display = 'none';
    return;
  }

  // Type assertion for TypeScript
  const telegram = (window as any).Telegram;
  const tg = telegram.WebApp;
  
  // Initialize Telegram Web App
  tg.ready();
  
  // Handle start parameter for Mini App direct links
  handleStartParameter(tg);
  
  // Handle user profile if available
  if (tg.initDataUnsafe?.user) {
    initUserProfile(tg.initDataUnsafe.user);
  } else {
    // Hide profile container if no user data
    const profileContainer = document.getElementById('profile-container');
    if (profileContainer) profileContainer.style.display = 'none';
  }
  
  // Telegram-specific configurations
  configureTelegramApp(tg);
}

function handleStartParameter(tg: any) {
  try {
    // Get the start parameter
    const startParam = tg.initDataUnsafe?.start_param;
    
    if (startParam) {
      // Check if we already have the 's' parameter in URL
      const currentUrl = new URL(window.location.href);
      const existingParam = currentUrl.searchParams.get('s');
      
      if (!existingParam) {
        // Add the parameter to current URL
        currentUrl.searchParams.set('s', startParam);
        // Update URL without reload
        window.history.replaceState({}, '', currentUrl.toString());
        
        // Store in window for other parts of the app to use
        (window as any).telegramStartParam = startParam;
        
        // Dispatch custom event that other parts of your app can listen to
        window.dispatchEvent(new CustomEvent('telegram-start-param', { 
          detail: { param: startParam } 
        }));
      }
    }
    
    // Store Telegram context
    (window as any).telegramContext = {
      isActive: true,
      startParam: startParam,
      chatType: tg.initDataUnsafe?.chat_type,
      chatInstance: tg.initDataUnsafe?.chat_instance,
      user: tg.initDataUnsafe?.user
    };
  } catch (error) {
    console.error('Error handling Telegram start parameter:', error);
  }
}

function initUserProfile(user: any) {
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

  } catch (error) {
    console.error('Error initializing Telegram profile:', error);
    const container = document.getElementById('profile-container');
    if (container) container.style.display = 'none';
  }
}

function configureTelegramApp(tg: any) {
  try {
    // Expand the WebApp to full viewport
    if (tg.expand) {
      tg.expand();
    }
    
    // Set header color to match your app (adjust color as needed)
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#000000'); // or your app's header color
    }
    
    // Enable closing confirmation if needed
    // tg.enableClosingConfirmation();
    
    // Set background color if needed
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#ffffff'); // or your app's background color
    }
    
  } catch (error) {
    console.error('Error configuring Telegram app:', error);
  }
}

// Helper function to get start parameter (can be used by other modules)
export function getTelegramStartParam(): string | null {
  if (typeof window !== 'undefined') {
    // First check if we have it in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get('s');
    if (sParam) return sParam;
    
    // Check if we stored it
    if ((window as any).telegramStartParam) {
      return (window as any).telegramStartParam;
    }
    
    // Try to get it directly from Telegram
    if ((window as any).Telegram?.WebApp?.initDataUnsafe?.start_param) {
      return (window as any).Telegram.WebApp.initDataUnsafe.start_param;
    }
  }
  return null;
}

// Helper function to check if running in Telegram
export function isInTelegram(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp;
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initTelegram();
  } else {
    window.addEventListener('DOMContentLoaded', initTelegram);
  }
}
