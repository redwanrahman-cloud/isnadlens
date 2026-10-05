import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'workspace.visual.mjs',workers:1,use:{headless:true,channel:'chrome'},outputDir:'../artifacts/private/visual-test-results',reporter:'list'});
