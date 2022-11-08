import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import SignaturePad from 'react-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { navigate } from '@reach/router';
// import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { Input, Row, Col, Modal, Checkbox, Button, List, Spin } from 'antd';
import { selectDocToSign } from './SignDocumentSlice';
import { selectUser } from '../../app/infoSlice';
import { mergeAnnotations } from '../MergeAnnotations/MergeAnnotations';
import WebViewer from '@pdftron/webviewer';
// import 'gestalt/dist/gestalt.css';
import './SignDocument.css';
import { useIntl } from "react-intl";
// import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard, { CheckCard } from '@ant-design/pro-card';
import {
  PaperClipOutlined
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { LICENSE_KEY, USE_WITHPDF } from '../../config/Config';
import moment from 'moment';
import 'moment/locale/ko';
import PDFViewer from "@niceharu/withpdf";
import loadash from 'lodash';
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_CHECKBOX, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';
import styled from 'styled-components';
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 0px !important; 
  margin-left: 0px !important; 
  margin-right: 0px !important;
}
`;

const { confirm } = Modal;
const { TextArea } = Input;

const SignDocument = () => {

  const { formatMessage } = useIntl();

  const [instance, setInstance] = useState(null);
  const [webViewInstance, setWebViewInstance] = useState(null);
  const [annotationManager, setAnnotationManager] = useState(null);
  const [annotPosition, setAnnotPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [disableNext, setDisableNext] = useState(true);
  const [disableCancel, setDisableCancel] = useState(true);
  const [visiblModal, setVisiblModal] = useState(false);
  const [signList, setSignList] = useState([]);
  const [signData, setSignData] = useState('');
  const [signModal, setSignModal] = useState(false);
  const [signCount, setSignCount] = useState(0);
  const [allCheck, setAllCheck] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [textSign, setTextSign] = useState(formatMessage({id: 'sign.complete'}))

  // const dispatch = useDispatch();
  // const uploading = useSelector(selectUploading);
  const doc = useSelector(selectDocToSign);
  const user = useSelector(selectUser);
  const { docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder, attachFiles, items, isWithPDF, docTitle } = doc;
  const { _id, name, JOB_TITLE, SABUN, OFFICE_NAME, DEPART_NAME } = user;

  const [annotsToDelete, setAnnotsToDelete] = useState([]);
  
  const viewer = useRef(null);
  const cancelMessage = useRef({});
  const pdfRef = useRef();

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
    const { Core, UI } = webViewInstance;
    UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
    setSignModal(false);
    clear();
  };

  const initWithPDF = async () => {

    // loading PDF
    await pdfRef.current.uploadPDF(docRef);

    // loading items
    console.log('items', items);
    let newItems = loadash.cloneDeep(items);  //items 를 변경하므로 const 속성이 걸린 items 를 copy 해준다.

    let renewItems = newItems.map(item => {
      if (item.uid === _id || item.uid === 'bulk') {
        if (item.type === TYPE_SIGN) { // 서명 컴포넌트만 조정 가능하도록 설정
          item.movable = true;    // 본인 컴포넌트 이동 가능하게 설정
          item.resizable = true;  // 본인 컴포넌트 사이즈 변경 가능하게 설정
        } else {
          item.movable = false;
          item.resizable = false;
          item.disableOptions = true;
        }

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
      } else {
        // item.required = false;
        item.disable = true;
        // item.movable = false;
        // item.deletable = false;
        // item.resizable =false;
        item.borderColor = 'transparent';
        
        if ((item.type === (TYPE_SIGN || TYPE_IMAGE)) && !item.payload) {
          item.hidden = true;
        }
        if (item.type === TYPE_TEXT) {
          if (item.lines.length < 1 || item.lines[0].length < 1) {
            item.hidden = true;
          }
        }
        if (item.type === TYPE_CHECKBOX && !item.checked) {
          item.hidden = true;
        }
      }
      return item;
    })
    await pdfRef.current.importItems(renewItems);

  }
  
  useEffect(() => {

    console.log('observers:'+observers)
    if(observers && observers.includes(_id)) {
      setDisableNext(false)
      setTextSign('문서 수신')
    }

    fetchSigns();

    if (isWithPDF) {
      initWithPDF();

    } else {
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
        });
  
        // set language
        UI.setLanguage('ko');
  
        // select only the insert group
        // instance.disableElements(['header']);
        UI.setToolbarGroup('toolbarGroup-View');
        Core.setCustomFontURL("/webfonts/");
  
        // load document
        // const storageRef = storage.ref();
        // const URL = await storageRef.child(docRef).getDownloadURL();
        
        // DISTO
        const URL = '/' + docRef;
        UI.loadDocument(URL);
  
        setInstance(instance);
  
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
  
              if (field.name?.startsWith(_id) || field.name?.startsWith('bulk')) { 
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
              }
              
            });
          });
  
        });
  
        const normalStyles = (widget) => {
          if (widget instanceof Annotations.TextWidgetAnnotation) {
  
            if (widget.fieldName.startsWith(_id) || widget.fieldName.startsWith('bulk')) { 
              return {
                // border: '1px solid #a5c7ff',
                // 'background-color': '#a5c7ff',
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
            return {
              border: '1px solid #a5c7ff',
            };
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
              if (annot instanceof Annotations.SignatureWidgetAnnotation && annot.fieldName.startsWith(_id)) widgetCount++;
              if (annot.ToolName === 'AnnotationCreateRubberStamp' && annot.IsAdded ) createCount++;
  
            });
            if (widgetCount === 0 || widgetCount > 0 && widgetCount === createCount) {
              setDisableNext(false);
            }
          }
  
          if (!imported && action === 'delete') {  // 서명 및 입력값이 삭제 된 경우
            annotations.forEach(function(annot) {
              if (annot.ToolName === 'AnnotationCreateRubberStamp') setDisableNext(true);
            });
          }
  
          if (imported && (action === 'add' || action === 'modify')) {
            annotations.forEach(function(annot) {
              // 서명 참여자는 모든 Annotation 이동, 삭제 불가
              annot.NoMove = true;
              annot.NoDelete = true;
              annot.ReadOnly = true;
              if (annot instanceof Annotations.WidgetAnnotation) {
                Annotations.WidgetAnnotation.getCustomStyles = normalStyles;
  
                //TODO
                // 1. [완료]다른 사람의 텍스트가 안보이는 것 수정 
                // 2. [완료]다른 사람의 텍스트는 스타일 변경 
                // 3. [진행중]다른 사람의 텍스트 및 사인은 수정 안되게 하기  
  
                console.log("annot.fieldName:"+annot.fieldName)
  
                if (docType === 'B') {
                  if (!annot.fieldName.startsWith('bulk')) { 
                    annot.Hidden = true;
                    annot.Listable = false;
                  }
                } else {
                  // if (!annot.fieldName.startsWith(_id)) { 
                  //   annot.Hidden = true;
                  //   annot.Listable = false;
                  // }
  
                  if (!annot.fieldName.startsWith(_id)) {
  
                    // TODO
                    // 3. [진행중]다른 사람의 텍스트 및 사인은 수정 안되게 하기 | 아래 메서드 안먹힘
                    // annot.disabled = true;
                    
                    console.log('readonly called');
  
                    if (annot.fieldName.includes('SIGN')) {  // 다른 사람이 입력한 텍스트는 보여야 됨
                      annot.Hidden = true;
                      annot.Listable = false;
                    }
                    if (annot.fieldName.includes('TEXT')) {
                      annot.fieldFlags.set('ReadOnly', true);
                    }
                    if (annot.fieldName.includes('CHECKBOX')) {
                      // annot.Hidden = true;
                      // annot.Listable = false;
                      annot.fieldFlags.set('ReadOnly', true);
                    }
                  }
                }
  
              } else {
                console.log('일반 편집한 텍스트 컴포넌트')
                // annot.Listable = false;
  
                // const annotsToDeleteNew = annotsToDelete.slice()
                // annotsToDeleteNew.push(annot) 
                // setAnnotsToDelete(annotsToDeleteNew)
                // annotsToDelete.push(annot);
  
                setAnnotsToDelete(annotsToDelete => [...annotsToDelete, annot])
              }
            });
          }
        });
  
        // annotManager.on('fieldChanged', (field, value) => {
        //   console.log("fieldChanged called")
        //   console.log(field, value)
        // })
  
  
        // 내 사인 이미지 가져와서 출력하기
        // const res = await axios.post('/api/sign/signs', {user: _id})
        // if (res.data.success) {
        //   const signs = res.data.signs;
  
        //   var signDatas = []
        //   signs.forEach(element => {
        //     signDatas.push(element.signData)
        //   });
  
        //   if (signDatas.length > 0) {
        //     const signatureTool = docViewer.getTool('AnnotationCreateSignature');
        //     docViewer.on('documentLoaded', () => {
        //       signatureTool.importSignatures(signDatas);
        //     });
        //   }
        // }
        
        // const signatureTool = docViewer.getTool('AnnotationCreateSignature');
        // console.log('ccc');
        // console.log(signatureTool);
        // const base64Image = "";
        // docViewer.on('documentLoaded', () => {
        //   signatureTool.importSignatures([base64Image]);
        // });
  
  
        // 내 사인 저장하기
      //   docViewer.on('annotationsLoaded', async () => {
      //     annotManager.on('annotationSelected', async (annotationList) => {
      //         console.log("annotationList:"+annotationList)
      //         annotationList.forEach(annotation => {
      //             if (annotation.Subject === "Signature")
      //                 extractAnnotationSignature(annotation, docViewer);
      //         })
      //     })
      //   });
  
      //   async function extractAnnotationSignature(annotation, docViewer) {
      //     // Create a new Canvas to draw the Annotation on
      //     const canvas = document.createElement('canvas');
      //     // Reference the annotation from the Document
      //     const pageMatrix = docViewer.getDocument().getPageMatrix(annotation.PageNumber);
      //     // Set the height & width of the canvas to match the annotation
      //     canvas.height = annotation.Height;
      //     canvas.width = annotation.Width;
      //     const ctx = canvas.getContext('2d');
      //     // Translate the Annotation to the top Top Left Corner of the Canvas ie (0, 0)
      //     ctx.translate(-annotation.X, -annotation.Y);
      //     // Draw the Annotation onto the Canvas
      //     annotation.draw(ctx, pageMatrix);
      //     // Convert the Canvas to a Blob Object for Upload
      //     canvas.toBlob((blob) => {
      //         // Call your Blob Storage Upload Function
      //         console.log("blob:"+blob)
      //     });
      // }  
      });
    }
  }, [docRef, _id]);

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axios.post('/api/sign/signs', param);
    if (res.data.success) {
      const signs = res.data.signs;
      console.log('signs', signs)
      setSignList(signs);
      if (isWithPDF) {
        pdfRef.current.setSigns(signs);
      }
    }
  }

  const signCard = (sign) => {
    return <CheckCard key={uuidv4()} style={{width:'auto', height: 'auto'}} value={sign.signData} avatar={sign.signData} className="customSignCardCSS"/>
  }
  
  const nextField = () => {
    let annots = annotationManager.getAnnotationsList();
    if (annots[annotPosition]) {
      annotationManager.jumpToAnnotation(annots[annotPosition]);
      if (annots[annotPosition+1]) {
        setAnnotPosition(annotPosition+1);
      }
    }
  }

  const prevField = () => {
    let annots = annotationManager.getAnnotationsList();
    if (annots[annotPosition]) {
      annotationManager.jumpToAnnotation(annots[annotPosition]);
      if (annots[annotPosition-1]) {
        setAnnotPosition(annotPosition-1);
      }
    }
  }

  const cancelSigning = () => {

    setVisiblModal(true);

    // confirm({
    //   title: '서명 취소하시겠습니까?',
    //   icon: <ExclamationCircleOutlined />,
    //   content: '서명 취소는 되돌릴 수 없습니다.',
    //   okText: '네',
    //   okType: 'danger',
    //   cancelText: '아니오',
    //   onOk() {
    //     fetchCancelSigning(message);
    //   },
    //   onCancel() {
    //     console.log('Cancel');
    //   },
    // });  
  }

  const fetchCancelSigning = async () => {
    setLoading(true);
    
    let param = {
      docId: docId,
      user: _id,
      message: cancelMessage.current.resizableTextArea.props.value  
    }

    const res = await axios.post('/api/document/updateDocumentCancel', param)

    console.log("fetchCancelSigning res:" + res);
    setLoading(false);
    navigate('/documentList');
  }

  const modalCancel = () => {
    setVisiblModal(false);
  };


  const send = async () => {
    const pageCount = await pdfRef.current.getPageCount();
    const exportItems = await pdfRef.current.exportItems();

    console.log('pageCount', pageCount);
    console.log('exportItems', exportItems);

    // uid 가 본인이거나 uid 필드가 없는 컴포넌트를 서버에 update 해준다.
    let updateItems = [];
    exportItems.forEach(item => {
      if (item.uid === _id || item.uid === 'bulk') { // 본인 컴포넌트 추가
        updateItems.push(item);
      } else {  // 상단 탭을 통해 신규로 등록한 컴포넌트 추가
        if (items.filter(el => el.id === item.id).length < 1) {
          updateItems.push(item);
        }
      }      
    })

    console.log('updateItems', updateItems);

    // 순차 서명인 경우: 다음 서명 대상자 설정    
    var todo = [];
    if(orderType == 'S'){ //순차 서명인 경우 
      if(usersTodo?.length > 0) {
        if (usersTodo?.filter(e => e != _id).length > 0) {   // 본인 제외 같은 레벨에 서명할 사람이 있는 경우 본인만 제외
          todo = usersTodo?.filter(e => e != _id)
        } else { // 다음 레벨의 서명할 사람들을 입력 
          var arr = usersOrder?.filter(e => e.user == usersTodo[0])
          if (arr?.length > 0) {
            todo = usersOrder?.filter(e => e.order == arr[0].order + 1).map(e => e.user)
          }
        }
      }
    }

    setLoading(true);

    let param = {
      docId: docId,
      // email: email,
      user: _id,
      items: updateItems,
      usersTodo: todo
    }
    console.log("sign param:"+param)

    if (docType === 'B') {
      // 벌크방식이면 docRef에 있던 원본파일을 신규 경로로 복사
      // ex) docToSign/bulkId/60dbfeec57e078050836b4741625204681539.pdf
      const res = await axios.post('/api/storage/copyBulk', param)
    } 

    // 파일업로드 된 후에 화면 이동되도록 변경
    try {
      const res = await axios.post('/api/document/update', param)
      if (res.data.success) {


        // console.log("start merge")
        // await mergeAnnotations(docId, res.data.docRef, res.data.xfdfArray, res.data.isLast)
        // console.log("end merge")

        if(res.data.isLast) {
          console.log('isLast', res.data.isLast)

          // 1. update paperless (서명 요청자 paperless 수 증가)
          await axios.post('/api/users/updatePaperless', {user: docUser._id, paperless: pageCount})

          // 2. merge items & upload merged file
          const lastItems = res.data.items;
          console.log('lastItems', lastItems);
          const mergedFile = await pdfRef.current.savePDF(true, false, lastItems);
          const formData = new FormData()

          console.log("docRef", docRef)
          console.log("res.data.docRef", res.data.docRef)
          
          const lastDocRef = res.data.docRef;
          var reg = new RegExp('(.*\/).*')
          console.log('path:'+reg.exec(lastDocRef)) //docToSign/614bca38d55fa404d35dad1d/
          formData.append('path', reg.exec(lastDocRef)[1]) //docRef 에서 경로만 추출
          formData.append('isLast', res.data.isLast)
          formData.append('docId', docId)
          formData.append('file', mergedFile, lastDocRef)
          
          const res1 = await axios.post(`/api/storage/upload`, formData)
          console.log('res merged file', res1)

          // 3. updateHash
          let param = {
            docId: docId
          }
          const res2 = await axios.post(`/api/storage/updateHash`, param)
          console.log(res2)
        }

        setLoading(false);
      } else {
        console.log("update error")
        setLoading(false);
      } 
    } catch (error) {
      console.log(error)
      setLoading(false);
    }

    navigate('/');

  }

  const completeSigning = async () => {

    // setLoading(true);

    console.log('pageCount:'+pageCount)

    //TODO: 서명요청자가 요청 시 작성한 freetext는 xfdf 추출 시 제외하여야 함 
    // TYPE: Widget, 자유 텍스트, 서명 
    // TYPE 이 아니라 다른 키값을 부여해서 제외시켜야 될듯
    // const annotationsList = annotManager.getAnnotationsList();
    // const annotsToDelete = [];
    // await Promise.all(
    //   annotationsList.map(async (annot, index) => {
    //     console.log('annot.Subject:'+annot.Subject)
    //     if (annot.Subject == '자유 텍스트') {
    //       console.log('여기 제발 통과하자')
    //       // annotsToDelete.push(annot);
    //       annotManager.deleteAnnotation(annot, false, true);
    //     }
    //   })
    // )
    const { Core } = instance;
    const { Annotations } = Core;
    const annotList = annotationManager.getAnnotationsList();
    annotationManager.deselectAllAnnotations();
    annotList.forEach(function(annot) { // freetext 제외 처리 위한 설정
      annot.NoMove = false;
      annot.NoDelete = false;
      annot.ReadOnly = false;
      // Text Widget >>> Free Text
      if (annot.fieldName && annot.fieldName.startsWith(_id) && annot.fieldName.includes('TEXT')) {
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
    console.log('>>> annotsToDelete <<<');
    console.log(annotsToDelete);
    await annotationManager.deleteAnnotations(annotsToDelete, null, true); //다건 처리가 오류나서 일단 단건 처리함

    // field: true 를 해줘야 텍스트 값도 저장됨
    // console.log('annotManager.getAnnotationsList():'+annotManager.getAnnotationsList());
    const xfdf = await annotationManager.exportAnnotations({ widgets: false, links: false, fields: false,	annotList: annotationManager.getAnnotationsList() });
    // await updateDocumentToSign(docId, email, xfdf);

    setLoading(true);

    // 순차 서명인 경우: 다음 서명 대상자 설정    
    // 설장 참조값: orderType, usersTodo, usersOrder
    var todo = [];
    if(orderType == 'S'){ //순차 서명인 경우 
      if(usersTodo?.length > 0) {
        if (usersTodo?.filter(e => e != _id).length > 0) {   // 본인 제외 같은 레벨에 서명할 사람이 있는 경우 본인만 제외
          todo = usersTodo?.filter(e => e != _id)
        } else { // 다음 레벨의 서명할 사람들을 입력 
          var arr = usersOrder?.filter(e => e.user == usersTodo[0])
          if (arr?.length > 0) {
            todo = usersOrder?.filter(e => e.order == arr[0].order + 1).map(e => e.user)
          }
        }
      }
    }

    let param = {
      docId: docId,
      // email: email,
      user: _id,
      xfdf: xfdf,
      usersTodo: todo
    }
    console.log("completeSigning param:"+param)

    if (docType === 'B') {
      // 벌크방식이면 docRef에 있던 원본파일을 신규 경로로 복사
      // ex) docToSign/bulkId/60dbfeec57e078050836b4741625204681539.pdf
      const res = await axios.post('/api/storage/copyBulk', param)
    } 

    // 파일업로드 된 후에 화면 이동되도록 변경
    try {
      const res = await axios.post('/api/document/updateDocumentToSign', param)
      if (res.data.success) {
        console.log("start merge")
        await mergeAnnotations(docId, res.data.docRef, res.data.xfdfArray, res.data.isLast)
        console.log("end merge")

        // 서명 요청자 paperless 수 증가 시킴
        if(res.data.isLast) {
          await axios.post('/api/users/updatePaperless', {user: docUser._id, paperless: pageCount})
        }

        setLoading(false);
      } else {
        console.log("updateDocumentToSign error")
        setLoading(false);
      } 
    } catch (error) {
      console.log(error)
      setLoading(false);
    }

    navigate('/');
  }

  const listAttachFiles = (
    <List
    size="small"
    split={false}
    dataSource={attachFiles}
    // header={`첨부파일 ${item.attachFiles.length}`}
    // bordered
    itemLayout="horizontal"
    renderItem={item =>
        <List.Item.Meta
            avatar={<PaperClipOutlined />}
            description={ <a href={item.path} download={item.originalname} style={{color:'gray'}}>{item.originalname}</a> }
        />
    }
    />
  )

  const handleItemChanged = (action, item, validation) => {
    console.log(action, item);
    
    // if (action === 'update') {
    //   console.log('validationCheck', validation);
    //   setDisableNext(!validation);
    // }
  }

  const handleValidationChanged = (validation) => {
    console.log('handleValidationChanged called', validation);
    setDisableNext(!validation);
  }

  return (
    <div>
    <PageContainerStyle>
    <PageContainer  
      // fixedHeader
      header={{
        title: docTitle ? docTitle : '서명 하기',
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="3" onClick={() => {navigate(`/documentList`);}}>{formatMessage({id: 'document.list'})}</Button>,
          <Button key="1" danger onClick={() => cancelSigning()}>
            {formatMessage({id: 'sign.cancel'})}
          </Button>,
          <Button key="2" type="primary" loading={loading} onClick={() => isWithPDF ? send() : completeSigning()} disabled={disableNext}>
            {textSign}
          </Button>,
        ],
      }}
      style={{height:`calc(100vh - 72px)`}}
      content= {attachFiles?.length > 0 && listAttachFiles}
      // footer={[
      // ]}
      // loading={loading}
    >
      {/* <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 596);
        }}
      > */}
        {/* <Row gutter={[24, 24]}>
          <Col span={24}> */}
          <Spin tip="로딩중..." spinning={loading}>
          {isWithPDF ? <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} onItemChanged={handleItemChanged} onValidationChanged={handleValidationChanged}  defaultScale={1.0} headerSpace={attachFiles?.length > 0 ? 128 + attachFiles?.length * 30 : 128}  />  : <div className="webviewer" ref={viewer}></div>}
          </Spin>
          {/* </Col>
        </Row> */}

        <Modal
          visible={visiblModal}
          width={400}
          title="서명 취소하시겠습니까?"
          content="서명 취소는 되돌릴 수 없습니다."
          onOk={fetchCancelSigning}
          onCancel={modalCancel}
          footer={[
            <Button key="back" onClick={modalCancel}>
              닫기
            </Button>,
            <Button key="submit" type="primary" disabled={disableCancel} loading={loading} onClick={fetchCancelSigning} danger>
              서명 취소하기
            </Button>
          ]}
          >
            취소사유 :
            <TextArea rows={4} ref={cancelMessage} onChange={(t)=> { setDisableCancel(!(t.currentTarget.value.length > 0)) }} />
        </Modal>

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
            <div className="signBackground"><div className="signHereText">직접서명 또는 서명선택</div></div>
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

      {/* </RcResizeObserver> */}
    </PageContainer> 
    </PageContainerStyle>


      {/* <Spin tip={formatMessage({id: 'Processing'})} spinning={loading}>
        <Box display="flex" direction="row" flex="grow">
          <Column span={2}>
            <Box padding={3}>
              <Heading size="md">Sign Document</Heading>
            </Box>
            <Box padding={3}>
              <Row gap={1}>
                <Stack>
                  <Box padding={2}>
                    <Button
                      onClick={nextField}
                      accessibilityLabel="next field"
                      text="Next field"
                      iconEnd="arrow-forward"
                    />
                  </Box>
                  <Box padding={2}>
                    <Button
                      onClick={prevField}
                      accessibilityLabel="Previous field"
                      text="Previous field"
                      iconEnd="arrow-back"
                    />
                  </Box>
                  <Box padding={2}>
                    <Button
                      onClick={completeSigning}
                      accessibilityLabel="complete signing"
                      text="Complete signing"
                      iconEnd="compose"
                    />
                  </Box>
                </Stack>
              </Row>
            </Box>
          </Column>
          <Column span={10}>
            <div className="webviewer" ref={viewer}></div>
          </Column>
        </Box>
      </Spin> */}
    </div>
  );
};

export default SignDocument;
