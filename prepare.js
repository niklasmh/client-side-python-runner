var fs = require('fs');
const { version } = require('./package.json');

fs.readFile('./docs/index.html', 'utf8', (_, data) => {
  let modified = '';
  const isDone = process.argv.some((val) => val === 'done');
  if (isDone) {
    modified = data.replace(
      /https\:\/\/cdn\.jsdelivr\.net\/npm\/client-side-python-runner@\d+\.\d+\.\d+/,
      '/index.js'
    );
  } else {
    modified = data.replace(
      /\/index.js/,
      `https://cdn.jsdelivr.net/npm/client-side-python-runner@${version}`
    );
  }

  fs.writeFile('./docs/index.html', modified, 'utf8', () => {});
});
