import { html } from 'uhtml';
import ToggleSwitch from './ToggleSwitch';
import Selector from '../Selector';
import { i18n } from '../../scripts/i18n';
import { setState, state, store } from '../../lib/store';
import { notify } from '../../lib/utils';

export default function() {
  return html`
    <div>
      <b id="ytifyIconContainer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="0.8rem" height="0.8rem"
          style="transform: scale(1.5);overflow:hidden;">
          <path fill="var(--text)"
            d="M7.942,0.751 L6.035,0.042 L6.035,11.139 C5.433,11.089 4.75,11.176 4.111,11.438 C2.517,12.089 1.689,13.655 2.146,14.75 C2.604,15.848 4.175,16.354 5.767,15.703 C6.991,15.203 7.84,14.252 7.951,13.341 L7.943,3.524 C10.57,4.322 12.463,5.197 12.463,7.808 C12.463,8.735 13.983,9.631 13.983,5.996 C13.982,2.904 11.33,1.034 7.942,0.751 L7.942,0.751 Z" />
        </svg>
        <p>SounDroid ${Build}</p>
      </b>

      ${ToggleSwitch({
    id: 'customInstanceSwitch',
    name: 'settings_custom_instance',
    checked: Boolean(state.customInstance),
    handler: () => {
      let stateVal = '';
      if (!state.customInstance) {
        const pi = prompt(i18n('settings_enter_piped_api'), 'https://pipedapi.kavin.rocks');
        const iv = prompt(i18n('settings_enter_invidious_api'), 'https://iv.ggtyler.dev');
        const useIv = confirm('Use Invidious For Playback?');

        if (pi && iv)
          stateVal = pi + ',' + iv + ',' + useIv;
      }
      setState('customInstance', stateVal);
      notify(i18n('settings_reload'));
    }
  })}

      ${Selector({
    label: 'settings_language',
    id: 'languageSelector',
    handler: (e) => {
      setState('language', e.target.value);
      notify(i18n('settings_reload'));
    },
    onmount: (target) => {
      target.value = document.documentElement.lang;
    },
    children: html`${Locales.map(item => html`
          <option value=${item}>${new Intl.DisplayNames(document.documentElement.lang, { type: 'language' }).of(item)}</option>
        `)}`
  })}

      ${Selector({
    id: 'linkHost',
    label: 'settings_links_host',
    handler: (e) => {
      const stateVal = e.target.selectedIndex === 0 ? '' : e.target.value;
      store.linkHost = stateVal || location.origin;
      setState('linkHost', stateVal);
      notify(i18n('settings_reload'));
    },
    onmount: (target) => {
      if (state.linkHost)
        target.value = state.linkHost;
    },
    children: html`
        <option value="https://ytbra.netlify.app">SounDroid</option>
          <option value="https://youtube.com">YouTube</option>
          <option value="https://piped.video">Piped</option>
          <option value="https://inv.nadeko.net">Invidious</option>
          <option value="https://viewtube.io">ViewTube</option>
        `
  })}

      ${Selector({
    id: 'downloadFormatSelector',
    label: 'settings_download_format',
    handler: (e) => {
      setState('dlFormat', e.target.value as 'opus' | 'mp3' | 'wav' | 'ogg');
    },
    onmount: (target) => {
      target.value = state.dlFormat;
    },
    children: html`
          <option value='opus'>Opus</option>
          <option value='mp3'>MP3</option>
          <option value='wav'>WAV</option>
          <option value='ogg'>OGG</option>
        `
  })}

      ${Selector({
    id: 'shareAction',
    label: 'settings_pwa_share_action',
    handler: (e) => {
      setState('shareAction', e.target.value as 'play' | 'watch' | 'download');
    },
    onmount: (target) => {
      target.value = state.shareAction;
    },
    children: html`
          <option value='play'>${i18n('settings_pwa_play')}</option>
          <option value='watch'>${i18n('settings_pwa_watch')}</option>
          <option value='dl'>${i18n('settings_pwa_download')}</option>
        `
  })}
    </div>
  `;
}
