import { loadingScreen, queuelist, title } from "../lib/dom";
import { generateImageUrl } from "../lib/imageUtils";
import player from "../lib/player";
import { setState, state, store } from "../lib/store";
import { handleXtags, preferredStream, proxyHandler } from "../lib/utils";
import getStreamData from "../modules/getStreamData";
import Selector from "./Selector";
import { html, render } from 'uhtml';

export default async function(dialog: HTMLDialogElement) {
  loadingScreen.showModal();

  const media = {
    video: [] as string[][],
    captions: [] as Captions[]
  };
  let video!: HTMLVideoElement;
  const audio = new Audio();
  const savedQ = state.watchMode;

  // Check for AV1 support
  const supportsAv1 = await navigator.mediaCapabilities
    .decodingInfo({
      type: 'file',
      video: {
        contentType: 'video/mp4; codecs="av01.0.00M.08"',
        bitrate: 1e7,
        framerate: 22,
        height: 720,
        width: 1280
      }
    })
    .then(result => result.supported);

  // Get stream data
  const data = await getStreamData(store.actionsMenu.id) as unknown as Piped & {
    captions: Captions[],
    videoStreams: Record<'url' | 'type' | 'resolution', string>[],
    audioStreams: Record<'url' | 'mimeType' | 'bitrate', string>[]
  };

  const hasAv1 = data.videoStreams.find(v => v.type.includes('av01'))?.url;
  const hasVp9 = data.videoStreams.find(v => v.type.includes('vp9'))?.url;
  const hasOpus = data.audioStreams.find(a => a.mimeType.includes('opus'))?.url;
  const useOpus = hasOpus && await store.player.supportsOpus;

  // Process audio streams
  const audioArray = handleXtags(data.audioStreams)
    .filter(a => a.mimeType.includes(useOpus ? 'opus' : 'mp4a'))
    .sort((a, b) => parseInt(a.bitrate) - parseInt(b.bitrate));

  // Process video streams with codec filtering
  media.video = data.videoStreams
    .filter(f => {
      const av1 = hasAv1 && supportsAv1 && f.type.includes('av01');
      if (av1) return true;
      const vp9 = !hasAv1 && f.type.includes('vp9');
      if (vp9) return true;
      const avc = !hasVp9 && f.type.includes('avc1');
      if (avc) return true;
      return false;
    })
    .map(f => ([f.resolution, f.url]));

  media.captions = data.captions;

  // Determine default resolution
  let defaultResolution: string | null = null;
  let defaultUrl: string | null = null;

  if (media.video.length) {
    // Priority order for default resolution
    const resolutionPriority = ['360p', '380p', '240p', '144p'];

    // 1. Check if user has a saved preference
    if (savedQ) {
      const savedOption = media.video.find(v => v[0] === savedQ);
      if (savedOption) {
        defaultResolution = savedQ;
        defaultUrl = savedOption[1];
      }
    }

    // 2. If no saved preference or invalid, find best match from priority list
    if (!defaultUrl) {
      for (const res of resolutionPriority) {
        const match = media.video.find(v =>
          v[0].toLowerCase().includes(res.toLowerCase())
        );
        if (match) {
          defaultResolution = match[0];
          defaultUrl = match[1];
          break;
        }
      }

      // 3. Fallback to first available if no matches found
      if (!defaultUrl) {
        [defaultResolution, defaultUrl] = media.video[0];
      }
    }
  }

  function close() {
    audio.pause();
    video.pause();
    dialog.close();
    dialog.remove();
    title.textContent = store.stream.title || 'Now Playing';
  }

  const videoTemplate = html`
    <video
      ref=${(_: HTMLVideoElement) => video = _}
      controls
      poster=${generateImageUrl(store.actionsMenu.id, 'mq')}
      @play=${() => {
        audio.play();
        audio.currentTime = video.currentTime;
      }}
      @pause=${() => {
        audio.pause();
        audio.currentTime = video.currentTime;
      }}
      @ended=${() => {
        if (!queuelist.childElementCount) return;
        close();
        store.queue.firstChild()?.click();
      }}
      @waiting=${() => {
        if (!audio.paused) audio.pause();
      }}
      @timeupdate=${() => {
        const diff = audio.currentTime - video.currentTime;
        const vpr = video.playbackRate;
        const npr = vpr - diff;
        if (npr < 0) return;
        const rpr = Math.round(npr * 100) / 100;
        if (rpr !== audio.playbackRate) audio.playbackRate = rpr;
      }}
      @loadstart=${() => {
        if (!audio.paused) audio.pause();
      }}
      @playing=${() => {
        if (audio.paused) audio.play();
      }}
      @seeked=${() => {
        audio.currentTime = video.currentTime;
      }}
      @ratechange=${() => {
        audio.playbackRate = video.playbackRate;
      }}
      @error=${() => {
        if (video.src.endsWith('&fallback')) return;
        const origin = new URL(video.src).origin;

        if (store.api.index < store.api.invidious.length) {
          const proxy = store.api.invidious[store.api.index];
          video.src = video.src.replace(origin, proxy);
          audio.src = audio.src.replace(origin, proxy);
          store.api.index++;
        }
      }}
    >
      ${media.captions.length ? html`
        ${media.captions.map(v => html`
          <track
            src=${store.api.invidious[0] + v.url}
            srclang=${v.label}
          ></track>
        `)}
      ` : ''}
    </video>
  `;

  const footerTemplate = html`
    <div>
      <button @click=${close}>Close</button>

      ${media.video.length ? Selector({
        id: 'videoCodecSelector',
        label: '',
        handler: (e) => {
          video.src = proxyHandler(e.target.value, true);
          video.currentTime = audio.currentTime;
          setState('watchMode', e.target.selectedOptions[0].textContent as string);
        },
        children: html`
          <option>Video</option>
          ${media.video.map(f => html`
            <option
              value=${f[1]}
              selected=${f[0] === defaultResolution}
            >${f[0]}</option>
          `)}
        `,
        // Fix: Remove unused 'select' parameter
        onmount: () => {
          if (defaultUrl) {
            video.src = proxyHandler(defaultUrl, true);
          }
        }
      }) : ''}

      <button @click=${() => {
        player(store.actionsMenu.id);
        close();
      }}>Listen</button>

      <br/><br/>
      <i>Because video streaming consumes a lot of energy, contributing to carbon emissions, please try to watch only what's necessary. When you do stream, select the lowest resolution that meets your needs.</i>
    </div>
  `;

  render(dialog, html`
    ${videoTemplate}
    ${footerTemplate}
  `);

  const stream = await preferredStream(handleXtags(audioArray));
  audio.src = proxyHandler(stream.url, true);
  audio.currentTime = video.currentTime;
  loadingScreen.close();
}
