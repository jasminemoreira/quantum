import { defineConfig } from '@playwright/test';
// v10: webServer (http local) usado SÓ pelo pwa.spec.js (service worker não roda em file://).
// ui.spec.js e examples.spec.js seguem em file:// (pathToFileURL, URLs absolutas ignoram baseURL).
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  use: { headless: true, baseURL: 'http://localhost:8123/' },
  reporter: [['list']],
  workers: 1,
  webServer: {
    command: 'python3 -m http.server 8123 --directory ..',
    url: 'http://localhost:8123/quantum_calc.html',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
