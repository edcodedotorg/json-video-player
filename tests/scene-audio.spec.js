import { test, expect } from '@playwright/test';

// Scene audio must follow the player's own play/pause state, not only
// scene transitions and seeks. A video whose narration lives on each
// scene (no top-level `audio` track) used to stay silent until the
// user scrubbed, because play() only resumed the main track.

// 8 kHz 8-bit mono silence, as a data URI the <audio> can decode.
function silentWavDataUri(seconds) {
  const sampleRate = 8000;
  const samples = sampleRate * seconds;
  const buf = Buffer.alloc(44 + samples, 0x80);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate, 28);
  buf.writeUInt16LE(1, 32);
  buf.writeUInt16LE(8, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples, 40);
  return 'data:audio/wav;base64,' + buf.toString('base64');
}

function sceneAudioState(page) {
  return page.evaluate(() => {
    const a = document.getElementById('player')._sceneAudio;
    return { paused: a.paused, currentTime: a.currentTime, src: a.getAttribute('src')?.slice(0, 14) };
  });
}

async function loadProject(page, project) {
  await page.goto('/');
  await page.locator('#video-json').fill(JSON.stringify(project));
  await page.getByRole('button', { name: 'Render in Player' }).click();
  await expect.poll(() => page.evaluate(() => document.getElementById('player').duration)).toBeGreaterThan(0);
}

// Scenes are long enough that no scene boundary (which also starts scene
// audio) can fall inside a test's polling window.
const scene = (label) => ({
  duration: '30s',
  speech: label,
  html: `<h1>${label}</h1>`,
  audio: silentWavDataUri(12),
});

test.describe('per-scene audio', () => {
  test('starts when play is pressed on a fresh load', async ({ page }) => {
    await loadProject(page, { scenes: [scene('one'), scene('two')] });

    const playBtn = page.locator('#player').locator('#play-btn');
    await playBtn.click();

    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(false);
    await expect.poll(async () => (await sceneAudioState(page)).currentTime).toBeGreaterThan(0.1);
    expect(await page.evaluate(() => document.getElementById('player').currentTime)).toBeLessThan(30);
  });

  test('resumes after pause within the same scene', async ({ page }) => {
    await loadProject(page, { scenes: [scene('one'), scene('two')] });
    const playBtn = page.locator('#player').locator('#play-btn');

    await playBtn.click();
    await expect.poll(async () => (await sceneAudioState(page)).currentTime).toBeGreaterThan(0.1);

    await playBtn.click(); // pause
    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(true);
    const pausedAt = (await sceneAudioState(page)).currentTime;

    await playBtn.click(); // resume
    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(false);
    await expect.poll(async () => (await sceneAudioState(page)).currentTime).toBeGreaterThan(pausedAt);
  });

  test('stops when the player is paused', async ({ page }) => {
    await loadProject(page, { scenes: [scene('one')] });
    const playBtn = page.locator('#player').locator('#play-btn');

    await playBtn.click();
    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(false);
    await playBtn.click();
    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(true);
  });
});
