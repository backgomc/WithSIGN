import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import SignaturePad from 'react-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { navigate } from '@reach/router';
// import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { TreeSelect, Input, Row, Col, Modal, Spin, Button, Upload, message, Typography, Divider, Steps, Tag } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { mergeDirect } from './MergeDirect';
import WebViewer from '@pdftron/webviewer';
// import 'gestalt/dist/gestalt.css';
import './SignDirect.css';
import { useIntl } from "react-intl";
// import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard, { CheckCard } from '@ant-design/pro-card';
import {
  PaperClipOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { LICENSE_KEY } from '../../config/Config';
import { selectDirect, setDirectTempPath } from './DirectSlice';
import { setDocumentTempPath, selectTemplateTitle, setTemplateTitle, setAttachFiles, selectAttachFiles } from '../Assign/AssignSlice';
import moment from 'moment';
import 'moment/locale/ko';
import ProForm, { ProFormUploadButton } from '@ant-design/pro-form';
// import Item from 'antd/lib/list/Item';
import UserSelectorModal from '../Common/UserSelectorModal';
import { deepCopyObject } from '../../util/common';
import styled from 'styled-components';

const { confirm } = Modal;
const { TextArea } = Input;
const { SHOW_PARENT } = TreeSelect;
const { Step } = Steps;

const StepStyle = styled.div`
    .ant-steps-item-title {
        // font-size: 16px;
        font-weight: bold;
        // color: #666666;
    }
    width:50%; 
`;

const SignDirect = () => {

  const { formatMessage } = useIntl();

  const [webViewInstance, setWebViewInstance] = useState(null);
  const [annotationManager, setAnnotationManager] = useState(null);
  const [annotPosition, setAnnotPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [disableNext, setDisableNext] = useState(true);
  const [disableCancel, setDisableCancel] = useState(true);
  const [visiblModal, setVisiblModal] = useState(false);
  const [signList, setSignList] = useState([]);
  const [signData, setSignData] = useState('');
  const [signModal, setSignModal] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [signCount, setSignCount] = useState(0);
  const [allCheck, setAllCheck] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [textSign, setTextSign] = useState(formatMessage({id: 'sign.complete'}))
  const [fileList, setFileList] = useState(useSelector(selectAttachFiles)); // 첨부 파일 (max:3개)
  const [selectUsers, setSelectUsers] = useState([]);
  const [userKey, setUserKey] = useState();
  const [thumbnail, setThumbnail] = useState(null);
  // const [observers, setObservers] = useState([]);

  const templateTitle = useSelector(selectTemplateTitle);
  const [documentTitle, setDocumentTitle] = useState(templateTitle);

  const dispatch = useDispatch();
  // const uploading = useSelector(selectUploading);
  const direct = useSelector(selectDirect);
  const user = useSelector(selectUser);
  
  const [lastUsers, setLastUsers] = useState([]);
  const [current, setCurrent] = useState(0);


  const { directRef, xfdfIn, requesters, observers, signees } = direct;
  const { _id, name, JOB_TITLE, DEPART_CODE, OFFICE_CODE, SABUN, OFFICE_NAME, DEPART_NAME } = user;

  const [annotsToDelete, setAnnotsToDelete] = useState([]);
  
  const viewer = useRef(null);
  const cancelMessage = useRef({});

  const sigCanvas = useRef({});

  const clear = () => {
    sigCanvas.current.clear();
    let chkObj = document.getElementsByClassName('ant-pro-checkcard-checked'); // 선택한 서명
    if (chkObj && chkObj[0]) chkObj[0].click();
    setAllCheck(false);
  }
  
  const handleOk = async () => {
    const { Core, UI } = webViewInstance;
    const { documentViewer } = Core;
    if (!sigCanvas.current.isEmpty()) {
      const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
      await signatureTool.setSignature(sigCanvas.current.toDataURL('image/png'));
      signatureTool.addSignature();
    }
    UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
    setSignModal(false);
    clear();
  }

  const handleCancel = () => {
    setSignModal(false);
    clear();
  };
  
  useEffect(() => {

    // console.log('observers:'+observers)
    // if(observers && observers.includes(_id)) {
    //   setDisableNext(false)
    //   setTextSign('문서 수신')
    // }

    let _lastUsers = [...signees, ...requesters].filter(el => el.key !== 'requester1');
    _lastUsers.sort((a, b) => a.order - b.order)
    setLastUsers(_lastUsers);
    console.log('_lastUsers', _lastUsers)



    fetchSigns();

    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'viewControlsButton',
          'panToolButton',
          'selectToolButton', 
          'searchButton',
          'menuButton',
          'rubberStampToolGroupButton',
          'stampToolGroupButton',
          'fileAttachmentToolGroupButton',
          'calloutToolGroupButton',
          'undo',
          'redo',
          'eraserToolButton',
          'signatureToolGroupButton',
          'viewControlsOverlay',
          // 'toolsOverlay',  // 서명 도구 상호 작용시 필요
          'annotationPopup',
          'annotationStylePopup',
          'toolStylePopup',   // 서명 목록 팝업
          'stylePopup',
          'textPopup',
          'contextMenuPopup',
          'annotationNoteConnectorLine'
        ],
      },
      viewer.current,
    ).then(async instance => {
      // const { docViewer, annotManager, Annotations, CoreControls } = instance;
      const { Core, UI } = instance;
      const { documentViewer, annotationManager, Annotations } = Core;
      setAnnotationManager(annotationManager);
      setWebViewInstance(instance);

      const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
      signatureTool.addEventListener('locationSelected', async () => {
        setSignModal(true);
        UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
      // const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      // signatureTool.on('locationSelected', async (location, widget) => {
      //   console.log(location)
      //   console.log(widget)
      //   console.log(widget.fieldName)

      //   instance.closeElements(['signatureModal']);
      //   instance.setToolbarGroup('toolbarGroup-View');

      //   if (widget.fieldName.startsWith(_id) || widget.fieldName.startsWith('requester1')) { 
      //     setSignModal(true);
      //   } 
      });

      // set language
      UI.setLanguage('ko');

      // set the ribbons(상단 그룹) and second header
      // UI.enableElements(['ribbons']);
      // UI.disableElements(['toolbarGroup-View', 'toolbarGroup-Shapes', 'toolbarGroup-Measure', 'toolbarGroup-Edit']);
      
      // select only the insert group
      // instance.disableElements(['header']);
      UI.setToolbarGroup('toolbarGroup-View');
      Core.setCustomFontURL("/webfonts/");

      // load document
      // const storageRef = storage.ref();
      // const URL = await storageRef.child(docRef).getDownloadURL();
      
      // DISTO
      const URL = '/' + directRef;
      UI.loadDocument(URL);


      // DB 저장해둔 입력 컴포넌트 표시 (서명 참여자들 위치 확인 시켜주는 용도)
      // const annotations = await annotManager.importAnnotations(xfdfIn);
      // annotations.forEach(annot => {
      //   annotManager.redrawAnnotation(annot);
      // });




      documentViewer.addEventListener('documentLoaded', () => {
        console.log('documentLoaded called');
        setPageCount(documentViewer.getPageCount());

        // 밸류 자동 셋팅
        documentViewer.getAnnotationsLoadedPromise().then(() => {
          // iterate over fields
          const fieldManager = annotationManager.getFieldManager();
          fieldManager.forEachField(field => {
            console.log(field.getValue());
            console.log('fieldName', field.name);
            
            if (field.name?.includes('AUTONAME')) {
              field.setValue(name);
            } else if (field.name?.includes('AUTOJOBTITLE')) {
              field.setValue(JOB_TITLE);
            } else if (field.name?.includes('AUTOSABUN')) {
              field.setValue(SABUN);
            } else if (field.name?.includes('AUTODATE')) {
              field.setValue(moment().format('YYYY년 MM월 DD일'));
            } else if (field.name?.includes('AUTOOFFICE')) {
              field.setValue(OFFICE_NAME);
            } else if (field.name?.includes('AUTODEPART')) {
              field.setValue(DEPART_NAME);
            }
            
          });
        });

        // 썸네일 저장
        const doc = documentViewer.getDocument();
        doc.loadCanvasAsync(({
          pageNumber: 1,
          width: 300,  // 윈도우 기준으로 맞춤. 맥에서는 해상도가 더 크게 나옴
          drawComplete: async (thumbnail) => {
            setThumbnail(thumbnail.toDataURL())
          }
        }));
        
      });

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {

          if (widget.fieldName.startsWith(_id) || widget.fieldName.startsWith('requester1')) { 
            return {
              border: '1px solid #a5c7ff',
              'background-color': '#e8e8e8',
              color: 'black',
              // lineHeight: 1.5,
              textAlign: widget.getCustomData('textAlign')
            };
          } else {
            return {
              color: 'black',
              // lineHeight: 1.5,
              textAlign: widget.getCustomData('textAlign')
            };
          }

        } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          if (widget.fieldName.startsWith(_id) || widget.fieldName.startsWith('requester1')) { 
            return {
              border: '1px solid #a5c7ff',
            };
          } else {
            return {
              border: '1px solid red',
              // display: 'none'
            };
          }

        } else if (widget instanceof Annotations.CheckButtonWidgetAnnotation) {
          return {
            border: '1px solid #a5c7ff',
          };
        }
      };

      annotationManager.addEventListener('annotationChanged', (annotations, action, { imported }) => {
        console.log("annotationChanged called(action):"+ action)

        if (!imported && action === 'add') {  // 서명 및 입력값이 추가 된 경우
          const annotList = annotationManager.getAnnotationsList();
          let widgetCount = 0;
          let createCount = 0;
          annotList.forEach(function(annot) {
            if (annot instanceof Annotations.SignatureWidgetAnnotation && annot.fieldName.startsWith('requester1')) widgetCount++;
            if (annot.ToolName === 'AnnotationCreateRubberStamp') createCount++;
          });
          if (widgetCount === 0 || widgetCount > 0 && widgetCount === createCount) setDisableNext(false);
        }

        if (!imported && action === 'delete') {  // 서명 및 입력값이 삭제 된 경우
          annotations.forEach(function(annot) {
            if (annot.ToolName === 'AnnotationCreateRubberStamp') setDisableNext(true);
          });
        }

        if (imported && (action === 'add' || action === 'modify')) {
          annotations.forEach(function(annot) {
            // 서명 참여자는 모든 Annotation 이동, 삭제 불가
            // annot.NoMove = true;
            // annot.NoDelete = true;
            // annot.ReadOnly = true;
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;

              //TODO
              // 1. [완료]다른 사람의 텍스트가 안보이는 것 수정 
              // 2. [완료]다른 사람의 텍스트는 스타일 변경 
              // 3. [진행중]다른 사람의 텍스트 및 사인은 수정 안되게 하기  

              console.log("annot.fieldName:"+annot.fieldName)

              // if (annot.fieldName.includes('AUTONAME')) {
              //   // annot.value = name;
              //   annot.setValue(name);
              //   annot.setCustomData(annot.fieldName, name);
              //   // annot.defaultValue = name;

              //   // annotManager.drawAnnotations(1, null, true)
              //   annot.setContents('ABC');
              //   annotManager.updateAnnotation(annot);
              // }

              if (!annot.fieldName.startsWith('requester1')) {
                annot.Hidden = true;
                annot.Listable = false;
                annot.ReadOnly = true;
                annot.NoMove = true;

                //TODO requester1이 아닌경우 히든시키지 말고 보여주되 스타일을 바꿔주기
                // annot.defaultValue = annot.fieldName;
                
                

                // const div = document.createElement('div');
                // div.style.width = '100%';
                // div.style.height = '100%';
                // div.style.cursor = 'pointer';
              
                // const inlineSvg = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 25.588 25.588" style="enable-background:new 0 0 25.588 25.588; width: 100%; height: 100%; transform: translateX(-35%);" xml:space="preserve"><g><path style="fill:#030104;" d="M18.724,9.903l3.855,1.416l-3.206,8.729c-0.3,0.821-1.927,3.39-3.06,3.914l-0.275,0.75c-0.07,0.19-0.25,0.309-0.441,0.309c-0.054,0-0.108-0.01-0.162-0.029c-0.243-0.09-0.369-0.359-0.279-0.604l0.26-0.709c-0.575-1.117-0.146-4.361,0.106-5.047L18.724,9.903z M24.303,0.667c-1.06-0.388-2.301,0.414-2.656,1.383l-2.322,6.326l3.854,1.414l2.319-6.325C25.79,2.673,25.365,1.056,24.303,0.667z M17.328,9.576c0.108,0.04,0.219,0.059,0.327,0.059c0.382,0,0.741-0.234,0.882-0.614l2.45-6.608c0.181-0.487-0.068-1.028-0.555-1.208c-0.491-0.178-1.028,0.068-1.209,0.555l-2.45,6.608C16.592,8.855,16.841,9.396,17.328,9.576z M13.384,21.967c-0.253-0.239-0.568-0.537-1.078-0.764c-0.42-0.187-0.829-0.196-1.128-0.203c-0.031,0-0.067-0.001-0.103-0.002c-0.187-0.512-0.566-0.834-1.135-0.96c-0.753-0.159-1.354,0.196-1.771,0.47c0.037-0.21,0.098-0.46,0.143-0.64c0.144-0.58,0.292-1.18,0.182-1.742c-0.087-0.444-0.462-0.774-0.914-0.806c-1.165-0.065-2.117,0.562-2.956,1.129c-0.881,0.595-1.446,0.95-2.008,0.749c-0.686-0.244-0.755-2.101-0.425-3.755c0.295-1.49,0.844-4.264,2.251-5.524c0.474-0.424,1.16-0.883,1.724-0.66c0.663,0.26,1.211,1.352,1.333,2.653c0.051,0.549,0.53,0.952,1.089,0.902c0.55-0.051,0.954-0.539,0.902-1.089c-0.198-2.12-1.192-3.778-2.593-4.329C6.058,7.07,4.724,6.982,3.107,8.429c-1.759,1.575-2.409,4.246-2.88,6.625c-0.236,1.188-0.811,5.13,1.717,6.029c1.54,0.549,2.791-0.298,3.796-0.976c0.184-0.124,0.365-0.246,0.541-0.355c-0.167,0.725-0.271,1.501,0.167,2.155c0.653,0.982,1.576,1.089,2.742,0.321c0.045-0.029,0.097-0.063,0.146-0.097c0.108,0.226,0.299,0.475,0.646,0.645c0.42,0.206,0.84,0.216,1.146,0.224c0.131,0.003,0.31,0.007,0.364,0.031c0.188,0.083,0.299,0.185,0.515,0.389c0.162,0.153,0.333,0.312,0.55,0.476c0.18,0.135,0.39,0.199,0.598,0.199c0.304,0,0.605-0.139,0.801-0.4c0.331-0.442,0.241-1.069-0.201-1.4C13.61,22.183,13.495,22.072,13.384,21.967z"/></g></svg>';
                // div.innerHTML = inlineSvg;

                // annot.createInnerElement(div)
                
                


              }

              // if (!annot.fieldName.startsWith(_id)) {

              //   // TODO
              //   // 3. [진행중]다른 사람의 텍스트 및 사인은 수정 안되게 하기 | 아래 메서드 안먹힘
              //   // annot.disabled = true;
                
              //   console.log('readonly called');

              //   if (annot.fieldName.includes('SIGN')) {  // 다른 사람이 입력한 텍스트는 보여야 됨
              //     annot.Hidden = true;
              //     annot.Listable = false;
              //   }
              //   if (annot.fieldName.includes('TEXT')) {
              //     annot.fieldFlags.set('ReadOnly', true);
              //   }
              //   if (annot.fieldName.includes('CHECKBOX')) {
              //     // annot.Hidden = true;
              //     // annot.Listable = false;
              //     annot.fieldFlags.set('ReadOnly', true);
              //   }
              // }

            } else {
              console.log('일반 편집한 텍스트 컴포넌트')
              // annot.Listable = false;

              // const annotsToDeleteNew = annotsToDelete.slice()
              // annotsToDeleteNew.push(annot) 
              // setAnnotsToDelete(annotsToDeleteNew)
              // annotsToDelete.push(annot);

              // setAnnotsToDelete(annotsToDelete => [...annotsToDelete, annot])
            }
          });
        }
      });

    });
  

  }, [directRef, _id]);

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axios.post('/api/sign/signs', param);
    if (res.data.success) {
      const signs = res.data.signs;
      setSignList(signs);
    }
  }

  const signCard = (sign) => {
    return <CheckCard key={uuidv4()} style={{width:'auto', height: 'auto'}} value={sign.signData} avatar={sign.signData} className="customSignCardCSS"/>
  }
  
  const completeSigning = async () => {

    // 유효성 체크
    if ((requesters.length - 1) !== selectUsers.length) {
      message.warning('참여자를 지정해주세요!');
      return;
    }

    const { Core } = webViewInstance;
    const { Annotations } = Core;
    const annotList = annotationManager.getAnnotationsList();
    annotationManager.deselectAllAnnotations();
    annotList.forEach(function(annot) { // freetext 제외 처리 위한 설정
      annot.NoMove = false;
      annot.NoDelete = false;
      annot.ReadOnly = false;
      // Text Widget >>> Free Text
      if ( annot.fieldName 
        && annot.fieldName.startsWith('requester1')
        && ( annot.fieldName.includes('TEXT')
          || annot.fieldName.includes('AUTONAME')
          || annot.fieldName.includes('AUTOJOBTITLE')
          || annot.fieldName.includes('AUTOSABUN')
          || annot.fieldName.includes('AUTODATE')
          || annot.fieldName.includes('AUTOOFFICE')
          || annot.fieldName.includes('AUTODEPART')
        )
      ) {
        console.log('본인 입력한 Text Widget을 Free Text로 변환');
        let textAnnot = new Annotations.FreeTextAnnotation();
        let textStyle = {
          'underline': annot.getCustomData('textDecoration').indexOf('underline') >= 0 ? true : false,
          'line-through': annot.getCustomData('textDecoration').indexOf('line-through') >= 0 ? true : false,
          'font-weight': annot.getCustomData('fontWeight'),
          'font-style': annot.getCustomData('fontStyle')
        }
        textAnnot.Opacity = 1;
        textAnnot.StrokeThickness = 0;
        textAnnot.PageNumber = annot.PageNumber;
        textAnnot.Rotation = annot.Rotation;
        textAnnot.FillColor = new Annotations.Color(0, 0, 0, 0);
        textAnnot.TextColor = new Annotations.Color(0, 0, 0, 1);
        textAnnot.StrokeColor = new Annotations.Color(0, 0, 0, 1);
        textAnnot.X = annot.getX();
        textAnnot.Y = annot.getY();
        textAnnot.Width = annot.getWidth();
        textAnnot.Height = annot.getHeight();
        textAnnot.Font = annot.getCustomData('font');
        textAnnot.FontSize = annot.getCustomData('fontSize');
        textAnnot.TextAlign = annot.getCustomData('textAlign');
        textAnnot.TextVerticalAlign = annot.getCustomData('textVerticalAlign');
        textAnnot.Author = annotationManager.getCurrentUser();
        textAnnot.setContents(annot.getValue());
        textAnnot.updateRichTextStyle(textStyle);
        annotationManager.addAnnotation(textAnnot);
        annotationManager.drawAnnotationsFromList(textAnnot);
      }
    });

    const xfdf = await annotationManager.exportAnnotations({ widgets: true, fields: false });

    setSpinning(true)
    // let annotList = annotManager.getAnnotationsList();
    // annotList.forEach(function(annot) { // freetext 제외 처리 위한 설정
    //   console.log('annot2', annot.fieldName)
    // });

    // console.log('xfdf', xfdf);
    // const xfdf = await annotManager.exportAnnotations({ widgets: true, fields: true,	annotList: annotManager.getAnnotationsList() });

    // 서명요청자 -> 선택한 사용자로 변경 
    let _xfdfIn = xfdfIn;
    let _observers = [];
    // let _requesters = requesters.filter(el => el.key !== 'requester1');
    let _requesters = [];
    console.log('_xdfIn before', _xfdfIn)

    let _lastUsers = [];


    // xfdf 사용자 치환
    selectUsers.forEach(el => {
      _xfdfIn = _xfdfIn.split(el.key).join(el.value.split('|')[0])  //replaceAll
    })

    // 사용자 치환 
    lastUsers.forEach(el => {
      if (selectUsers.filter(el2 => el.key === el2.key).length > 0) {
        let _lastUser = deepCopyObject(el);
        _lastUser.key = selectUsers.filter(el2 => el.key === el2.key)[0].value.split('|')[0]
        _lastUsers.push(_lastUser)
      } else {
        _lastUsers.push(el)
      }
    })

    // 옵저버 치환
    observers.forEach(el => {
      if (selectUsers.filter(el2 => el.key === el2.key).length > 0) {
        _observers.push(selectUsers.filter(el2 => el.key === el2.key)[0].value.split('|')[0])
      } else {
        _observers.push(el)
      }
    }) 


    // selectUsers.forEach(el => {
    //   _xfdfIn = _xfdfIn.split(el.key).join(el.value.split('|')[0])  //replaceAll
      
    //   observers.forEach(observer => {
    //     if (el.key === observer) {
    //       _observers.push(el.value.split('|')[0]);
    //     } else {
    //       _observers.push(observer);
    //     }
    //   })

    //    requesters.forEach(requester => {
    //     if (el.key === requester.key && el.key !== 'requester1') {
    //       let _requester = deepCopyObject(requester);
    //       _requester.key = el.value.split('|')[0];
    //       _requesters.push(_requester);
    //     }
    //   })

    // })

    console.log('_lastUsers', _lastUsers);

    // let users = selectUsers.map(el => {
    //   return el.key;
    // })

    console.log('_xdfIn after', _xfdfIn)
  
    // 1. SAVE FILE
    const tempPath = await mergeDirect(directRef, [xfdf], _xfdfIn, _id);
    console.log('tempPath', tempPath)

    // TODO : 바로 서명 요청 하기 
    // 2. SAVE THUMBNAIL
    const resThumbnail = await axios.post('/api/document/addThumbnail', {user: _id, thumbnail: thumbnail})
    let thumbnailUrl = '';
    if (resThumbnail.data.success) {
      thumbnailUrl = resThumbnail.data.thumbnail 
    }

    // 3. SAVE 첨부파일
    const attachPaths = []
    var files = []
    console.log('attachFiles:', fileList)
    if (fileList.length > 0) {

      const formData = new FormData()
      formData.append('path', 'attachfiles/'+Date.now()+'/');

      fileList.forEach(file => formData.append('files', file));

      const resFile = await axios.post(`/api/storage/uploadFiles`, formData)
      if (resFile.data.success) {
        files = resFile.data.files
      }
    }

    // 4. SAVE DOCUMENT
    const signed = false;
    const signedBy = [];
    const signedTime = '';

    var docId = '';
    var status = 'success';
    var resultMsg = '서명 요청이 정상 처리되었습니다.';

    // 순차 전송을 위해 필드 추가
    var usersOrder = [];
    var usersTodo = [];

    // SUNCHA: 순차 기능 활성화 
    // let assignees = [..._requesters, ...signees];


    _lastUsers.sort((a, b) => a.order - b.order);
    let maxOrder = _lastUsers[0]?.order;

    console.log('_lastUsers', _lastUsers);
    console.log('maxOrder', maxOrder);
    var orderType = 'A';
    _lastUsers.forEach(user => {
      usersOrder.push({'user': user.key, 'order': user.order})
      if (user.order === maxOrder) {
        usersTodo.push(user.key)
      }
      if (user.order > 0) {
        orderType = 'S';
      }
    })

    let users = _lastUsers.map(el => {
      return el.key;
    })

    let body = {
      user: _id,
      docTitle: documentTitle,
      // email: email,
      docRef: tempPath,
      // emails: emails,
      users: users,
      xfdf: [], 
      signedBy: [],
      signed: false,
      signedTime: '',
      thumbnail: thumbnailUrl,
      pageCount: pageCount,
      observers: _observers,
      // orderType: observers.length > 0 ? 'S':'A', // SUSIN: 수신 기능만 활성화
      orderType: orderType, //SUNCHA: 순차 기능 활성화 
      usersOrder: usersOrder,
      usersTodo: usersTodo,
      attachFiles: files
    }
    console.log("바로 전송")
    const res2 = await axios.post('/api/document/addDocumentToSign', body)
    console.log(res2)
    if (res2.data.success) {
      docId = res2.data.documentId;
      status = 'success';
      resultMsg = '서명 요청이 정상 처리되었습니다.';
    } else {
      docId = '';
      status = 'error';
      resultMsg = '서명 요청에 실패하였습니다.';
    }





    // dispatch(setDocumentTempPath(tempPath))
    setSpinning(false)
    // navigate('/documentList');
    navigate('/prepareResult', { state: {status:status, title:resultMsg, docId:docId}}); 

  }

  const onChangeTemplateTitle = (text) => {
    if (text === '') return false;
    dispatch(setTemplateTitle(text));
    setDocumentTitle(text);
  }

  const propsAttach = {
    onRemove: file => {
      console.log('onRemove called', file)

      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList)

      // 첨부파일 셋팅
      dispatch(setAttachFiles(newFileList));
    },
    beforeUpload: file => {

      console.log('beforeUpload called', file)

      if(fileList.length > 2) {
        message.warning('첨부파일 개수는 3개까지 가능합니다!');
        return Upload.LIST_IGNORE;
      }

      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.warning('File must smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }
      
      file.url = URL.createObjectURL(file)  // 업로드 전에 preview 를 위해 추가
      setFileList([...fileList, file])

      // 첨부파일 셋팅
      dispatch(setAttachFiles([...fileList, file]));

      return false;
    },
    fileList,
    onPreview: async file => {
      console.log('aa', file)
      // let src = file.url;
      let src = URL.createObjectURL(file)
      console.log('src', src)
      if (!src) {
        src = await new Promise(resolve => {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = () => resolve(reader.result);
        });
      }
      const image = new Image();
      image.src = src;
      const imgWindow = window.open(src);
      imgWindow.document.write(image.outerHTML);
    },
  };

  const onChangeStep = (value) => {
    console.log('onChange:', current);
    setCurrent(value);
  };

  const content = (
    <>

      <Divider />
      <StepStyle>
      <Steps current={current} onChange={onChangeStep} progressDot>
        <Step title={name + ' ' + JOB_TITLE} description="신청/제출" />
        {lastUsers.map(el => {
          if (el.key.startsWith('requester')) {
            return (
              <Step title={<Button style={{borderColor:'#a5c7ff'}} onClick={() => {setUserModal(true); setUserKey(el.key)}}>
              {selectUsers.filter(e => e.key === el.key).length > 0 ? 
              selectUsers.filter(e => e.key === el.key)[0]?.value.split('|')[2] : '참여자 지정'}
            </Button>} description={observers.filter(observer => observer === el.key).length > 0 ?  <>[{parseInt(el.order)+1}] 수신</> : <>[{parseInt(el.order)+1}] 서명</>} disabled />
            )
          } else {
            return <Step title={el.name + ' ' + el.JOB_TITLE} description={observers.filter(observer => observer === el.key).length > 0 ?   <>[{parseInt(el.order)+1}] 수신</> : <>[{parseInt(el.order)+1}] 서명</>} disabled />
          }
        })}
      </Steps>
      </StepStyle>

    <Divider />

    <ProFormUploadButton
      name="attachFile"
      label="첨부파일"
      title="가져오기"
      tooltip="해당 문서에 파일을 첨부(최대 파일수 3개, 최대 용량 10MB)"
      max={3}
      fieldProps={{
        name: 'file',
        // listType: 'picture-card',
        ...propsAttach
      }}
      // action="/upload.do"
      // extra="최대 파일수 3개, 최대 용량 10MB"
    />
    </>
  )

  return (
    <div>
    <PageContainer  
      header={{
        title: <Typography.Title editable={{onChange: (text) => {onChangeTemplateTitle(text)}, tooltip: false}} level={5} style={{ margin: 0 }} >{templateTitle}</Typography.Title>,
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}></Button>,
          <Button key="2" type="primary" loading={loading} onClick={() => completeSigning()} disabled={disableNext}>
            {formatMessage({id: 'submit'})}
          </Button>,
        ],
      }}
      content={content}
      footer={[
      ]}
      loading={loading}
    >

        <Row gutter={[24, 24]}>
          <Col span={24}>
          <Spin tip="로딩중..." spinning={spinning}>
          <div className="webviewer" ref={viewer}></div>
          </Spin>
          </Col>
        </Row>


        <Modal
          visible={signModal}
          width={450}
          title="직접서명 또는 서명선택"
          onOk={handleOk}
          onCancel={handleCancel}
          footer={[
            // <Checkbox key={uuidv4()} checked={allCheck} onChange={e => {setAllCheck(e.target.checked);}} style={{float:'left'}}>전체 서명</Checkbox>,
            <Button key="back" onClick={clear}>지우기</Button>,
            <Button key="submit" type="primary" loading={spinning} onClick={handleOk}>확인</Button>
          ]}
          bodyStyle={{padding: '0px 24px'}}
        >
          <ProCard bodyStyle={{padding: '20px 0px'}}>
            <SignaturePad penColor='black' ref={sigCanvas} canvasProps={{className: 'signCanvas'}} />
            <div className="signBackground"><div class="signHereText">직접서명 또는 서명선택</div></div>
          </ProCard>
          <CheckCard.Group style={{width: '100%', margin: '0px', padding: '0px', whiteSpace: 'nowrap', overflow: 'auto', textAlign: 'center'}}
            onChange={(value) => {
              sigCanvas.current.clear();
              if (value) sigCanvas.current.fromDataURL(value);
            }}
          >
            {signList.map((sign) => (signCard(sign)))}
          </CheckCard.Group>
        </Modal>

        <UserSelectorModal showModal={userModal} setShowModal={setUserModal} selectUsers={selectUsers} setSelectUsers={setSelectUsers} userKey={userKey} setUserKey={setUserKey} signees={signees} />

    </PageContainer> 

    </div>
  );
};

export default SignDirect;
