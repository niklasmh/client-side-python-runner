var fs = require('fs');
const { version } = require('./package.json');

fs.readFile('./docs/index.html', 'utf8', (_, data) => {
  let modified = '';
  const develop = process.argv.some((val) => val === 'develop');
  if (develop) {
    modified = data.replace(
      /https\:\/\/cdn\.jsdelivr\.net\/npm\/client-side-python-runner@\d+\.\d+\.\d+/g,
      '/index.js'
    );
  } else {
    modified = data.replace(
      /https\:\/\/cdn\.jsdelivr\.net\/npm\/client-side-python-runner@\d+\.\d+\.\d+|\/index.js/g,
      `https://cdn.jsdelivr.net/npm/client-side-python-runner@${version}`
    );
  }

  fs.writeFile('./docs/index.html', modified, 'utf8', () => {});
});
