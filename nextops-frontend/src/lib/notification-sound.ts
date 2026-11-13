const MUTE_STORAGE_KEY = 'nextops:notification-sound-muted';
const DEFAULT_AUDIO_PATH = '/uploads/voice/mixkit-im-all-yours-.mp3';

let activeAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

export function isNotificationSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
}

export function setNotificationSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false');
  if (muted) {
    stopNotificationSound();
  }
}

export function stopNotificationSound(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
}

export function initAudioAutoUnlock(): void {
  if (typeof window === 'undefined' || audioUnlocked) return;

  const unlock = (): void => {
    audioUnlocked = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export async function playIncomingMessageSound(): Promise<void> {
  if (typeof window === 'undefined' || isNotificationSoundMuted()) return;

  stopNotificationSound();

  const backendOrigin = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
  const audio = new Audio(`${backendOrigin}${DEFAULT_AUDIO_PATH}`);
  audio.volume = 0.85;
  activeAudio = audio;

  audio.addEventListener('ended', () => {
    if (activeAudio === audio) {
      activeAudio = null;
    }
  });

  try {
    await audio.play();
  } catch {
    activeAudio = null;
  }
}
