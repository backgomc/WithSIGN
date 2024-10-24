const scripts = [
  {
    name: 'pdfjsLib',
    // src: './pdfsjs/pdf.js'
    // src: 'https://unpkg.com/pdfjs-dist@2.3.200/build/pdf.min.js',
    src: '/pdfjs-dist/build/pdf.min.js' //public 아래 pdfjs-dist를 위치시킨다.
  },
  {
    name: 'PDFLib',
    // src: './pdf-lib.min.js'
    src: 'https://unpkg.com/pdf-lib@1.4.0/dist/pdf-lib.min.js',
  },
  {
    name: 'download',
    src: 'https://unpkg.com/downloadjs@1.4.7',
  },
];

const assets = {};
export function getAsset(name) {
  if (assets[name]) return assets[name];
  const script = scripts.find((s) => s.name === name);
  if (!script) throw new Error(`Script ${name} not exists.`);
  return prepareAsset(script);
}

export function prepareAsset({ name, src }) {
  if (assets[name]) return assets[name];
  assets[name] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // script.type = "text/babel";
    // script.type = "text/jsx";
    script.src = src;
    script.onload = () => {
      resolve(window[name]);
      console.log(`${name} is loaded.`);
    };
    script.onerror = () => {
      reject(`The script ${name} didn't load correctly.`);
      alert(`Some scripts did not load correctly. Please reload and try again.`)
    };
    document.body.appendChild(script);
  });
  return assets[name];
}

export default function prepareAssets() {
  scripts.forEach(prepareAsset);
}

// // out of the box fonts
// const fonts = {
//   Courier: {
//     correction(size, lineHeight) {
//       return (size * lineHeight - size) / 2 + size / 6;
//     },
//   },
//   Helvetica: {
//     correction(size, lineHeight) {
//       return (size * lineHeight - size) / 2 + size / 10;
//     },
//   },
//   'Times-Roman': {
//     correction(size, lineHeight) {
//       return (size * lineHeight - size) / 2 + size / 7;
//     },
//   },
// };
// // Available fonts
// export const Fonts = {
//   ...fonts,
//   CK: {
//     src: '/CK.ttf', // 9.9 MB
//     correction(size, lineHeight) {
//       return (size * lineHeight - size) / 2;
//     },
//   },
// };

