const fs = require('fs');
const path = require('path');

const root = __dirname;
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const bgmBuf = fs.readFileSync(path.join(root, 'bgm.mp3'));
const claudeBuf = fs.readFileSync(path.join(root, 'claude_logo.png'));
const deepseekBuf = fs.readFileSync(path.join(root, 'deepseek_logo.png'));
const tiboBuf = fs.readFileSync(path.join(root, '177053821.jpg'));
const faviconBuf = fs.readFileSync(path.join(root, 'favicon.png'));

const bgmDataUri = 'data:audio/mp3;base64,' + bgmBuf.toString('base64');
const claudeDataUri = 'data:image/png;base64,' + claudeBuf.toString('base64');
const deepseekDataUri = 'data:image/png;base64,' + deepseekBuf.toString('base64');
const tiboDataUri = 'data:image/jpeg;base64,' + tiboBuf.toString('base64');

// Keep the normal page easy to edit while shipping one offline HTML file.
let portableHtml = indexHtml
  .replace(/<link rel="preload"[^>]+as="font"[^>]*>\n?/, '')
  .replace('<link rel="stylesheet" href="style.css">', () => '<style>\n' + fs.readFileSync(path.join(root, 'style.css'), 'utf8') + '</style>')
  .replace('<script src="game.js"></script>', () => '<script>\n' + fs.readFileSync(path.join(root, 'game.js'), 'utf8') + '</script>');
const pixelFont = fs.readFileSync(path.join(root, 'fonts/fusion-pixel-12px-proportional-zh_hans.woff2'));
portableHtml = portableHtml.replaceAll('fonts/fusion-pixel-12px-proportional-zh_hans.woff2', 'data:font/woff2;base64,' + pixelFont.toString('base64'));
// Preserve the embedded font's attribution in the distributed standalone file.
const fontNotices = ['OFL.txt', 'LICENSES/ark-pixel/OFL.txt', 'LICENSES/cubic-11/OFL.txt', 'LICENSES/galmuri/LICENSE.txt']
  .map(file => fs.readFileSync(path.join(root, 'fonts', file), 'utf8')).join('\n\n');
portableHtml = portableHtml.replace('</head>', () => '<!-- Fusion Pixel Font; SIL Open Font License 1.1\n' + fontNotices + '\n-->\n</head>');
portableHtml = portableHtml.replaceAll('"bgm.mp3"', JSON.stringify(bgmDataUri));
portableHtml = portableHtml.replaceAll('"claude_logo.png"', JSON.stringify(claudeDataUri));
portableHtml = portableHtml.replaceAll('"deepseek_logo.png"', JSON.stringify(deepseekDataUri));
portableHtml = portableHtml.replaceAll('"177053821.jpg"', JSON.stringify(tiboDataUri));
portableHtml = portableHtml.replaceAll('src="claude_logo.png"', 'src="' + claudeDataUri + '"');
portableHtml = portableHtml.replaceAll('href="favicon.png"', 'href="data:image/png;base64,' + faviconBuf.toString('base64') + '"');

const outPath = path.join(root, 'portable.html');
fs.writeFileSync(outPath, portableHtml, 'utf8');

const stat = fs.statSync(outPath);
console.log(`[OK] Generated portable.html (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
