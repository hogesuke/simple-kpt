/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview',
      startServerReadyPattern: 'Local:',
      // 認証不要のページのみ対象
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/demo',
        'http://localhost:4173/login',
        'http://localhost:4173/terms',
        'http://localhost:4173/privacy',
        'http://localhost:4173/not-found',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // noindexページのSEO警告を無視
        'is-crawlable': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
