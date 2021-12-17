const fs = require('fs-extra');

const copyFiles = async () => {
  try {
    await fs.copy('./node_modules/@pdftron/webviewer/public', './public/webviewer');
    await fs.copy('./pdftron/PDFworker.js', './public/webviewer/core/pdf/PDFworker.js');
    await fs.copy('./public/webviewer/ui/i18n/translation-ko.json', './public/webviewer/ui/i18n/translation-ko.json');
    console.log('WebViewer files copied over successfully');
  } catch (err) {
    console.error(err);
  }
};

copyFiles();