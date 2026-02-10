// テーマの初期適用（ちらつき防止のためReact読み込み前に実行する）
(function () {
  var stored = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = stored === 'dark' || (stored !== 'light' && prefersDark);

  if (isDark) {
    document.documentElement.classList.add('dark');
  }
})();
