import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
// import {
//   Box,
//   Column,
//   Heading,
//   Row,
//   Stack,
//   Text,
//   Button,
//   SelectList,
// } from 'gestalt';
import { Upload, message, Badge, Button, Row, Col, List, Card, Checkbox } from 'antd';
import Icon from '@ant-design/icons';
import { InboxOutlined, HighlightOutlined, PlusOutlined } from '@ant-design/icons';
import { selectDocumentTempPath, resetAssignAll, selectAssignees, resetSignee, selectDocumentFile, selectDocumentTitle, resetDocumentFile, resetDocumentTitle, selectTemplate, resetTemplate, selectDocumentType, resetDocumentType, selectTemplateTitle, selectSendType } from '../Assign/AssignSlice';
import { selectUser } from '../../app/infoSlice';
import WebViewer from '@pdftron/webviewer';
// import 'gestalt/dist/gestalt.css';
import './PrepareDocument.css';
import StepWrite from '../Step/StepWrite'
import { useIntl } from "react-intl";
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import logo from '../../assets/images/logo.svg';
import { LICENSE_KEY } from '../../config/Config';

const { Dragger } = Upload;

const PrepareDocument = () => {
  const [instance, setInstance] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);
  // const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [observers, setObservers] = useState([]);
  // const [inputValue, _setInputValue] = useState([new Map()]);

  // event 안에서는 최신 state 값을 못 불러와서 ref 사용
  // const inputValueRef = useRef(inputValue);
  // const setInputValue = data => {
  //   inputValueRef.current = data;
  //   _setInputValue(data);
  // };

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const documentFile = useSelector(selectDocumentFile);
  const documentTitle = useSelector(selectDocumentTitle);
  const documentType = useSelector(selectDocumentType);
  const template = useSelector(selectTemplate);
  const templateTitle = useSelector(selectTemplateTitle);
  const sendType = useSelector(selectSendType);
  const documentTempPath = useSelector(selectDocumentTempPath);

  const assignees = useSelector(selectAssignees);
  const assigneesValues = assignees.map(user => {
    return { value: user.key, label: user.name };
  });
  const box = assignees.map(user => {
    return { key:user.key, sign:0, text:0, observer:0 };
  });
  const box_bulk = [{key:'bulk', sign:0, text:0}]

  const [boxData, setBoxData] = useState((sendType === 'B') ? box_bulk:box);

  // let initialAssignee =
  //   assigneesValues.length > 0 ? assigneesValues[0].value : '';
  let initialAssignee =
  assigneesValues.length > 0 ? assigneesValues[0] : '';
  const [assignee, setAssignee] = useState(initialAssignee);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { _id, email } = user;

  const viewer = useRef(null);
  const filePicker = useRef(null);

  const props = {
    name: 'file',
    multiple: false,
    // action: '',
    beforeUpload: file => {
        if (file.type !== 'application/pdf') {
            console.log(file.type)
            message.error(`${file.name} is not a pdf file`);
            return Upload.LIST_IGNORE;
        }

        instance.loadDocument(file);
        // setFile(file);
                
        return false;
    },
    onChange(info) {
        console.log(info.file, info.fileList);
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };


  // S. control inputValue map
  // const insertInputValue = (key, value) => {
  //   setInputValue((prev) => new Map([...prev, [key, value]]));
  // };
  
  
  // const updateInputValue = (key, value) => {
  //   setInputValue((prev) => new Map(prev).set(key, value));
  // }
  
  // const deleteInputValue = (key) => {
  //   setInputValue((prev) => {
  //     const newState = new Map(prev);
  //     newState.delete(key);
  //     return newState;
  //   });
  // }
  
  // const clearInputValue = () => {
  //   setInputValue((prev) => new Map(prev.clear()));
  // }
  // E. control inputValue map



  // if using a class, equivalent of componentDidMount
  useEffect(() => {

    // init inputValue
    // assignees.map(user => {
    //   insertInputValue(user.key, {sign:0, text:0})
    // });

    // setInputValue(
    //   assignees.map(user => {
    //     return { [user.key]: {sign:0, text:0} };
    // }))


    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'searchButton',
          'menuButton',
        ],
      },
      viewer.current,
    ).then(instance => {
      const { iframeWindow, docViewer, CoreControls } = instance;
      
      // select only the view group
      instance.setToolbarGroup('toolbarGroup-View');
      CoreControls.setCustomFontURL("file://localhost:3000/SelfServeWebFontsV2/");

      // set language
      instance.setLanguage('ko');

      setInstance(instance);

      const iframeDoc = iframeWindow.document.body;
      iframeDoc.addEventListener('dragover', dragOver);
      iframeDoc.addEventListener('drop', e => {
        drop(e, instance);
      });

      if (documentType === 'TEMPLATE') {
        // /storage/... (O) storage/...(X)
        instance.loadDocument('/'+template.docRef)
      } else if(documentType === 'PC') {
        // instance.loadDocument(documentFile)
        instance.loadDocument('/'+documentTempPath)
      }


      docViewer.on('documentLoaded', () => {
        console.log('documentLoaded called');
        setPageCount(docViewer.getPageCount());

        const doc = docViewer.getDocument();
        // const pageIdx = 1;

        // doc.loadThumbnailAsync(pageIdx, (thumbnail) => {
        //   // thumbnail is a HTMLCanvasElement or HTMLImageElement
        //   console.log("loadThumbnailAsync called")
        //   // console.log('thumbnail:'+thumbnail.toDataURL());

        //   setThumbnail(thumbnail.toDataURL())
        // });

        doc.loadCanvasAsync(({
          pageNumber: 1,
          // zoom: 0.21, // render at twice the resolution //mac: 0.21 window: ??
          width: 300,  // 윈도우 기준으로 맞춤. 맥에서는 해상도가 더 크게 나옴
          drawComplete: async (thumbnail) => {
            // const pageNumber = 1;
            // optionally comment out "drawAnnotations" below to exclude annotations
            // await instance.docViewer.getAnnotationManager().drawAnnotations(pageNumber, thumbnail);
            // thumbnail is a HTMLCanvasElement or HTMLImageElement
            // console.log('thumbnail:'+thumbnail.toDataURL());
            setThumbnail(thumbnail.toDataURL())
          }
        }));

      });

      const annotManager = docViewer.getAnnotationManager();

      annotManager.on('annotationChanged', (annotations, action, info) => {

        console.log('called annotationChanged:'+ action)

        // applyFields 에서 호출 시는 아래가 호출되지 않도록 처리 
        if (!annotations[0].custom) {
          return
        } 

        //TODO
        // 해당 메서드에서는 state 값을 제대로 못불러온다 ... 
        // Ref 를 써서 해결 ...
        if (action === 'add') {
          console.log('added annotation');

          const name = annotations[0].custom.name //sample: 6156a3c9c7f00c0d4ace4744_SIGN_
          const user = name.split('_')[0]

          const member = boxData.filter(e => e.key === user)[0]

          if (name.includes('SIGN')) {
            member.sign = member.sign + 1
          } else if (name.includes('TEXT')) {
            member.text = member.text + 1
          }

          const newBoxData = boxData.slice()
          newBoxData[boxData.filter(e => e.key === user).index] = member 
          
          setBoxData(newBoxData)


          // 0: {key: '6156a3c9c7f00c0d4ace4744', sign: 0, text: 0}
          // 1: {key: '6156a3c9c7f00c0d4ace4746', sign: 0, text: 0}


          // setBoxData( (prev) => [...prev, {key:123, sign:1, text:2}] );
          // setBoxData([{key: '6156a3c9c7f00c0d4ace4744', sign: 1, text: 0}, {key: '6156a3c9c7f00c0d4ace4746', sign: 0, text: 0}])

          // if (temp) {

          //   const asisInputValue = tmp(user)

          //   console.log("asisInputValue.sign:"+asisInputValue.sign)
          //   const updateNum = asisInputValue.sign + 1 
          //   console.log("updateNum:"+updateNum)
          //   updateInputValue(user, {sign:updateNum, text:asisInputValue.text})

          // } else {
          //   insertInputValue(user, {sign:1, text:0})
          // }

          

        } else if (action === 'modify') {
          console.log('this change modified annotations');
        } else if (action === 'delete') {
          console.log('deleted annotation:'+ annotations);

          // annotation 이 동시 삭제되는 경우 처리 : observer 체크 시 
          annotations.map(annotation => {
            const name = annotation.custom.name //sample: 6156a3c9c7f00c0d4ace4744_SIGN_
            const user = name.split('_')[0]
  
            const member = boxData.filter(e => e.key === user)[0]
  
            if (name.includes('SIGN')) {
              member.sign = member.sign - 1
            } else if (name.includes('TEXT')) {
              member.text = member.text - 1
            }
  
            const newBoxData = boxData.slice()
            newBoxData[boxData.filter(e => e.key === user).index] = member 
            
            setBoxData(newBoxData)
          })


        }

        // 유효성 체크 
        // var check = false
        // boxData.map(box => {
        // //{ key:user.key, sign:0, text:0 };
        // //observers.filter(v => v != item.key)

        // //TODO: 체크박스도 조건 추가하기
        //   // if(box.sign === 0 && box.text === 0 && observers.filter(v => v == box.key).count == 0) { 
        //   if(box.sign === 0 && box.text === 0) { 
        //     check = true
        //   }
        // });
        // setDisableNext(check)

      })

      // filePicker.current.onchange = e => {
      //   const file = e.target.files[0];
      //   console.log("Afile:"+ file)
      //   if (file) {
      //     setFileName(file.name.split('.')[0]);
      //     instance.loadDocument(file);
      //   }
      // };
    });
  }, []);

  // observers.filter(v => v == box.key).count === 0
  useEffect(() => {

    // 유효성 체크 
    var check = false
    boxData.map(box => {
    //{ key:user.key, sign:0, text:0 };
    //observers.filter(v => v != item.key)

      // if(box.sign === 0 && box.text === 0 && observers.filter(v => v == box.key).count == 0) {
      if (sendType === 'B') {
        if(box.sign === 0 && box.text === 0) { 
          check = true
        }
      } else {
        if(box.sign === 0 && box.text === 0 && box.observer === 0) { 
          check = true
        }
      }

    });
    setDisableNext(check)

  }, [boxData]);

  const applyFields = async () => {

    console.log('applyFields called');
    // setLoading(true);

    const { Annotations, docViewer } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const fieldManager = annotManager.getFieldManager();
    const annotationsList = annotManager.getAnnotationsList();
    const annotsToDelete = [];
    const annotsToDraw = [];

    await Promise.all(
      annotationsList.map(async (annot, index) => {
        let inputAnnot;
        let field;

        if (typeof annot.custom !== 'undefined') {
          // create a form field based on the type of annotation
          if (annot.custom.type === 'TEXT') {
            console.log("annot.custom.name:"+annot.custom.name)
            field = new Annotations.Forms.Field(
              // annot.getContents() + Date.now() + index,
              annot.custom.name + Date.now() + index,
              {
                type: 'Tx',
                value: annot.custom.value,
              },
            );
            inputAnnot = new Annotations.TextWidgetAnnotation(field);
          } else if (annot.custom.type === 'SIGN') {
            console.log("annot.custom.name:"+annot.custom.name)
            field = new Annotations.Forms.Field(
              // annot.getContents() + Date.now() + index,
              annot.custom.name + Date.now() + index,
              {
                type: 'Sig',
              },
            );
            inputAnnot = new Annotations.SignatureWidgetAnnotation(field, {
              appearance: '_DEFAULT',
              appearances: {
                _DEFAULT: {
                  Normal: {
                    data:
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuMWMqnEsAAAANSURBVBhXY/j//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC',
                    offset: {
                      x: 100,
                      y: 100,
                    },
                  },
                },
              },
            });
          } else if (annot.custom.type === 'DATE') {
            field = new Annotations.Forms.Field(
              // annot.getContents() + Date.now() + index,
              annot.custom.name + Date.now() + index,
              {
                type: 'Tx',
                value: 'm-d-yyyy',
                // Actions need to be added for DatePickerWidgetAnnotation to recognize this field.
                actions: {
                  F: [
                    {
                      name: 'JavaScript',
                      // You can customize the date format here between the two double-quotation marks
                      // or leave this blank to use the default format
                      javascript: 'AFDate_FormatEx("mmm d, yyyy");',
                    },
                  ],
                  K: [
                    {
                      name: 'JavaScript',
                      // You can customize the date format here between the two double-quotation marks
                      // or leave this blank to use the default format
                      javascript: 'AFDate_FormatEx("mmm d, yyyy");',
                    },
                  ],
                },
              },
            );
  
            inputAnnot = new Annotations.DatePickerWidgetAnnotation(field);
          } else {
            // exit early for other annotations
            annotManager.deleteAnnotation(annot, false, true); // prevent duplicates when importing xfdf
            return;
          }
        } else {
          // exit early for other annotations
          return;
        }

        // set position
        inputAnnot.PageNumber = annot.getPageNumber();
        inputAnnot.X = annot.getX();
        inputAnnot.Y = annot.getY();
        inputAnnot.rotation = annot.Rotation;
        if (annot.Rotation === 0 || annot.Rotation === 180) {
          inputAnnot.Width = annot.getWidth();
          inputAnnot.Height = annot.getHeight();
        } else {
          inputAnnot.Width = annot.getHeight();
          inputAnnot.Height = annot.getWidth();
        }

        // delete original annotation
        annotsToDelete.push(annot);

        // customize styles of the form field
        Annotations.WidgetAnnotation.getCustomStyles = function (widget) {
          if (widget instanceof Annotations.SignatureWidgetAnnotation) {
            return {
              border: '1px solid #a5c7ff',
            };
          }
        };
        Annotations.WidgetAnnotation.getCustomStyles(inputAnnot);

        // draw the annotation the viewer
        annotManager.addAnnotation(inputAnnot);
        fieldManager.addField(field);
        annotsToDraw.push(inputAnnot);
      }),
    );

    // delete old annotations
    annotManager.deleteAnnotations(annotsToDelete, null, true);

    // refresh viewer
    await annotManager.drawAnnotationsFromList(annotsToDraw);
    await uploadForSigning();

    // setLoading(false);
  };

  // 일반전송 : 멤버 아이디로 필드값 저장
  // 대량전송 : 멤버가 아닌 공통값(bulk)으로 저장
  const addField = (type, point = {}, member = {}, name = '', value = '', flag = {}) => {

    console.log('called addField')

    const { docViewer, Annotations } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const doc = docViewer.getDocument();
    const displayMode = docViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx =
      page.first !== null ? page.first : docViewer.getCurrentPage();
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = docViewer.getZoom();

    var textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = page_idx;
    const rotation = docViewer.getCompleteRotation(page_idx) * 90;
    textAnnot.Rotation = rotation;
    if (rotation === 270 || rotation === 90) {
      textAnnot.Width = 50.0 / zoom;
      textAnnot.Height = 250.0 / zoom;
    } else {
      if (type == "SIGN") {
        textAnnot.Width = 90.0 / zoom;
        textAnnot.Height = 90.0 / zoom;

        // console.log('ADD SIGN')
        // console.log('member.key:'+member.key)

        // const asisInputValue = inputValue.get(member.key)
        // const updateNum = asisInputValue.sign + 1 
        // updateInputValue(member.key, {sign:updateNum, text:asisInputValue.text})


      } else if (type == "TEXT") {
        textAnnot.Width = 200.0 / zoom;
        textAnnot.Height = 30.0 / zoom;
      } else {
        textAnnot.Width = 250.0 / zoom;
        textAnnot.Height = 30.0 / zoom;
      }
    }
    textAnnot.X = (page_point.x || page_info.width / 2) - textAnnot.Width / 2;
    textAnnot.Y = (page_point.y || page_info.height / 2) - textAnnot.Height / 2;

    textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
    textAnnot.custom = {
      type,
      value,
      flag,
      // name: `${assignee}_${type}_`,  //TODO 이름_type으로 
      // name: `${assignee.value}_${type}_`
      // name: `${member.key}_${type}_`
      name: (sendType === 'B') ? `bulk_${type}_` : `${member.key}_${type}_`
    };

    // set the type of annot
    // textAnnot.setContents(textAnnot.custom.name);
    // textAnnot.setContents(assignee.label+"_"+type);
    // textAnnot.setContents(member.name+"_"+type);
    textAnnot.setContents((sendType === 'B') ? type : member.name+"_"+type);
    textAnnot.FontSize = '' + 20.0 / zoom + 'px';
    textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
    textAnnot.TextColor = new Annotations.Color(0, 165, 228);
    textAnnot.StrokeThickness = 1;
    textAnnot.StrokeColor = new Annotations.Color(0, 165, 228);
    textAnnot.TextAlign = 'center';

    textAnnot.Author = annotManager.getCurrentUser();

    annotManager.deselectAllAnnotations();
    annotManager.addAnnotation(textAnnot, true);
    annotManager.redrawAnnotation(textAnnot);
    annotManager.selectAnnotation(textAnnot);
  };

  const getToday = () => {
    var date = new Date();
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + month + day;
  }

  const uploadForSigning = async () => {

    // const referenceString = `docToSign/${getToday()}/${_id}${Date.now()}.pdf`;
    // var reg = new RegExp('(.*\/).*')
    // var path = reg.exec(referenceString)[1];
    // console.log("path:"+path)

    const filename = `${_id}${Date.now()}.pdf`
    const path = `documents/${getToday()}`


    // 1. 파일 저장
    // 2. DB 저장
    // const docRef = storageRef.child(referenceString);
    const { docViewer, annotManager } = instance;
    const doc = docViewer.getDocument();
    const xfdfString = await annotManager.exportAnnotations({ widgets: true, fields: true });
    const data = await doc.getFileData({ xfdfString });
    const arr = new Uint8Array(data);
    const blob = new Blob([arr], { type: 'application/pdf' });
    // docRef.put(blob).then(function (snapshot) {
    //   console.log('Uploaded the blob');
    // });

    // create an entry in the database
    // const emails = assignees.map(assignee => {
    //   return assignee.email;
    // });

    const users = assignees.map(assignee => {
      return assignee.key;
    });
    // await addDocumentToSign(_id, email, referenceString, emails);


    setLoading(true);
    // TO-BE
    // 1.SAVE FILE
    const formData = new FormData()
    // formData.append('path', 'docToSign/')
    formData.append('path', path)
    formData.append('file', blob, filename)
    const res = await axios.post(`/api/storage/upload`, formData)
    console.log(res)

    // 업로드 후 파일 경로 가져오기  
    var docRef = ''
    if (res.data.success){
      docRef = res.data.file.path 
    }

    // 2. SAVE THUMBNAIL
    const resThumbnail = await axios.post('/api/document/addThumbnail', {user: _id, thumbnail: thumbnail})
    var thumbnailUrl = '';
    if (resThumbnail.data.success) {
      thumbnailUrl = resThumbnail.data.thumbnail 
    }

    // 3. SAVE DOCUMENT
    const signed = false;
    const xfdf = [];
    const signedBy = [];
    const signedTime = '';

    if (sendType === 'G') { // 일반

      //users 배열 위치 조정: observer 가 제일 아래로 가도록 한다.
      observers.map(observer => {
        if (users.includes(observer)) {
          const idx = users.indexOf(observer)
          const item = users.splice(idx, 1) 
          users.splice(users.length, 0, item[0])

          console.log('result:'+users)
        }
      })

      let body = {
        user: _id,
        docTitle: (documentType === "PC") ? documentTitle : templateTitle,
        // email: email,
        docRef: docRef,
        // emails: emails,
        users: users,
        xfdf: xfdf, 
        signedBy: signedBy,
        signed: signed,
        signedTime: signedTime,
        thumbnail: thumbnailUrl,
        pageCount: pageCount,
        observers: observers
      }
      console.log("일반 전송")
      const res2 = await axios.post('/api/document/addDocumentToSign', body)
      console.log(res2)
      if (!res2.data.success) {
        alert('문서 등록 실패 !')
      }

    } else {  // 대량 전송

      const documentIds = [];
      async function saveDB(item) {
        console.log("Bulk 전송:" + item)
        let body = {
          user: _id,
          docTitle: (documentType === "PC") ? documentTitle : templateTitle,
          docType: "B",
          // email: email,
          docRef: docRef,
          // emails: emails,
          users: [item],
          xfdf: xfdf, 
          signedBy: signedBy,
          signed: signed,
          signedTime: signedTime,
          thumbnail: thumbnailUrl,
          pageCount: pageCount,
          observers: observers
        }
        const res = await axios.post('/api/document/addDocumentToSign', body)
        if (res.data.success) {
          const documentId = res.data.documentId;
          console.log("documentId:"+documentId);
          documentIds.push(documentId)
        }
      }

      const promises = users.map(saveDB);
      // wait until all promises are resolved
      await Promise.all(promises);

      console.log("Done saveDocuments !!!");

      let bulk = {
        user: _id,
        docTitle: (documentType === "PC") ? documentTitle : templateTitle,
        users: users,
        docs: documentIds,
        canceled: false,
        signed: false
      }

      console.log("documentIds:"+documentIds);
      const res = await axios.post('/api/bulk/addBulk', bulk)
      if (res.data.success) {
        console.log("Done saveBulk !!!");
      }
    }

    //4. 임시파일삭제
    if (documentType == 'PC') {
      await axios.post(`/api/storage/deleteFile`, {target: documentTempPath})
    } 

    dispatch(resetAssignAll());
    setLoading(false);
    navigate('/');
  };

  const dragOver = e => {
    e.preventDefault();
    return false;
  };

  const drop = (e, instance) => {
    const { docViewer } = instance;
    const scrollElement = docViewer.getScrollViewElement();
    const scrollLeft = scrollElement.scrollLeft || 0;
    const scrollTop = scrollElement.scrollTop || 0;
    setDropPoint({ x: e.pageX + scrollLeft, y: e.pageY + scrollTop });
    e.preventDefault();
    return false;
  };

  const dragStart = e => {
    e.target.style.opacity = 0.5;
    const copy = e.target.cloneNode(true);
    copy.id = 'form-build-drag-image-copy';
    copy.style.width = '250px';
    document.body.appendChild(copy);
    e.dataTransfer.setDragImage(copy, 125, 25);
    e.dataTransfer.setData('text', '');
  };

  const dragEnd = (e, type) => {
    addField(type, dropPoint);
    e.target.style.opacity = 1;
    document.body.removeChild(
      document.getElementById('form-build-drag-image-copy'),
    );
    e.preventDefault();
  };

  return (
    // <div className={'prepareDocument'}>
    <div>

    <PageContainer  
      // ghost
      header={{
        title: (sendType == 'B') ? '서명 요청(대량 전송)' : '서명 요청',
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="3" onClick={() => {navigate(`/assign`);}}>이전</Button>,,
          <Button key="2" type="primary" onClick={() => applyFields()} disabled={disableNext} loading={loading}>
            {formatMessage({id: 'Send'})}
          </Button>,
        ],
      }}
      content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={2} /></ProCard> }
      footer={[
      ]}
      loading={loading}
    >

      <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
      >
        <Row gutter={[24, 24]}>
          <Col span={responsive ? 24 : 5}>

            {/* 일반 발송 */}
            {(sendType === 'G') ? (<div>  
              <List
              rowKey="id"
              loading={loading}
              // grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
              grid={{ gutter: 24, column: responsive ? 2 : 1}}
              dataSource={assignees}
              renderItem={item =>
                <List.Item key={item.key}>
                  <Card size="small" type="inner" title={item.JOB_TITLE ? item.name+' '+item.JOB_TITLE : item.name} style={{ minWidth: 148 }}>
                    <p>
                      <Badge count={boxData.filter(e => e.key === item.key)[0].sign}>
                        <Button block disabled={observers.filter(v => v === item.key).length > 0} icon={<PlusOutlined />} onClick={e => { addField('SIGN', {}, item); }}>{formatMessage({id: 'input.sign'})}</Button>
                      </Badge>
                      {/* {boxData.filter(e => e.key === item.key)[0].sign} */}
                    </p>
                    <p>
                      <Badge count={boxData.filter(e => e.key === item.key)[0].text}>
                        <Button block disabled={observers.filter(v => v === item.key).length > 0} icon={<PlusOutlined />} onClick={e => { addField('TEXT', {}, item); }}>{formatMessage({id: 'input.text'})}</Button>
                      </Badge>
                      {/* {boxData.filter(e => e.key === item.key)[0].text} */}
                    </p>
                    {/* 옵저버 기능 추가 */}
                    <p>
                      <Checkbox onChange={e => {

                        console.log('called observer:'+item.key)
                        console.log('checked = ', e.target.checked);

                        if (e.target.checked) {
                          // observer 추가 
                          setObservers([...observers, item.key])
                          
                          // boxData 갱신
                          const member = boxData.filter(e => e.key === item.key)[0]
                          member.observer = member.observer + 1
                          const newBoxData = boxData.slice()
                          newBoxData[boxData.filter(e => e.key === item.key).index] = member 
                          setBoxData(newBoxData)

                          // annotation 삭제
                          const { Annotations, docViewer } = instance;
                          const annotManager = docViewer.getAnnotationManager();
                          const annotationsList = annotManager.getAnnotationsList();
                          const annotsToDelete = [];

                          annotationsList.map(async (annot, index) => {
                            console.log("annot.custom.name:"+annot.custom.name)
                            if (annot.custom.name.includes(item.key)) {
                              annotsToDelete.push(annot)
                            }
                          })

                          annotManager.deleteAnnotations(annotsToDelete, null, true);

                        } else {
                          // observer 삭제
                          setObservers(observers.filter(v => v != item.key))
                          
                          // boxData 갱신
                          const member = boxData.filter(e => e.key === item.key)[0]
                          member.observer = member.observer - 1
                          const newBoxData = boxData.slice()
                          newBoxData[boxData.filter(e => e.key === item.key).index] = member 
                          setBoxData(newBoxData)

                        }

                      }}>서명 없이 문서 수신</Checkbox>
                    </p>
                  </Card>
                </List.Item>
              }
              />

            {/* 대량 발송 */}
            </div>) : (<div>

              <Card size="small" type="inner" title="서명 참여자" style={{ minWidth: 148 }}>
                    <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].sign : 0}>
                        <Button icon={<PlusOutlined />} onClick={e => { addField('SIGN', {}); }}>{formatMessage({id: 'input.sign'})}</Button>
                      </Badge>
                    </p>
                    <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].text : 0}>
                        <Button icon={<PlusOutlined />} onClick={e => { addField('TEXT', {}); }}>{formatMessage({id: 'input.text'})}</Button>
                      </Badge>
                    </p>
              </Card>

            </div>)}  
            {/* 유저별로 카드 띄우기 */}
            {/* <List
              rowKey="id"
              loading={loading}
              // grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
              grid={{ gutter: 24, column: responsive ? 2 : 1}}
              dataSource={assignees}
              renderItem={item =>
                <List.Item key={item.key}>
                  <Card size="small" type="inner" title={item.name} style={{ minWidth: 148 }}>
                    <p><Button icon={<PlusOutlined />} onClick={e => { addField('SIGN', {}, item); }}>{formatMessage({id: 'input.sign'})}</Button></p>
                    <p><Button icon={<PlusOutlined />} onClick={e => { addField('TEXT', {}, item); }}>{formatMessage({id: 'input.text'})}</Button></p>
                  </Card>
                </List.Item>
              }
            /> */}

          </Col>
          <Col span={responsive ? 24 : 19}><div className="webviewer" ref={viewer}></div></Col>
        </Row>

      </RcResizeObserver>


    </PageContainer>

    
    </div>
  );
};

export default PrepareDocument;