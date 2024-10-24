import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import useDidMountEffect from './Common/useDidMountEffect';
import {
  readAsArrayBuffer,
  readAsImage,
  readAsPDF,
  readAsPDF_URL,
  readAsDataURL
} from "./utils/asyncReader.js";
import loadash from 'lodash';
import PDFPage from './PDFPage.js';
import Image from './Image.js';
import Text from './Text.js';
import Box from './Box.js';
import CheckBox from './CheckBox';
import { ggID, timeout } from "./utils/helper.js";
// import iconImage from '../../assets/images/image.svg';
import { v4 as uuID } from 'uuid';
import { Button, Upload, message, Space, Divider } from 'antd';
import Icon, { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { save } from './utils/PDF.js';
// import { ReactComponent as svgImage} from './assets/images/image.svg';
// import { ReactComponent as svgSign} from './assets/images/sign.svg';
// import { ReactComponent as svgText} from './assets/images/text.svg';
// import { ReactComponent as svgBox} from './assets/images/box.svg';
import { TYPE_SIGN, TYPE_TEXT, TYPE_BOX, TYPE_IMAGE, TYPE_CHECKBOX } from './Common/Constants';
import SvgImage from './assets/svg/SvgImage.js';
import SvgSign from './assets/svg/SvgSign.js';
import SvgText from './assets/svg/SvgText.js';
import SvgBox from './assets/svg/SvgBox.js';
import SvgCheckBox from './assets/svg/SvgCheckBox';

import { fetchFont, splitThroughPixel } from "./utils/Fonts.js"; 
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import './PDFViewer.css';
import './font.css';
import './tailwind.css';
import SignModal from './SignModal';
// const genID = ggID();

const PDFViewer = forwardRef(({isUpload, isSave, isEditing, file, onItemChanged, onValidationChanged, defaultScale, headerSpace, defaultFontSize}, ref) => {

  // 부모 컴포넌트에서 사용할 함수를 선언
  useImperativeHandle(ref, () => ({
    savePDF,        // save pdf file
    uploadPDF,      // upload by pdf file or url
    addBox,         // add box item
    exportItems,    // export items
    importItems,    // import items
    getThumbnail,   // get thumbnail of pdf
    getPageCount,   // get page counts of pdf
    convertBoxToComponent, // convert box to text, sign, checkbox
    validationCheck,       // validation Check
    deleteItemsByUserId,   // delete item by userId
    setSigns,              // set signList
    updateItem,            // update Item
    setScale               // setting scale 
  }))

  console.log("PDFViewer render !");

  console.log('window.innerWidth', window.innerWidth)
  let mobileWidth = 640; // 가로문서 640, 세로문서 840 적용 시 정상 작동

  const [pages, setPages] = useState([]);
  // const [allObjects, setAllObjects] = useState([]);
  const [items, setItems] = useState([]);
  const [pagesScale, setPagesScale] = useState(defaultScale ? defaultScale : Math.min(window.innerWidth / mobileWidth, 1));  // default pageScale : 1  , TODO: 여기서 미리 pageScale을 계산해서 초기화해야 할듯 
  const [scaleDirection, setScaleDirection] = useState(); // scale up/down 
  const [pagesSize, setPagesSize] = useState([]); //ex: [{idx:0, width:100, height:100}]
  // const [pagesHeight, setPagesHeight] = useState();
  const [selectedPageIndex, setSelectedPageIndex] = useState(-1);
  const [saving, setSaving] = useState(false);

  const [pdfFile, setPdfFile] = useState();
  const [pdfUrl, setPdfUrl] = useState();
  const [pdfName, setPdfName] = useState();
  const [visibleModal, setVisibleModal] = useState(false);

  const [fontFamily, setFontFamily] = useState("NotoSansKR"); // 경량화된 폰트를 사용해야 용량을 줄일 수 있음
  const [fontSize, setFontSize] = useState(defaultFontSize ? defaultFontSize : 13); // default size
  const [lineHeight, setLineHeight] = useState(1.4);  // default length
  // const [editing, setEditing] = useState(false);
  const [signList, setSignList] = useState([]);  // default length

  // const allObjectsRef = useRef();
  // allObjectsRef.current = allObjects;

  const itemsRef = useRef();
  itemsRef.current = items;

  const mainRef = useRef();
  const sigCanvas = useRef({});

  useEffect(() => {
    console.log('PDFViewer useEffect called');
    if (file) {
      console.log('file existed !');
      onLoadFile();
    }
  }, []);

  // 화면이 처음 로딩시에는 호출되지 않도록 처리
  useDidMountEffect(() => {
    console.log('PDFViewer useDidMountEffect called');
    if (file) {
      onLoadFile();
    }  
  }, [file]);

  // parameter 로 넘어온 PDF 파일 로딩
  const onLoadFile = async () => {
    try {
      setPages([]);
      await addPDF(file);
      setSelectedPageIndex(0);
    } catch (e) {
      console.log(e);
    }
  }

  const propsPDF = {
    showUploadList:false,
    beforeUpload: async file => {
      console.log('beforeUpload called', file)
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.error('File must smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }
      
      if (!file || file.type !== "application/pdf") {
        message.error('PDF only available!');
        return Upload.LIST_IGNORE;
      } 

      setSelectedPageIndex(-1);
      setPages([]);

      try {
        await addPDF(file);
        setSelectedPageIndex(0);
      } catch (e) {
        console.log(e);
      }
      return false;
    }  
  };

  const propsImage = {
    showUploadList:false,
    beforeUpload: async file => {
      console.log('beforeUpload called', file)
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.error('File must smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }
      
      console.log('file.type', file.type)
      if (!file || !file.type.includes("image")) {
        message.error('Image only available!');
        return Upload.LIST_IGNORE;
      } 

      try {
        await addImage(file);
      } catch (e) {
        console.log(e);
      }
      return false;
    }  
  };

  // async function onUploadPDF(e) {
  //   const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
  //   const file = files[0];

  //   console.log('file', file)
  //   if (!file || file.type !== "application/pdf") return;
  //   setSelectedPageIndex(-1);
  //   try {
  //     await addPDF(file);
  //     setSelectedPageIndex(0);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function onUploadImage(e) {
  //   const file = e.target.files[0];
  //   if (file && selectedPageIndex >= 0) {
  //     addImage(file);
  //   }
  //   e.target.value = null;
  // }

  /**
   * Add PDF
   * @function addPDF
   * @param {string | File} doc url string of PDF or File
   * @param {string} docSubject document title
   */
  const addPDF = async (doc, docSubject) => {
    try {
      let pdf;
      if (typeof doc === "object") {  // file
        if (!doc || doc.type !== "application/pdf") return;
        pdf = await readAsPDF(doc);
        setPdfName(doc.name);
        setPdfFile(doc);
      } else if(typeof doc === 'string') {  // url
        pdf = await readAsPDF_URL(doc);
        setPdfName(docSubject? docSubject : 'document');
        setPdfUrl(doc);
      } else {
        console.log("doc is not file or url");
        return;
      }

      const numPages = pdf.numPages;
      let _pages = Array(numPages)
        .fill()
        .map((_, i) => pdf.getPage(i + 1));
      setPages(_pages)
      setItems([]);

    } catch (e) {
      console.log("Failed to add pdf.");
      throw e;
    }
  }

  /**
   * Upload PDF
   * @function uploadPDF
   * @param {string | File} doc url string of PDF or File
   * @param {string} docSubject document title
   */
  const uploadPDF = async (doc, docSubject) => {
    
    try {
      setSelectedPageIndex(-1);
      setPages([]);

      await addPDF(doc, docSubject);
    
      setSelectedPageIndex(0);

      // setTimeout(()=> {
      //   setPagesScale(1.3);
      // }, 1000)    

    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Save PDF
   * @function savePDF
   * @param {boolean} isDownload Whether to download file locally
   * @param {boolean} isMerge Whether to merge items
   * @param {object} _items items to merge with pdf (If not, merge items on the screen)
   * @return {File} Returns the pdf file that the items are merged
   */
  const savePDF = async (isMerge, isDownload, _items) => {
    console.log('save pdf');

    console.log('isMerge', isMerge);
    console.log('isDownload', isDownload);

    if (!(pdfFile || pdfUrl)) return;
    if (saving || !pages.length) return;

    setSaving(true);
    try {
      console.log('save items', items)

      let blob;
      if (isMerge) {

        if (_items) {
          const promises = _items.map(async _item => {
          if (_item.type === (TYPE_SIGN || TYPE_IMAGE)) {  //payload: base64 => Image Object
              if (_item.payload) {
                const img = await readAsImage(_item.payload);
                _item.payload = img;
              }
            }
            return _item;
          })
          const newItems = await Promise.all(promises);
          blob = await save(pdfFile, pdfUrl, newItems, pdfName, isDownload);
        } else {
          blob = await save(pdfFile, pdfUrl, items, pdfName, isDownload);
        }
      } else {
        blob = await save(pdfFile, pdfUrl, [], pdfName, isDownload);
      }

      let file = new File([blob], pdfName, { type: "application/pdf" });
      return file;
      
    } catch (e) {
      console.log(e);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Export items
   * @function exportItems
   * @return {object} Items to export from PDF
   */
  const exportItems = () => {

    // export 후에 기존items는 변화없이 유지하기 위해 deepCopy 로 변경
    // let newItems = items.slice();  //AS-IS
    let newItems = loadash.cloneDeep(items);  //TO-BE 

    newItems.forEach(_item => {
      if (_item.type === (TYPE_SIGN || TYPE_IMAGE)) { //Image Object => base64
        // console.log('type', typeof(_item.payload));
        if (_item.payload && _item.payload.src) {
          _item.payload = _item.payload.src;
        }
      } else if (_item.type === TYPE_TEXT) { 
        console.log('before lines', _item.lines)
        let newLines = []
        _item.lines.forEach(line => {
          newLines.push(...splitThroughPixel(line, _item.width, _item.fontSize, _item.fontFamily))
        })
        _item.lines = newLines;
        console.log('after lines', newLines)

      }
    })
    return newItems;
    
  }


  /**
   * Import items
   * @function importItems
   * @param {object} _items Items to import into PDF
   */
  const importItems = async (_items) => {

    // 반복문 내에 await 처리가 있는 경우 map 을 활용한다.
    const promises = _items.map(async _item => {
      if (_item.type === TYPE_TEXT) { // lines => text 변환
        let newText = "";
        _item.lines.forEach((line, idx) => {
          newText = newText.concat(line);
          if (_item.lines.length - idx > 1) {
            newText = newText.concat('<br>');
          }
        })
        _item.text = newText;
      } else if (_item.type === (TYPE_SIGN || TYPE_IMAGE)) {  //base64 => Image Object
        if (_item.payload) {
          const img = await readAsImage(_item.payload);
          _item.payload = img;
        }
      }
      return _item;
    })

    const newItems = await Promise.all(promises);
    console.log('newItems', newItems);
    setItems([...items, ...newItems]);

    // forEach 문안에 비동기처리는 순차적으로 되지 않는다. for/of 문을 사용해야 함
    // let newItems = _items.slice();
    // newItems.forEach(async _item => {
    // for (let _item of newItems) {
    //   if (_item.type === TYPE_TEXT) { // lines => text 변환
    //     let newText = "";
    //     _item.lines.forEach((line, idx) => {
    //       newText = newText.concat(line);
    //       if (_item.lines.length - idx > 1) {
    //         newText = newText.concat('<br>');
    //       }
    //     })
    //     _item.text = newText;
    //   } else if (_item.type === TYPE_SIGN || TYPE_IMAGE) {

    //     const img = await readAsImage(_item.payload);
    //     _item.payload = img;
    //   }

    // };

    // console.log('newItems', newItems);
    // setItems([...items, ...newItems]);
  }


  /**
   * Returns the thumbnail of PDF
   * @function getThumbnail
   * @param {number} _page The page number of PDF
   * @param {number} _scale The scale of PDF [default: 0.5]
   * @return {Promise<string>} Base64 image
   */
  const getThumbnail = async (_page, _scale) => {
    try {
      const page = await pages[_page ? _page : 0];
      let vp  = page.getViewport({scale: _scale ? _scale : 0.5, rotation: 0});
      var canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
  
      return page.render({canvasContext: canvas.getContext("2d"), willReadFrequently: true, viewport: vp}).promise.then(function () {
        return canvas.toDataURL();
      });
    } catch (e) {
      console.log(`Fail to get thumbnail`, e);
    }
  }

  /**
   * Returns pageCount of PDF
   * @function getPageCount
   * @return {number} pageCount
   */
   const getPageCount = async () => {
    return pages.length;
  }
  

  /**
   * Add image item to items
   * @function addImage
   * @param {File | String} file File or url string
   */
  const addImage = async (file) => {
    try {
      const url = await readAsDataURL(file);
      const img = await readAsImage(url);
      const id = uuID();
      const { width, height } = img;
      const object = {
        id,
        pIdx: selectedPageIndex,
        type: "image",
        width,
        height,
        x: 0,
        y: 0,
        payload: img,
        file,
        required: false,
        deletable: true,
        movable: true,
        resizable: true
      };

      setItems([...items, object]);

      // callback
      if (onItemChanged) {
        onItemChanged('add', object);
      }

    } catch (e) {
      console.log(`Fail to add image.`, e);
    }
  }

  /**
   * Add sign item to items
   * @function addSign
   * @param {File | string} file File or url string
   */
  const addSign = async (data) => {
    try {
      const img = await readAsImage(data);
      const id = uuID();
      const { width, height } = img;
      const object = {
        id,
        pIdx: selectedPageIndex,
        type: TYPE_SIGN,
        // width,
        // height,
        width: 200, // 서명 이미지 컴포넌트 크기로 변경: 이미지 크기로 그리는 경우 좌표 이동이 없으면 화면보다 크게 나오는 문제가 있음 
        height: 100,
        x: 0,
        y: 0,
        payload: img,
        required: false,
        deletable: true,
        movable: true,
        resizable: true
      };

      setItems([...items, object]);

      // callback
      if (onItemChanged) {
        onItemChanged('add', object);
      }

    } catch (e) {
      console.log(`Fail to add image.`, e);
    }
  }

  /**
   * @function addText
   * Add text item to items
   */
  const addText = async () => {
    try {
      const id = uuID();
      // fetchFont(fontFamily);
      // let text = 'New Text';
      let text = '';
      
      const object = {
        id,
        text,
        // lines: 1, // recalculate after editing
        pIdx: selectedPageIndex,
        type: TYPE_TEXT,
        fontSize: fontSize,
        width: 100, // recalculate after editing,
        // height: 25,
        lineHeight: lineHeight,
        fontFamily: fontFamily,
        x: 0,
        y: 0,
        required: false,
        deletable: true,
        movable: true,
        resizable: true
      };

      setItems([...items, object]);

      // callback
      if (onItemChanged) {
        onItemChanged('add', object);
      }

    } catch (e) {
      console.log(`Fail to add image.`, e);
    }
  }

  /**
   * Add box item to items
   * @function addBox
   * @param {String} uid id for user identification
   * @param {TYPE_SIGN | TYPE_IMAGE | TYPE_TEXT | TYPE_CHECKBOX} subType 
   * @param {String} text
   * @param {number} width box width
   * @param {number} height box height
   * @param {boolean} required Whether to validate
   * @param {String} color box color: rgba(133, 50, 193, 0.3)
   * @param {String} autoInput automatic input value {NAME | JOBTITLE | OFFICE | DEPART | SABUN | DATE} 
   */
  const addBox = async (uid, subType, text, width, height, required = true, color, autoInput) => {
    try {
      const id = uuID();
      // fetchFont(fontFamily);
      // let text = 'New Text';
      // let text = '서명자<br>SIGN';
      
      const object = {
        id,
        uid: uid ? uid : '',
        text: text ? text : '서명자<br>SIGN',
        // lines: 1, // recalculate after editing
        pIdx: selectedPageIndex,
        type: TYPE_BOX,
        subType: subType ? subType : TYPE_SIGN,
        size: fontSize,
        width: width ? width : 100, // recalculate after editing,
        // height: height ? height : 60,
        height: subType === TYPE_TEXT ? fontSize * lineHeight : (height ? height : 60),
        lineHeight: lineHeight,
        fontSize: fontSize,
        fontFamily: fontFamily,
        x: 0,
        y: 0,
        placeholder: '',
        required : required,
        color: color,
        autoInput: autoInput
      };

      setItems([...items, object]);

      // callback
      if (onItemChanged) {
        onItemChanged('add', object);
      }

    } catch (e) {
      console.log(`Fail to add image.`, e);
    }
  }

  /**
   * Add checkbox item to items
   * @function addCheckBox
   */
  const addCheckBox = async () => {
    try {
      const id = uuID();
      // const { width, height } = 100;
      const width = 30;
      const height = 30;
      const object = {
        id,
        pIdx: selectedPageIndex,
        type: TYPE_CHECKBOX,
        width,
        height,
        x: 0,
        y: 0,
        checked: false,
        required: false,
        deletable: true,
        movable: true,
        // resizable: true
      };

      setItems([...items, object]);

      // callback
      if (onItemChanged) {
        onItemChanged('add', object);
      }

    } catch (e) {
      console.log(`Fail to add checkbox.`, e);
    }
  }

  /**
   * Convert box to component(text, sign, checkbox)
   * @function convertBoxToComponent
   * @param {Array} items items to covert
   * @return {Array} converted items
   */
  const convertBoxToComponent = (_items) => {
    // let newItems = items.slice();

    let newItems = _items ? loadash.cloneDeep(_items) : loadash.cloneDeep(items);

    newItems.forEach(item => {
      if (item.type === TYPE_BOX) {
        item.type = item.subType;
        // item.placeholder = item.lines.length > 0 ? item.lines[0] : '';
        item.lines = [];
        item.text = '';
        item.deletable = false;
        item.movable = false;  
        item.resizable = false;
        item.disableOptions = true; // 컴포넌트 편집 기능 off
      } 
      
      if (item.type === (TYPE_SIGN || TYPE_IMAGE)) { //Image Object => base64
        if (item.payload && item.payload.src) {
          item.payload = item.payload.src;
        }
      }
    })

    if (!_items) setItems(newItems); 

    return newItems;
  }

  /**
   * Validation check of the items
   * @function validationCheck
   * @return {Boolean} return validation result
   */
  const validationCheck = () => {
    let validation = true;

    itemsRef.current.forEach(item => {
      if (item.required && !item.disable && !item.hidden) {
        // console.log('item', item);
        if (item.type === TYPE_TEXT) {
          console.log('item.lines', item.lines)
          // [] => false
          // [''] => false
          // ['a'] => true
          if (item.lines.length < 1) {
            validation = false;
          } else {
            let isText = false;
            item.lines.forEach(line => {
              if (line.length > 0) {
                isText = true;
              }
            })
            if (!isText) validation = false;
          }

        } else if (item.type === TYPE_SIGN) {
          if (!item.payload) {
            validation = false;
          }
        } else if (item.type === TYPE_CHECKBOX) {
          if (!item.checked) {
            validation = false;
          }
        }
      }
    })
    return validation;
    
  }

  /**
   * set signList
   * @function setSignList
   */
  const setSigns = (signs) => {
    setSignList(signs)
  }

  const selectPage = (idx) => {
    console.log('selectPage called', idx)
    setSelectedPageIndex(idx);
  }

  /**
   * Update item 
   * @function convertBoxToComponent
   * @param {String} itemId item id
   * @param {Object} payload item to be updated
   */
  const updateItem = (itemId, payload) => {

    console.log('👽updateItem called - itemId :', itemId);
    console.log('👽updateItem called - payload :', payload);
    
    setItems((prevItems) => (
      prevItems.map(item => item.id === itemId ? { ...item, ...payload} : item )
    ))

    // 실시간 유효성 체크를 위해서는 여기서 바로 체크가 필요함
    // 화면 이동이 아니라 값의 변화가 있는 경우 체크해서 callback 처리
    // object 에 값변화에 관련된 key가 있는지 체크한다.
    // callback validationChanged
    if (payload.hasOwnProperty('lines') || payload.hasOwnProperty('payload') || payload.hasOwnProperty('checked')) {
      if (onValidationChanged) {
        let validation = validationCheckLive(itemId, payload);
        onValidationChanged(validation);
      }
    }

    // callback itemChanged
    if (onItemChanged) {
      onItemChanged('update', {...itemsRef.current.filter(item => item.id === itemId)[0], ...payload});
    }
  }

  const validationCheckLive = (itemId, payload) => {
    let validation = true;

    itemsRef.current.forEach(item => {
      if (item.required && !item.disable && !item.hidden) {
        // console.log('item', item);
        if (item.type === TYPE_TEXT) {
          // console.log('item.lines', item.lines)

          let lines = []
          if (item.id === itemId) {
            lines = payload.lines;
          } else {
            lines = item.lines;
          }

          if (!lines || lines.length < 1) {
            validation = false;
          } else {
            let isText = false;
            lines.forEach(line => {
              if (line.length > 0) {
                isText = true;
              }
            })
            if (!isText) validation = false;
          }

        } else if (item.type === TYPE_SIGN) {
          if (item.id === itemId) {
            if (!payload.payload) {
              validation = false;
            }
          } else {
            if (!item.payload) {
              validation = false;
            }
          }

        } else if (item.type === TYPE_CHECKBOX) {
          if (item.id === itemId) {
            if (!payload.checked) {
              validation = false;
            }
          } else {
            if (!item.checked) {
              validation = false;
            }
          }

        }
      }
    })
    return validation;
  }

  // const updateItem = useCallback((itemId, payload) => {
  //   // console.log('updateObject called', itemId, payload)
  //   setItems((prevItems) => (
  //     prevItems.map(item => item.id === itemId ? { ...item, ...payload} : item )
  //   ))
  // }, []);


  // State 는 정상 삭제되나 DOM 이 비정상 삭제 되었던 이유는
  // 반복문에 <></> 태그를 넣었기 때문이었다. <div key={..}> 값읋 줘야 DOM을 찾아간다.
  const deleteItem = (itemId) => {
    console.log('deleteItem called', itemId, itemsRef);

    // callback
    if (onItemChanged) {
      onItemChanged('delete', items.filter(item => item.id === itemId)[0]);
    }

    setItems((prevItems) => (prevItems.filter(item => item.id !== itemId)))
  }

  /**
   * delete item by userId
   * @function deleteItemsByUid
   * @param {string} uid userId
   */
  const deleteItemsByUserId = (uid) => {
    console.log('deleteItem called', uid, itemsRef);

    // callback : 다건 처리는 callback 하지 않도록 처리함 
    // if (onItemChanged) {
    //   onItemChanged('delete', items.filter(item => item.uid === uid)[0]);
    // }

    setItems((prevItems) => (prevItems.filter(item => item.uid !== uid)))
  }

  /**
   * setting scale
   * @function setScale
   * @param {number} scale scale [0.5 ~ 1.5]
   */
  const setScale = (scale) => {
    console.log('setScale', scale);
    if (0.5 <= scale <= 2) {
      setPagesScale(scale);
    }
  }

  // State 는 정상 삭제되나 DOM 이 비정상 삭제 반영되는 현상 해결
  // => Pannable 객체가 React.memo 로 설정되어 useCallback 필요
  // const deleteItem = useCallback((itemId) => {
  //   console.log('deleteItem called', itemId, itemsRef);
  //   setItems((prevItems) => (prevItems.filter(item => item.id !== itemId)))
  // }, []);


  // const updateObject = (objectId, payload) => {
  //   console.log('updateObject called', objectId, payload)
  //   //TODO : 오브젝트 업데이트 처리

  //   const _allObjects = allObjects.map((objects, pIndex) =>
  //   pIndex == selectedPageIndex
  //     ? objects.map(object =>
  //         object.id === objectId ? { ...object, ...payload } : object
  //       )
  //     : objects
  //   );
  //   setAllObjects(_allObjects)

  // }

  // const deleteObject = (objectId) => {
  //   // console.log('allObjectsRef.current', allObjectsRef.current);
  //   // console.log('objects', allObjects);
  //   // console.log('deleteObject called', objectId);
  //   // const _allObjects = allObjectsRef.current.map((objects, pIndex) =>
  //   // pIndex == selectedPageIndex
  //   //   ? objects.filter(object => object.id !== objectId)
  //   //   : objects
  //   // );

  //   // console.log('deleteObject after', _allObjects);

  //   // setAllObjects(_allObjects)


  //   //TODO: 1,2번 추가후 1번 삭제시 2번이 삭제되는 현상 
  //   // console.log('deleteObject before', allObjectsRef.current)
  //   // console.log('deleteObject before2', allObjects)
  //   // setAllObjects((prevAllObjects) => (
  //   //   prevAllObjects.map((objects, idx) => (
  //   //     idx === selectedPageIndex ? objects.filter(object => object.id !== objectId) : objects
  //   //   ))
  //   // ));
  //   // console.log('deleteObject after', allObjectsRef.current)
  //   // console.log('deleteObject after2', allObjects)


  //   setItems((prevItems) => (prevItems.filter(item => item.id !== objectId)))

  // }



  // signModal callback 
  const signComplete = async (signData) => {
    try {
      await addSign(signData);
    } catch (e) {
      console.log(e);
    }
  }
  
  const onChangeTextAlign = (value) => {
    console.log('onChangeTextAlign called', value);
  }

  return (
    <div>
      {/* h-screen overflow-scroll 옵션을 주는 경우 내부 스크롤을 사용 : h-screen = {height: '100vh'} style={{height: '90vh'}} */}
      {/* relative flex flex-col items-center py-16 bg-gray-100 min-h-full  */}
      <main ref={mainRef} className="relative flex flex-col items-center bg-gray-100 overflow-auto" style={{height: `calc(100vh - ${headerSpace ? headerSpace : 0}px)`}} >
        {/* absolute z-10 top-0 left-0 right-0 h-12 flex justify-center items-center
          bg-gray-200 border-b border-gray-300 */}
        <div
          className="sticky z-10 top-0 w-full h-10 p-1 flex justify-center bg-gray-200 border-b border-gray-300">
          {/* <input
            type="file"
            name="pdf"
            id="pdf"
            onChange={onUploadPDF}
            className="hidden" />
          <input
            type="file"
            id="image"
            name="image"
            className="hidden"
            onChange={onUploadImage} />
          <label
            className="whitespace-no-wrap bg-blue-500 hover:bg-blue-700 text-white
            font-bold py-1 px-3 md:px-4 rounded mr-3 cursor-pointer md:mr-4"
            htmlFor="pdf">
            Choose PDF
          </label>
          <label
            className="flex items-center justify-center h-full w-8 hover:bg-gray-500
            cursor-pointer"
            for="image">
            <img src={iconImage} alt="An icon for adding images" />
          </label> */}

          <Space>
            <Upload {...propsPDF} max={1}>
              <Button hidden={!isUpload}>Upload PDF</Button>
            </Upload>

            <Divider type="vertical" />
            
            <Button shape="circle" icon={<PlusOutlined />} onClick={() => {
              if (pagesScale < 1.5) {
                // console.log('mainRef', mainRef.current.offsetWidth)
                // console.log('pagesSize', pagesSize);
                // Scale UP 한 경우 사이즈를 러프하게 예측하여 더 커지지 못하도록 설정 
                if (pagesSize && (pagesSize[0].width * 1.1 < mainRef.current.offsetWidth - 20)) {
                  setPagesScale((prev)=> (prev + 0.1)); setScaleDirection('up');
                }
              }
            }}></Button>
            <Button shape="circle" icon={<MinusOutlined />} onClick={() => {
              if (pagesScale > 0.5) {
                setPagesScale((prev)=> (prev - 0.1)); setScaleDirection('down');
              }  
            }}></Button>

            <Divider type="vertical" />

            {/* <Upload {...propsImage} hidden={!isEditing}>
              <Button hidden={!isEditing} icon={<Icon component={SvgImage} />}></Button>
            </Upload> */}

            <Button hidden={!isEditing} icon={<Icon component={SvgSign} onClick={() => {
              setVisibleModal(true);
            }} />}></Button>

            <Button hidden={!isEditing} icon={<Icon component={SvgText} onClick={() => {
              console.log("add Text");
              addText();
            }} />}></Button>

            <Button hidden={!isEditing} icon={<Icon component={SvgCheckBox} onClick={() => {
              console.log("add Checkbox");
              addCheckBox();
            }} />}></Button>

            {/* <Button hidden={!isEditing} icon={<Icon component={SvgBox} onClick={() => {
              console.log("add Box");
              addBox();
            }} />}></Button> */}

            <Divider type="vertical" hidden={!isEditing} />

            <Button type="primary" loading={saving} hidden={!isSave} onClick={()=> {
              savePDF(true, true);
            }}>Save PDF</Button>
            
          </Space>


        </div>

        <div className="w-full">
        {pages.map((page, idx) => {
          return (
            <div key={idx}>
            {/* <div>{pagesScale}</div> */}
            {/* <div>{items.filter(item => item.pIdx === idx).map(item => { return item.id })}</div> */}
            <div 
              className="p-5 w-full flex flex-col items-center" //overflow-hidden 삭제: 옵션 값이 영역밖에 보일 필요가 있음
              onMouseDown={() => selectPage(idx)} 
              onTouchStart={() => selectPage(idx)}>
              <div
                className={`relative shadow-lg ${(idx === selectedPageIndex) ? 'ring-1 ring-blue-500/10' : ''}`} //ring-offset-2 ring-2
              >
              <PDFPage key={idx} page={page} idx={idx} setPagesScale={setPagesScale} setPagesSize={setPagesSize} pagesScale={pagesScale}></PDFPage>
              
              {/* ISSUE : scale 을 밖에서 처리하면 마우스 이동이 컴포넌트보다 느림 */}
              {/* <div
                className="absolute top-0 left-0 transform origin-top-left"
                style={{touchAction:'none', transform: `scale(${pagesScale})` }}> */}
              <div
                className="absolute top-0 left-0 transform origin-top-left"
                style={{touchAction:'none'}}>

                  {items.filter(item => item.pIdx === idx).map(item => {
                    return (
                      <div key={item.id}>
                      {(item.type === TYPE_IMAGE || item.type === TYPE_SIGN) && <Image key={item.id} item={item} deleteItem={deleteItem} updateItem={updateItem} pageSize={pagesSize.filter(el => el.idx === idx)[0]} pagesScale={pagesScale} scaleDirection={scaleDirection} signList={signList} setSignList={setSignList}/>}
                      {(item.type === TYPE_TEXT) && <Text key={item.id} item={item} deleteItem={deleteItem} updateItem={updateItem} pageSize={pagesSize.filter(el => el.idx === idx)[0]} pagesScale={pagesScale} scaleDirection={scaleDirection}  />}
                      {(item.type === TYPE_BOX) && <Box key={item.id} item={item} deleteItem={deleteItem} updateItem={updateItem} pageSize={pagesSize.filter(el => el.idx === idx)[0]} pagesScale={pagesScale} scaleDirection={scaleDirection}  />}
                      {(item.type === TYPE_CHECKBOX) && <CheckBox key={item.id} item={item} deleteItem={deleteItem} updateItem={updateItem} pageSize={pagesSize.filter(el => el.idx === idx)[0]} pagesScale={pagesScale} scaleDirection={scaleDirection}  />}
                      </div>
                    )
                  })
                  }
                  
              </div>

              </div>
            </div>
            </div>
          )
        })}
        </div>


      </main>

      <SignModal visibleModal={visibleModal} setVisibleModal={setVisibleModal} signComplete={signComplete} signList={signList}  />
      
    </div>

    
  );
});


export default PDFViewer;