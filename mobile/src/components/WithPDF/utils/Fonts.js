import NotoSansKR_Url from '../assets/font/NotoSansKR-Light.otf';

// out of the box fonts
const fonts = {
    'NotoSansKR': {
        src: NotoSansKR_Url
    }
  };

// Available fonts
export const Fonts = {
    ...fonts
};
  
export function fetchFont(name) {
if (fonts[name]) return fonts[name];
const font = Fonts[name];
if (!font) throw new Error(`Font '${name}' not exists.`);
fonts[name] = fetch(font.src)
    .then((r) => r.arrayBuffer())
    .then((fontBuffer) => {
    const fontFace = new FontFace(name, fontBuffer);
    fontFace.display = 'swap';
    fontFace.load().then(() => document.fonts.add(fontFace));
    return {
        ...font,
        buffer: fontBuffer,
    };
    });
return fonts[name];
}

// split text through pixel
export const splitThroughPixel = (string, px, fontSize, fontFamily) => {
    let split = [];

    let div = document.createElement('div');
    div.style.cssText = `white-space:nowrap; display:inline; font-size:${fontSize}px; font-family: ${fontFamily}, serif;`;

    document.body.appendChild(div);

    for (let i = 0; i < string.length; i++) {
        // console.log(string[i])
        div.innerText = div.innerText + (string[i] === ' ' ? '\u00a0': string[i]);
        let width = Math.ceil(div.getBoundingClientRect().width);
        // console.log('width', width);

        if (width > px) {
        let lastWord = div.innerText.slice(-1);
        let currentWord = div.innerText.slice(0, -1);
        split.push(currentWord.replace(/\u00a0/gi, " "));
        div.innerText = lastWord;
        }
    }

    if (div.innerText !== '') {
        split.push(div.innerText.replace(/\u00a0/gi, " "));
    }

    document.body.removeChild(div);

    return split;
}