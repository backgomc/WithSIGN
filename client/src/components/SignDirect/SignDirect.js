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
import { LICENSE_KEY, USE_WITHPDF } from '../../config/Config';
import { selectDirect, setDirectTempPath } from './DirectSlice';
import { setDocumentTempPath, selectTemplateTitle, setTemplateTitle, setAttachFiles, selectAttachFiles, selectIsWithPDF } from '../Assign/AssignSlice';
import moment from 'moment';
import 'moment/locale/ko';
import ProForm, { ProFormUploadButton } from '@ant-design/pro-form';
// import Item from 'antd/lib/list/Item';
import UserSelectorModal from '../Common/UserSelectorModal';
import { deepCopyObject } from '../../util/common';
import styled from 'styled-components';

import PDFViewer from "@niceharu/withpdf";
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_BOX, TYPE_CHECKBOX, COLORS, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';
import { getToday } from '../../util/common';

const { confirm } = Modal;
const { TextArea } = Input;
const { SHOW_PARENT } = TreeSelect;
const { Step } = Steps;

const StepStyle = styled.div`
  width:50%;   
  .ant-steps-item-title {
    // font-size: 16px;
    font-weight: bold;
    // color: #666666;
  }
  .circle {
    background-color:#e4e8eb;
    width:17px;
    height:17px;
    border-radius:75px;
    text-align:center;
    margin:0 auto;
    font-size:12px;
    vertical-align:middle;
    line-height:17px;
    display:inline-block;
    }
`;

const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 0px !important; 
  margin-left: 0px !important; 
  margin-right: 0px !important;
}
`;


const SignDirect = () => {

  const { formatMessage } = useIntl();

  const [webViewInstance, setWebViewInstance] = useState(null);
  const [annotationManager, setAnnotationManager] = useState(null);
  const [annotPosition, setAnnotPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  // const [spinning, setSpinning] = useState(false);
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
  const isWithPDF = useSelector(selectIsWithPDF);

  const [lastUsers, setLastUsers] = useState([]);
  const [current, setCurrent] = useState(0);


  const { directRef, docRef, items, xfdfIn, requesters, observers, signees } = direct;
  const { _id, name, JOB_TITLE, DEPART_CODE, OFFICE_CODE, SABUN, OFFICE_NAME, DEPART_NAME } = user;

  const [annotsToDelete, setAnnotsToDelete] = useState([]);
  
  const viewer = useRef(null);
  const pdfRef = useRef();
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
  

  const initWithPDF = async () => {

    let _lastUsers = [...signees, ...requesters].filter(el => el.key !== 'requester1');
    _lastUsers.sort((a, b) => a.order - b.order)
    setLastUsers(_lastUsers);
    console.log('_lastUsers', _lastUsers)

    await pdfRef.current.uploadPDF(docRef);

    let pageCnt = await pdfRef.current.getPageCount();
    setPageCount(pageCnt);

    // console.log('assignees', assignees)
    // // 일반 전송인 경우 requester 는 제외

    // let newItems = loadash.cloneDeep(items);
    // template.items.forEach(item => {

    //   if (sendType === 'B') {
    //     if(template.requesters?.some(user => user.key === item.uid)) {
    //       let newItem = loadash.cloneDeep(item);
    //       newItem.uid = 'bulk'; //requester1 -> bulk
    //       newItems.push(newItem);
    //     }
    //   } else {
    //     if(assignees.some(user => user.key === item.uid)) {
    //       newItems.push(item);
    //     }
    //   }

    // })

    const newItems = pdfRef.current.convertBoxToComponent(items);

    let renewItems = newItems.map(item => {
      if (item.uid === 'requester1') {
        if (item.autoInput) {
          if (item.autoInput === AUTO_NAME) {
            item.lines = [name];
          } else if (item.autoInput === AUTO_JOBTITLE) {
            item.lines = [JOB_TITLE];
          } else if (item.autoInput === AUTO_OFFICE) {
            item.lines = [OFFICE_NAME];
          } else if (item.autoInput === AUTO_DEPART) {
            item.lines = [DEPART_NAME];
          } else if (item.autoInput === AUTO_SABUN) {
            item.lines = [SABUN];
          } else if (item.autoInput === AUTO_DATE) {
            item.lines = [moment().format('YYYY년 MM월 DD일')];
          }
        }

        if (item.type === TYPE_SIGN) {
          item.movable = false;
          item.resizable = false;
        } else {
          item.movable = false;
          item.resizable = false;
        }

      } else {
        // item.required = false;
        item.disable = true;

        if (item.uid === 'requester2') {
          item.tag = '참여자1';
        } else if (item.uid === 'requester3') {
          item.tag = '참여자2';
        } else if (item.uid === 'requester4') {
          item.tag = '참여자3';
        } else if (item.uid === 'requester5') {
          item.tag = '참여자4';
        } else if (item.uid === 'requester6') {
          item.tag = '참여자5';
        } else {
          const _member = _lastUsers.filter(el => el.key === item.uid)[0];
          item.tag = _member?.name + ' ' + _member?.JOB_TITLE;
        }


        // item.movable = false;
        // item.deletable = false;
        // item.resizable =false;
        // item.borderColor = 'blue';
        
        // if ((item.type === (TYPE_SIGN || TYPE_IMAGE)) && !item.payload) {
        //   item.hidden = true;
        // }
        // if (item.type === TYPE_TEXT && item.lines.length < 1) {
        //   item.hidden = true;
        // }
        // if (item.type === TYPE_CHECKBOX && !item.checked) {
        //   item.hidden = true;
        // }
      }
      return item;
    })

    await pdfRef.current.importItems(renewItems);
   

    await fetchSigns();
  }

  useEffect(() => {

    if(isWithPDF) {
      initWithPDF();
    } else {

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
  
                if (!annot.fieldName.startsWith('requester1')) {
                  annot.Hidden = true;
                  annot.Listable = false;
                  annot.ReadOnly = true;
                  annot.NoMove = true;

                }
  
              } else {
                console.log('일반 편집한 텍스트 컴포넌트')
              }
            });
          }
        });
  
      });
    }

  }, [directRef, _id]);

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axios.post('/api/sign/signs', param);
    if (res.data.success) {
      const signs = res.data.signs;
      setSignList(signs);

      if (isWithPDF) {
        pdfRef.current.setSigns(signs);
      }
    }
  }

  const signCard = (sign) => {
    return <CheckCard key={uuidv4()} style={{width:'auto', height: 'auto'}} value={sign.signData} avatar={sign.signData} className="customSignCardCSS"/>
  }
  
  const send = async () => {

    // 유효성 체크 : 참여자
    if ((requesters.length - 1) !== selectUsers.length) {
      message.warning('참여자를 지정해주세요!');
      return;
    }

    let _observers = [];
    let _lastUsers = [];

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
    // console.log('selectUsers', selectUsers);
    // console.log('observers', observers);
    observers.forEach(el => {
      if (selectUsers.filter(el2 => el === el2.key).length > 0) {
        _observers.push(selectUsers.filter(el2 => el === el2.key)[0].value.split('|')[0])
      } else {
        _observers.push(el)
      }
    }) 

    console.log('_observers', _observers);
    console.log('_lastUsers', _lastUsers);

    let exportItems = await pdfRef.current.exportItems();
    exportItems.forEach(item => {

      item.disable = false;
      item.tag = '';

      if (item.uid.startsWith('requester')) { // uid 변경 

        if (item.uid === 'requester1') {
          item.uid = _id;
        } else {
          if(selectUsers.filter(el => item.uid === el.key)?.length > 0) {
            item.uid = selectUsers.filter(el => item.uid === el.key)[0].value.split('|')[0];
          }
        }
      }   
    })
    console.log('exportItems', exportItems);


    // PROCESS
    // 1. SAVE PDF FILE
    // 2. SAVE THUMBNAIL
    // 3. SAVE ATTACH FILE
    // 4. SAVE DOCUMENT (NEW)

    // 1. SAVE PDF FILE
    const filename = `${_id}${Date.now()}.pdf`;
    const path = `documents/${getToday()}/`;
    const file = await pdfRef.current.savePDF(false, false);
    const formData = new FormData()
    formData.append('path', path)
    formData.append('file', file, filename)
    const res = await axios.post(`/api/storage/upload`, formData)

    // 업로드 후 파일 경로 가져오기  
    var docRef = ''
    if (res.data.success){
      docRef = res.data.file.path 
    }
    console.log('docRef', docRef);

    // 2. SAVE THUMBNAIL
    let _thumbnail = await pdfRef.current.getThumbnail(0, 0.6);
    const resThumbnail = await axios.post('/api/document/addThumbnail', {user: _id, thumbnail: _thumbnail})
    var thumbnailUrl = '';
    if (resThumbnail.data.success) {
      thumbnailUrl = resThumbnail.data.thumbnail 
    }
    console.log('thumbnailUrl', thumbnailUrl)

    // 3. SAVE ATTACH FILE
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
      docRef: docRef,
      users: users,
      items: exportItems,
      signedBy: [],
      signed: false,
      signedTime: '',
      thumbnail: thumbnailUrl,
      pageCount: pageCount,
      observers: _observers,
      orderType: orderType, //SUNCHA: 순차 기능 활성화 
      usersOrder: usersOrder,
      usersTodo: usersTodo,
      attachFiles: files,
      isWithPDF: true
    }

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

    setLoading(false);
    navigate('/prepareResult', { state: {status:status, title:resultMsg, docId:docId}}); 
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

    setLoading(true)
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
    setLoading(false)
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
              selectUsers.filter(e => e.key === el.key)[0]?.value.split('|')[2] : (el.key === 'requester2' && '참여자1' || el.key === 'requester3' && '참여자2' || el.key === 'requester4' && '참여자3' || el.key === 'requester5' && '참여자4'|| el.key === 'requester6' && '참여자5') }
            </Button>} description={observers.filter(observer => observer === el.key).length > 0 ?  <><div className='circle'>{parseInt(el.order)+1}</div> 수신</> : <> <div className='circle'>{parseInt(el.order)+1}</div> 서명</>} disabled />
            )
          } else {
            return <Step title={el.name + ' ' + el.JOB_TITLE} description={observers.filter(observer => observer === el.key).length > 0 ?   <><div className='circle'>{parseInt(el.order)+1}</div> 수신</> : <><div className='circle'>{parseInt(el.order)+1}</div> 서명</>} disabled />
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

  const handleItemChanged = (action, item, validation) => {
    console.log(action, item);
    
    // if (action === 'update') {
    //   console.log('validationCheck', validation);
    //   setDisableNext(!validation);
    // }
  }

  const handleValidationChanged = (validation) => {
    setDisableNext(!validation);
  }

  // 참여자 선택 시 컴포넌트 tag 값 업데이트 처리
  const selectUserSelected = (userKey, treeValue) => {
    console.log('selectUserSelected called', userKey, treeValue);
    
    if (items.filter(item => item.uid === userKey).length > 0 && treeValue?.split('|')[2]) {
      pdfRef.current.updateItem(items.filter(item => item.uid === userKey)[0].id, {tag: treeValue?.split('|')[2]});
    }
  }

  return (
    <div>
    <PageContainerStyle>
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
          <Button key="2" type="primary" loading={loading} onClick={() => isWithPDF ? send() : completeSigning()} disabled={disableNext}>
            {formatMessage({id: 'submit'})}
          </Button>,
        ],
      }}
      style={{height:`calc(100vh)`}}
      content={content}
      // footer={[
      // ]}
      // loading={loading}
    >

        {/* <Row gutter={[24, 24]}>
          <Col span={24}> */}

          <Spin tip="로딩중..." spinning={loading}>
            {isWithPDF ? <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} onItemChanged={handleItemChanged} onValidationChanged={handleValidationChanged} defaultScale={1.0} />  : <div className="webviewer" ref={viewer}></div>}
          </Spin>

          {/* </Col>
        </Row> */}


        <Modal
          visible={signModal}
          width={450}
          title="직접서명 또는 서명선택"
          onOk={handleOk}
          onCancel={handleCancel}
          footer={[
            // <Checkbox key={uuidv4()} checked={allCheck} onChange={e => {setAllCheck(e.target.checked);}} style={{float:'left'}}>전체 서명</Checkbox>,
            <Button key="back" onClick={clear}>지우기</Button>,
            <Button key="submit" type="primary" loading={loading} onClick={handleOk}>확인</Button>
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

        <UserSelectorModal showModal={userModal} setShowModal={setUserModal} selectUsers={selectUsers} setSelectUsers={setSelectUsers} userKey={userKey} setUserKey={setUserKey} signees={signees} selectUserSelected={selectUserSelected} />

    </PageContainer> 
    </PageContainerStyle>

    </div>
  );
};

export default SignDirect;
