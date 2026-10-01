import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

// Scene audio must follow the player's own play/pause state, not only
// scene transitions and seeks. A video whose narration lives on each
// scene (no top-level `audio` track) used to stay silent until the
// user scrubbed, because play() only resumed the main track.

// One scene's narration from a real lesson export, about 17 s long, as the
// data URI the pipeline emits.
const narrationDataUri =
  'data:audio/mpeg;base64,' +
  fs.readFileSync(path.join(__dirname, 'fixtures', 'narration.mp3')).toString('base64');

function audioState(page, which) {
  return page.evaluate((which) => {
    const a = document.getElementById('player')[which];
    return { paused: a.paused, currentTime: a.currentTime, src: a.getAttribute('src')?.slice(0, 14) ?? null };
  }, which);
}
const sceneAudioState = (page) => audioState(page, '_sceneAudio');
const mainAudioState = (page) => audioState(page, '_mainAudio');

// Waits for the new project's total duration, so a reload into an
// already-loaded player is observed and not the previous video.
async function loadProject(page, project, expectedSeconds) {
  await page.locator('#video-json').fill(JSON.stringify(project));
  await page.getByRole('button', { name: 'Render in Player' }).click();
  await expect.poll(() => page.evaluate(() => document.getElementById('player').duration)).toBe(expectedSeconds);
}

// Scenes are long enough that no scene boundary (which also starts scene
// audio) can fall inside a test's polling window.
const scene = (label) => ({
  duration: '30s',
  speech: label,
  html: `<h1>${label}</h1>`,
  audio: narrationDataUri,
});

test.describe('per-scene audio', () => {
  test('starts when play is pressed on a fresh load', async ({ page }) => {
    await page.goto('/');
    await loadProject(page, { scenes: [scene('one'), scene('two')] }, 60);

    const playBtn = page.locator('#player').locator('#play-btn');
    await playBtn.click();

    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(false);
    await expect.poll(async () => (await sceneAudioState(page)).currentTime).toBeGreaterThan(0.1);
    expect(await page.evaluate(() => document.getElementById('player').currentTime)).toBeLessThan(30);
  });

  test('resumes after pause within the same scene', async ({ page }) => {
    await page.goto('/');
    await loadProject(page, { scenes: [scene('one'), scene('two')] }, 60);
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
    await page.goto('/');
    await loadProject(page, { scenes: [scene('one')] }, 30);
    const playBtn = page.locator('#player').locator('#play-btn');

    await playBtn.click();
    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(false);
    await playBtn.click();
    await expect.poll(async () => (await sceneAudioState(page)).paused).toBe(true);
  });
});

// Loading a new video into a player that already played one must not
// carry the old video's tracks across.
test.describe('switching videos', () => {
  const sceneOnly = { scenes: [scene('one'), scene('two')] };
  const mainOnly = {
    audio: narrationDataUri,
    scenes: [{ duration: '30s', speech: 'main', html: '<h1>main</h1>' }],
  };

  test('main track of the previous video does not play under a scene-audio video', async ({ page }) => {
    await page.goto('/');
    const playBtn = page.locator('#player').locator('#play-btn');

    await loadProject(page, mainOnly, 30);
    await playBtn.click();
    await expect.poll(async () => (await mainAudioState(page)).currentTime).toBeGreaterThan(0.1);

    await loadProject(page, sceneOnly, 60);
    expect(await mainAudioState(page)).toMatchObject({ paused: true, src: null });

    await playBtn.click();
    await expect.poll(async () => (await sceneAudioState(page)).currentTime).toBeGreaterThan(0.1);
    expect(await mainAudioState(page)).toMatchObject({ paused: true, src: null });
  });

  test('scene track of the previous video does not play under a main-audio video', async ({ page }) => {
    await page.goto('/');
    const playBtn = page.locator('#player').locator('#play-btn');

    await loadProject(page, sceneOnly, 60);
    await playBtn.click();
    await expect.poll(async () => (await sceneAudioState(page)).currentTime).toBeGreaterThan(0.1);

    await loadProject(page, mainOnly, 30);
    expect(await sceneAudioState(page)).toMatchObject({ paused: true, src: null });

    await playBtn.click();
    await expect.poll(async () => (await mainAudioState(page)).currentTime).toBeGreaterThan(0.1);
    expect(await sceneAudioState(page)).toMatchObject({ paused: true, src: null });
  });
});
