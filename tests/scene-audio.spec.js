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
  audio: narrationDataUri,
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
