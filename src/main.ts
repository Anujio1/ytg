import './stylesheets/global.css';
import './scripts/i18n';
import './scripts/telegram';
import './scripts/router';
import './scripts/audioEvents';
import './scripts/list';
import './scripts/search';
import './scripts/theme';
import { getTelegramStartParam, isInTelegram } from './scripts/telegram';

// Function to handle Telegram deep link parameters
async function handleTelegramDeepLink() {
  const startParam = getTelegramStartParam();
  
  if (startParam) {
    console.log('Handling Telegram start parameter:', startParam);
    
    // Wait for the app to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if this is a video/track ID
    // You might need to adjust this based on your app's logic
    if (startParam) {
      // Option 1: If you have a direct play function
      // Example: playTrackById(startParam);
      
      // Option 2: Navigate to the track
      // This assumes your router can handle this
      const homeSection = document.querySelector('a[href="/"]');
      if (homeSection) {
        (homeSection as HTMLElement).click();
      }
      
      // Option 3: Trigger a search
      // const searchInput = document.getElementById('superInput') as HTMLInputElement;
      // if (searchInput) {
      //   searchInput.value = startParam;
      //   searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      // }
      
      // Option 4: If you have a specific function to load content
      // You'll need to import or define this based on your app structure
      // loadContentById(startParam);
    }
  }
}

addEventListener('DOMContentLoaded', async () => {
  // Initialize the app first
  (await import('./modules/start')).default();

  (await import('./components/SuperCollectionList')).default();

  // Handle Telegram deep links after initialization
  if (isInTelegram()) {
    await handleTelegramDeepLink();
    
    // Listen for custom event in case parameter comes later
    window.addEventListener('telegram-start-param', async (event: any) => {
      const param = event.detail.param;
      console.log('Received Telegram parameter via event:', param);
      // Handle the parameter
      await handleTelegramDeepLink();
    });
  }

  const settingsHandler = document.getElementById('settingsHandler');
  settingsHandler?.addEventListener('click', async () => {
    (await import('./components/Settings/index')).default();
  });
  
  const fullscreenToggle = document.getElementById('fullscreenBtn');
  fullscreenToggle?.addEventListener('click', () => {
    if (document.fullscreenElement)
      document.exitFullscreen();
    else
      document.documentElement.requestFullscreen();
  });

  // Check URL parameters on load (for both Telegram and direct access)
  const urlParams = new URLSearchParams(window.location.search);
  const sParam = urlParams.get('s');
  
  if (sParam && !isInTelegram()) {
    // Handle direct URL parameter (non-Telegram)
    console.log('Direct URL parameter:', sParam);
    // Add your handling logic here
  }
  
  if (import.meta.env.PROD)
    await import('virtual:pwa-register').then(pwa => {
      const handleUpdate = pwa.registerSW({
        onNeedRefresh() {
          const dialog = document.createElement('dialog') as HTMLDialogElement;
          dialog.addEventListener('click', (e) => {
            const elm = e.target as HTMLButtonElement;
            if (elm.id === 'updateBtn' || elm.closest('#updateBtn'))
              handleUpdate();
            if (elm.id === 'laterBtn' || elm.closest('#laterBtn')) {
              dialog.close();
              dialog.remove();
            }
          })

          import('./components/UpdatePrompt')
            .then(mod => mod.default(dialog))
            .then(() => document.body.appendChild(dialog));
        }
      });
    });
})
