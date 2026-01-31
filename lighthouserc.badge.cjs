const baseUrls = ['https://simple-kpt.com/', 'https://simple-kpt.com/demo', 'https://simple-kpt.com/login'];

/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = {
  ci: {
    collect: {
      // ライトモード + ダークモード（?theme=dark）
      url: [...baseUrls, ...baseUrls.map((url) => `${url}?theme=dark`)],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
