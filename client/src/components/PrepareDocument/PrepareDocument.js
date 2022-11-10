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
import { Upload, message, Badge, Button, Row, Col, List, Card, Checkbox, Tooltip, Tag, Divider, Spin, Typography } from 'antd';
import Icon, { InboxOutlined, HighlightOutlined, PlusOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { selectDocumentTempPath, 
         resetAssignAll,
         selectAssignees, 
         selectObservers, 
         resetSignee, 
         selectDocumentFile, 
         selectDocumentTitle, 
         setDocumentTitle,
         resetDocumentFile, 
         resetDocumentTitle, 
         selectTemplate, 
         resetTemplate, 
         selectDocumentType, 
         resetDocumentType, 
         selectTemplateTitle, 
         setTemplateTitle,
         selectSendType, 
         selectOrderType,
         selectAttachFiles,
         resetAttachFiles } from '../Assign/AssignSlice';

import { selectDirectTempPath, selectDirectTitle } from '../SignDirect/DirectSlice';
import { selectUser } from '../../app/infoSlice';
import WebViewer from '@pdftron/webviewer';
// import 'gestalt/dist/gestalt.css';
import './PrepareDocument.css';
import StepWrite from '../Step/StepWrite'
import { useIntl } from 'react-intl';
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import logo from '../../assets/images/logo.svg';
import { LICENSE_KEY, USE_WITHPDF } from '../../config/Config';
import { ReactComponent as IconSign} from '../../assets/images/sign.svg';
import { ReactComponent as IconText} from '../../assets/images/text.svg';
import { ReactComponent as IconCheckbox} from '../../assets/images/checkbox.svg';

import loadash from 'lodash';
import PDFViewer from "@niceharu/withpdf";
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_BOX, TYPE_CHECKBOX, COLORS, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';
import styled from 'styled-components';
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 5px !important; 
  margin-left: 5px !important; 
  // margin-right: 0px !important;
}
`;

const { Dragger } = Upload;

const { detect } = require('detect-browser');
const browser = detect();

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

  const attachFiles = useSelector(selectAttachFiles);
  const documentFile = useSelector(selectDocumentFile);
  const documentTitle = useSelector(selectDocumentTitle);
  const documentType = useSelector(selectDocumentType);
  const template = useSelector(selectTemplate);
  const templateTitle = useSelector(selectTemplateTitle);
  const sendType = useSelector(selectSendType);

  const [docTitle, setDocTitle] = useState((documentType === "PC") ? documentTitle : templateTitle);

  // const directTitle = useSelector(selectDirectTitle);
  // const directTempPath = useSelector(selectDirectTempPath);

  // const orderType = useSelector(selectOrderType);
  const documentTempPath = useSelector(selectDocumentTempPath);
  const preObserver = useSelector(selectObservers);
  const assignees = useSelector(selectAssignees);
  const assigneesValues = assignees.map(user => {
    return { value: user.key, label: user.name };
  });
  const box = assignees.map(user => {
    return { key:user.key, sign:0, text:0, checkbox:0, auto_name:0, auto_jobtitle:0, auto_office:0, auto_depart:0, auto_sabun:0, auto_date:0, observer:(preObserver.filter(v => v === user.key).length > 0)?1:0};
  });
  const box_bulk = [{key:'bulk', sign:0, text:0, checkbox:0, auto_name:0, auto_jobtitle:0, auto_office:0, auto_depart:0, auto_sabun:0, auto_date:0}]

  const [boxData, setBoxData] = useState((sendType === 'B') ? box_bulk:box);

  // let initialAssignee =
  //   assigneesValues.length > 0 ? assigneesValues[0].value : '';
  let initialAssignee =
  assigneesValues.length > 0 ? assigneesValues[0] : '';
  const [assignee, setAssignee] = useState(initialAssignee);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { _id, email } = user;
  const myname = user.name;

  const viewer = useRef(null);
  const pdfRef = useRef();
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

        instance.UI.loadDocument(file);
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

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axios.post('/api/sign/signs', param);
    if (res.data.success) {
      const signs = res.data.signs;
      if (USE_WITHPDF) {
        pdfRef.current.setSigns(signs);
      }
    }
  }

  const initWithPDF = async () => {
    if (documentType === 'TEMPLATE' || documentType === 'TEMPLATE_CUSTOM') {
      await pdfRef.current.uploadPDF(template.docRef);

      console.log('assignees', assignees)
      // 일반 전송인 경우 requester 는 제외
      let newItems = [];  
      template.items.forEach(item => {

        if (sendType === 'B') {
          if(template.requesters?.some(user => user.key === item.uid)) {
            let newItem = loadash.cloneDeep(item);
            newItem.uid = 'bulk'; //requester1 -> bulk
            newItems.push(newItem);
          }
        } else {
          if(assignees.some(user => user.key === item.uid)) {
            newItems.push(item);
          }
        }

      })

      await pdfRef.current.importItems(newItems);

      // init boxData
      newItems.forEach(item => {
        let member = boxData.filter(e => e.key === item.uid)[0];
        if (member) {
          if (item.subType === TYPE_SIGN) {
            member.sign = member.sign + 1;
          } else if (item.subType === TYPE_TEXT) {
            
            if (item.autoInput) {
              if (item.autoInput === AUTO_NAME) {
                member.auto_name = member.auto_name + 1;
              } else if (item.autoInput === AUTO_JOBTITLE) {
                member.auto_jobtitle = member.auto_jobtitle + 1;
              } else if (item.autoInput === AUTO_OFFICE) {
                member.auto_office = member.auto_office + 1;
              } else if (item.autoInput === AUTO_DEPART) {
                member.auto_depart = member.auto_depart + 1;
              } else if (item.autoInput === AUTO_SABUN) {
                member.auto_sabun = member.auto_sabun + 1;
              } else if (item.autoInput === AUTO_DATE) {
                member.auto_date = member.auto_date + 1;
              }
            } else {
              member.text = member.text + 1;
            }
            
          } else if (item.subType === TYPE_CHECKBOX) {
            member.checkbox = member.checkbox + 1;
          }
  
          let newBoxData = boxData.slice();
          newBoxData[boxData.filter(e => e.key === user).index] = member;
          setBoxData(newBoxData);
        }
      })
      
    } else if (documentType === 'PC' || documentType === 'DIRECT') {
      await pdfRef.current.uploadPDF(documentTempPath);
    }

    let pageCnt = await pdfRef.current.getPageCount();
    setPageCount(pageCnt);

    await fetchSigns();
  }

  useEffect(() => {

    if (sendType !== 'B') {
      setObservers(preObserver.filter((value) => {
        return assignees.some(v => value == v.key);
      }));
    }

    if (USE_WITHPDF) {
      initWithPDF();

    } else {

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
      ).then(async instance => {
        // const { iframeWindow, docViewer, CoreControls, Annotations } = instance;  // v6
        const { Core, UI } = instance;
        const { documentViewer, Annotations, Tools } = Core;
        // select only the view group
        // toolbarGroup-View, toolbarGroup-Annotate, toolbarGroup-Shapes, toolbarGroup-Insert, toolbarGroup-Measure, toolbarGroup-Edit, toolbarGroup-FillAndSign
        // instance.setToolbarGroup('toolbarGroup-FillAndSign');
        // instance.setToolbarGroup('toolbarGroup-Annotate');
  
        // instance.setHeaderItems(function(header) {
        //   // get the tools overlay
        //   const toolsOverlay = header.getHeader('toolbarGroup-Annotate').get('toolsOverlay');
        //   header.getHeader('toolbarGroup-Annotate').delete('toolsOverlay');
        //   // add the line tool to the top header
        //   header.getHeader('default').push({
        //     type: 'toolGroupButton',
        //     toolGroup: 'lineTools',
        //     dataElement: 'lineToolGroupButton',
        //     title: 'annotation.line',
        //   });
        //   // add the tools overlay to the top header
        //   // header.push(toolsOverlay);
        // });
  
      
        // set the ribbons(상단 그룹) and second header
        UI.enableElements(['ribbons']);
        UI.disableElements(['toolbarGroup-View', 'toolbarGroup-Annotate', 'toolbarGroup-Shapes', 'toolbarGroup-Insert', 'toolbarGroup-Measure', 'toolbarGroup-Edit', 'toolbarGroup-Forms', 'annotationCommentButton', 'linkButton', 'contextMenuPopup']);
        UI.disableTools([Tools.ToolNames.FORM_FILL_CROSS, Tools.ToolNames.FORM_FILL_CHECKMARK, Tools.ToolNames.FORM_FILL_DOT]);
        // instance.disableTools([ 'AnnotationCreateSticky', 'AnnotationCreateFreeText' ]); // hides DOM element + disables shortcut
        // instance.enableFeatures([instance.Feature.Annotations]);
        // instance.enableFeatures([instance.Feature.Ribbons]);
        
        UI.setToolbarGroup('toolbarGroup-View');
  
        // set local font 
        Core.setCustomFontURL('/webfonts/');
  
        // set language
        UI.setLanguage('ko');
  
        // copy 방지 
        UI.disableFeatures([instance.UI.Feature.Copy]);
  
        // 포커스 
        documentViewer.setToolMode(documentViewer.getTool('Pan'));
  
    
        setInstance(instance);
  
        const iframeDoc = UI.iframeWindow.document.body;
        iframeDoc.addEventListener('dragover', dragOver);
        iframeDoc.addEventListener('drop', e => {
          drop(e, instance);
        });
  
        if (documentType === 'TEMPLATE') {
          // /storage/... (O) storage/...(X)
          UI.loadDocument('/'+template.docRef);
        } else if (documentType === 'TEMPLATE_CUSTOM') {
          // /storage/... (O) storage/...(X)
          UI.loadDocument('/'+template.customRef);
        } else if (documentType === 'PC' || documentType === 'DIRECT') {
          UI.loadDocument('/'+documentTempPath);
        }
  
        const annotationManager = documentViewer.getAnnotationManager();
  
        documentViewer.addEventListener('documentLoaded', async () => {
          console.log('documentLoaded called');
          
          // 디폴트 설정
          // docViewer.setToolMode(docViewer.getTool('AnnotationCreateFreeText'));
  
          // 페이지 저장
          setPageCount(documentViewer.getPageCount());
  
          const doc = documentViewer.getDocument();
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
  
        // const normalStyles = (widget) => {
        //   if (widget instanceof Annotations.TextWidgetAnnotation) {
        //     return {
        //       border: '1px solid #a5c7ff',
        //       'background-color': '#a5c7ff',
        //       color: 'black',
        //     };
        //   } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
        //     return {
        //       border: '1px solid #a5c7ff',
        //     };
        //   }
        // };
  
        // Annotations.WidgetAnnotation.getCustomStyles = normalStyles;
  
        annotationManager.addEventListener('annotationChanged', async (annotations, action, info) => {
  
          console.log('called annotationChanged:'+ action);
  
          // const { documentViewer, Font } = instance;
          let firstChk = false;
  
          annotations.forEach(async function(annot) {
            console.log('annot', annot.fieldName);
            console.log(annot.getCustomData('id'));
            // 템플릿 항목 설정 체크
            if ((annot.getCustomData('id') && annot.getCustomData('id').endsWith('CUSTOM'))) {
              let name = annot.getCustomData('id'); // sample: 6156a3c9c7f00c0d4ace4744_SIGN_CUSTOM, 6156a3c9c7f00c0d4ace4744_SIGN_16570691999435
              let user = name.split('_')[0];
              let type = name.split('_')[1];
              
              firstChk = true;
  
  
              let member = boxData.filter(e => e.key === user)[0];
  
              // user 가 requester 이면 현재 본인으로 매핑해준다. => 대량발송만 매핑하도록 변경, 일반발송은 신청서 방식으로 대체
              if (user === 'requester1') {
                if (sendType === 'B') {
                  member = boxData.filter(e => e.key === 'bulk')?.[0];
                  if (!type.includes("AUTO")) annot.setContents(type);
                } else {
                  // member = boxData.filter(e => e.key === _id)?.[0];
                  // if (!type.includes("AUTO")) annot.setContents(myname+(type==='SIGN'?'\n'+type:' '+type));
                }
              }
              console.log(member);
  
              if (member) {
                if ((browser && browser.name.includes('chrom') && parseInt(browser.version) < 87) && name.includes('TEXT')) {
                  // 브라우저 버전이 87보다 낮을 경우 삭제
                  annotationManager.deleteAnnotation(annot);
                } else {
                  if (name.includes('SIGN')) {
                    member.sign = member.sign + 1;
                  } else if (name.includes('TEXT')) {
                    member.text = member.text + 1;
                  } else if (name.includes('CHECKBOX')) {
                    member.checkbox = member.checkbox + 1;
                  } else if (name.includes('AUTONAME')) {
                    member.auto_name = member.auto_name + 1;
                  } else if (name.includes('AUTOJOBTITLE')) {
                    member.auto_jobtitle = member.auto_jobtitle + 1;
                  } else if (name.includes('AUTOOFFICE')) {
                    member.auto_office = member.auto_office + 1;
                  } else if (name.includes('AUTODEPART')) {
                    member.auto_depart = member.auto_depart + 1;
                  } else if (name.includes('AUTOSABUN')) {
                    member.auto_sabun = member.auto_sabun + 1;
                  } else if (name.includes('AUTODATE')) {
                    member.auto_date = member.auto_date + 1;
                  }
                  let newBoxData = boxData.slice();
                  newBoxData[boxData.filter(e => e.key === user).index] = member;
                  setBoxData(newBoxData);
  
                  if (annot.getCustomData('fontSize')) {
                    annot.FontSize = annot.getCustomData('fontSize');
                  } 
    
                  // annotation 구분값 복원
                  // annot.FontSize = '' + 18.0 / docViewer.getZoom() + 'px';
                  annot.custom = {
                    type,
                    name : `${member.key}_${type}_`
                  }
                  annot.deleteCustomData('id');
                }
              // } else if (user === 'requester') {
              //   console.log('requester field')
  
              } else {
                // boxData 와 일치하는 annotation 없을 경우 삭제
                annotationManager.deleteAnnotation(annot);
              }
            }
          });
  
          // 자유 텍스트 상단 짤리는 문제 ...
          console.log(annotations[0].Subject, annotations[0].ToolName, annotations[0].TextAlign);
         
          if (annotations[0].ToolName && annotations[0].ToolName.startsWith('AnnotationCreateFreeText') && action === 'add') {
            // annotations[0].TextAlign = 'center'
            annotations[0].setPadding(new Annotations.Rect(0, 0, 0, 2)); // left bottom right top 
            annotations[0].Font = 'monospace';
          }
          
  
          // 최초 실행 또는 applyFields 에서 호출 시는 아래가 호출되지 않도록 처리 
          if (firstChk || !annotations[0].custom) {
            return;
          } 
  
          // 해당 메서드에서는 state 값을 제대로 못불러온다 ... 
          // Ref 를 써서 해결 ...
          if (action === 'add') {
            console.log('added annotation');
  
            const name = annotations[0].custom.name; //sample: 6156a3c9c7f00c0d4ace4744_SIGN_
            const user = name.split('_')[0]
  
            const member = boxData.filter(e => e.key === user)[0]
  
            if (name.includes('SIGN')) {
              member.sign = member.sign + 1
            } else if (name.includes('TEXT')) {
              member.text = member.text + 1
            } else if (name.includes('CHECKBOX')) {
              member.checkbox = member.checkbox + 1
            } else if (name.includes('AUTONAME')) {
              member.auto_name = member.auto_name + 1
            } else if (name.includes('AUTOJOBTITLE')) {
              member.auto_jobtitle = member.auto_jobtitle + 1
            } else if (name.includes('AUTOOFFICE')) {
              member.auto_office = member.auto_office + 1
            } else if (name.includes('AUTODEPART')) {
              member.auto_depart = member.auto_depart + 1
            } else if (name.includes('AUTOSABUN')) {
              member.auto_sabun = member.auto_sabun + 1
            } else if (name.includes('AUTODATE')) {
              member.auto_date = member.auto_date + 1
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
              } else if (name.includes('CHECKBOX')) {
                member.checkbox = member.checkbox - 1
              } else if (name.includes('AUTONAME')) {
                member.auto_name = member.auto_name - 1
              } else if (name.includes('AUTOJOBTITLE')) {
                member.auto_jobtitle = member.auto_jobtitle - 1
              } else if (name.includes('AUTOOFFICE')) {
                member.auto_office = member.auto_office - 1
              } else if (name.includes('AUTODEPART')) {
                member.auto_depart = member.auto_depart - 1
              } else if (name.includes('AUTOSABUN')) {
                member.auto_sabun = member.auto_sabun - 1
              } else if (name.includes('AUTODATE')) {
                member.auto_date = member.auto_date - 1
              }
    
              const newBoxData = boxData.slice()
              newBoxData[boxData.filter(e => e.key === user).index] = member 
              
              setBoxData(newBoxData)
            });
  
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
  
        });
  
        // filePicker.current.onchange = e => {
        //   const file = e.target.files[0];
        //   console.log("Afile:"+ file)
        //   if (file) {
        //     setFileName(file.name.split('.')[0]);
        //     instance.loadDocument(file);
        //   }
        // };
  
        // 내 사인 이미지 가져와서 출력하기
        const res = await axios.post('/api/sign/signs', {user: _id})
        if (res.data.success) {
          const signs = res.data.signs;
  
          var signDatas = [];
          signs.forEach(element => {
            signDatas.push(element.signData)
          });
  
          if (signDatas.length > 0) {
            const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
            documentViewer.addEventListener('documentLoaded', () => {
              signatureTool.importSignatures(signDatas);
            });
          }
        }
      });

    }

  }, []);

  // observers.filter(v => v == box.key).count === 0
  useEffect(() => {

    // 유효성 체크 
    var check = false
    boxData.map(box => {
    //{ key:user.key, sign:0, text:0 };
    //observers.filter(v => v != item.key)

      // if(box.sign === 0 && box.text === 0 && observers.filter(v => v == box.key).count == 0) {

      // 서명 또는 수신은 필수로 들어가도록 설정
      if (sendType === 'B') {
        if(box.sign === 0) { 
          check = true
        }
      } else {
        if(box.sign === 0 && box.observer === 0) { 
          check = true
        }
      }

    });
    setDisableNext(check)

  }, [boxData]);


  const applyFields = async () => {

    console.log('applyFields called');
    // setLoading(true);

    const { Core } = instance;
    const { Annotations, documentViewer } = Core;
    const annotationManager = documentViewer.getAnnotationManager();
    const fieldManager = annotationManager.getFieldManager();
    const annotationsList = annotationManager.getAnnotationsList();
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
                // flags: [Annotations.WidgetFlags.MULTILINE, Annotations.WidgetFlags.DO_NOT_SCROLL, Annotations.WidgetFlags.DO_NOT_SPELL_CHECK]
              },
            );
            inputAnnot = new Annotations.TextWidgetAnnotation(field);

            // 폰트 설정
            const fontOptions = {
              name: annot.Font,
              size: parseInt(annot.FontSize.replace('pt', '').replace('px', ''))
            }
            const font = new Annotations.Font(fontOptions)
            inputAnnot.set({'font': font})
            inputAnnot.setCustomData('font', annot.Font);
            inputAnnot.setCustomData('fontSize', annot.FontSize);
            inputAnnot.setCustomData('textAlign', annot.TextAlign);
            inputAnnot.setCustomData('textVerticalAlign', annot.TextVerticalAlign);
            if (annot.getRichTextStyle() && annot.getRichTextStyle()[0]) {
              inputAnnot.setCustomData('fontStyle', annot.getRichTextStyle()[0]['font-style']);
              inputAnnot.setCustomData('fontWeight', annot.getRichTextStyle()[0]['font-weight']);
              inputAnnot.setCustomData('textDecoration', annot.getRichTextStyle()[0]['text-decoration']);
            }

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

          } else if (annot.custom.type === 'CHECKBOX') {
              console.log("annot.custom.name:"+annot.custom.name)
              field = new Annotations.Forms.Field(
                annot.custom.name + Date.now() + index,
                {
                  type: 'Btn',
                  value: annot.custom.value,
                },
              );
              inputAnnot = new Annotations.CheckButtonWidgetAnnotation(field);

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


          } else if (annot.custom.type === 'CHECKBOX') {
            console.log("annot.custom.name:"+annot.custom.name)
            field = new Annotations.Forms.Field(
              annot.custom.name + Date.now() + index,
              {
                type: 'Btn',
                value: annot.custom.value,
              },
            );
            inputAnnot = new Annotations.CheckButtonWidgetAnnotation(field);

          } else if (annot.custom.type === 'AUTONAME' ||
                    annot.custom.type === 'AUTOJOBTITLE' ||
                    annot.custom.type === 'AUTOOFFICE' ||
                    annot.custom.type === 'AUTODEPART' ||
                    annot.custom.type === 'AUTOSABUN' ||
                    annot.custom.type === 'AUTODATE') {
            console.log("auto annot.custom.name:"+annot.custom.name)
            field = new Annotations.Forms.Field(
              // annot.getContents() + Date.now() + index,
              annot.custom.name + Date.now() + index,
              {
                type: 'Tx',
                value: annot.custom.value,
              },
            );

            inputAnnot = new Annotations.TextWidgetAnnotation(field);

            // 폰트 설정
            const fontOptions = {
              name: annot.Font,
              size: parseInt(annot.FontSize.replace('pt', '').replace('px', ''))
            }
            const font = new Annotations.Font(fontOptions)
            inputAnnot.set({'font': font})

          } else {
            // exit early for other annotations
            annotationManager.deleteAnnotation(annot, false, true); // prevent duplicates when importing xfdf
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

          if (widget instanceof Annotations.CheckButtonWidgetAnnotation) {
            return {
              border: '1px solid #a5c7ff',
            };
          }

        };
        Annotations.WidgetAnnotation.getCustomStyles(inputAnnot);

        // draw the annotation the viewer
        annotationManager.addAnnotation(inputAnnot);
        fieldManager.addField(field);
        annotsToDraw.push(inputAnnot);
      }),
    );

    // delete old annotations
    annotationManager.deleteAnnotations(annotsToDelete, null, true);

    // refresh viewer
    await annotationManager.drawAnnotationsFromList(annotsToDraw);
    await uploadForSigning();

    // setLoading(false);
  };

  // 일반전송 : 멤버 아이디로 필드값 저장
  // 대량전송 : 멤버가 아닌 공통값(bulk)으로 저장
  const addField = (type, point = {}, member = {}, color = '', value = '', flag = {}) => {

    console.log('called addField')

    if (USE_WITHPDF) {
      addBox(type, member, color);
      return;
    }

    const { Core } = instance;
    const { documentViewer, Annotations } = Core;
    const annotationManager = documentViewer.getAnnotationManager();
    const doc = documentViewer.getDocument();
    const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx =
      page.first !== null ? page.first : documentViewer.getCurrentPage();
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = documentViewer.getZoomLevel();

    var textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = page_idx;
    const rotation = documentViewer.getCompleteRotation(page_idx) * 90;
    textAnnot.Rotation = rotation;
    if (rotation === 270 || rotation === 90) {
      textAnnot.Width = 50.0 / zoom;
      textAnnot.Height = 250.0 / zoom;
    } else {
      if (type == 'SIGN') {
        textAnnot.Width = 90.0 / zoom;
        textAnnot.Height = 60.0 / zoom;
      } else if (type == 'TEXT') {
        textAnnot.Width = 120.0 / zoom;
        textAnnot.Height = 25.0 / zoom;
      } else if (type == 'CHECKBOX') {
        textAnnot.Width = 25.0 / zoom;
        textAnnot.Height = 25.0 / zoom;
      } else if (type.includes('AUTONAME') || type.includes('AUTOJOBTITLE') || type.includes('AUTOSABUN')) {
        textAnnot.Width = 90.0 / zoom;
        textAnnot.Height = 25.0 / zoom;
      } else if (type.includes('AUTODATE') || type.includes('AUTOOFFICE') || type.includes('AUTODEPART')) {
        textAnnot.Width = 140.0 / zoom;
        textAnnot.Height = 25.0 / zoom;
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

    if (type.includes("AUTO")) {
      textAnnot.setContents(member.name);
      textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
      textAnnot.TextColor = new Annotations.Color(73, 73, 73);
      textAnnot.StrokeColor = new Annotations.Color(73, 73, 73);
      textAnnot.TextAlign = 'left'; //텍스트는 좌측정렬
    } else {
      textAnnot.setContents((sendType === 'B') ? type : member.name+(type==='SIGN'?'\n'+type:' '+type));
      textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
      textAnnot.TextColor = new Annotations.Color(0, 165, 228);
      textAnnot.StrokeColor = new Annotations.Color(0, 165, 228);
      if (type === 'SIGN') {
        textAnnot.TextAlign = 'center';
      } else {
        textAnnot.TextAlign = 'left'; //텍스트는 좌측정렬
      }
    }

    // textAnnot.FontSize = '' + 18.0 / zoom + 'px';
    textAnnot.FontSize = '' + 13.0 + 'px';
    textAnnot.StrokeThickness = 1;
    textAnnot.Author = annotationManager.getCurrentUser();

    annotationManager.deselectAllAnnotations();
    annotationManager.addAnnotation(textAnnot, true);
    annotationManager.redrawAnnotation(textAnnot);
    annotationManager.selectAnnotation(textAnnot);
  };

  const getToday = () => {
    var date = new Date();
    var year = date.getFullYear();
    var month = ('0' + (1 + date.getMonth())).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);

    return year + month + day;
  }


  // WITHPDF 전송
  const send = async () => {
    console.log('send called')

    // PageContainer의 loading -> Spinning loading 으로 전환함 
    // PageContainer의 경우 loading 시 pdfRef가 null이 됨 
    setLoading(true);  

    // PROCESS
    // 1. SAVE PDF FILE
    // 2. SAVE THUMBNAIL
    // 3. SAVE FILE (첨부파일)
    // 4. SAVE DB
    // 5. 임시파일삭제
    // 6. 초기화 및 화면 이동

    // 1. SAVE PDF FILE
    const filename = `${_id}${Date.now()}.pdf`;
    const path = `documents/${getToday()}/`;
    const file = await pdfRef.current.savePDF(false, false);
    const formData = new FormData()
    formData.append('path', path)
    formData.append('file', file, filename)
    const res = await axios.post(`/api/storage/upload`, formData)
    console.log(res)

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

    // 3. SAVE FILE (첨부파일)
    const attachPaths = []
    var files = []
    console.log('attachFiles:', attachFiles)
    if (attachFiles.length > 0) {

      const formData = new FormData()
      formData.append('path', 'attachfiles/'+Date.now()+'/');

      attachFiles.forEach(file => formData.append('files', file));

      const resFile = await axios.post(`/api/storage/uploadFiles`, formData)
      if (resFile.data.success) {
        // resFile.data.files.map(file => {
        //   attachPaths.push(file.path)
        // })
        files = resFile.data.files
      }
    }


    // 4. SAVE DB
    const signed = false;
    const xfdf = [];
    const signedBy = [];
    const signedTime = '';
    const users = assignees.map(assignee => {
      return assignee.key;
    });
    const items = pdfRef.current.convertBoxToComponent();
    console.log('converted items', items);

    // 본인 사인이 필요한 경우 바로 사인 유도를 위해 다음페이지에 문서 아이디를 넘겨준다. (일반 요청인 경우에만)
    var docId = '';
    var status = 'success';
    var resultMsg = '서명 요청되었습니다.';

    if (sendType === 'G') { // 일반

      // 순차 전송을 위해 필드 추가
      var usersOrder = [];
      var usersTodo = [];

      // SUNCHA: 순차 기능 활성화 
      var orderType = 'A';
      assignees.map(user => {
        usersOrder.push({'user': user.key, 'order': user.order})
        if (user.order == 0) {
          usersTodo.push(user.key)
        }
        if (user.order > 0) {
          orderType = 'S';
        }
      })

      let body = {
        user: _id,
        docTitle: docTitle,
        // email: email,
        docRef: docRef,
        // emails: emails,
        users: users,
        xfdf: xfdf, 
        items: items,
        isWithPDF: true,
        signedBy: signedBy,
        signed: signed,
        signedTime: signedTime,
        thumbnail: thumbnailUrl,
        pageCount: pageCount,
        observers: observers,
        // orderType: observers.length > 0 ? 'S':'A', // SUSIN: 수신 기능만 활성화
        orderType: orderType, //SUNCHA: 순차 기능 활성화 
        usersOrder: usersOrder,
        usersTodo: usersTodo,
        attachFiles: files
      }
      console.log("일반 전송")
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

    } else {  // 대량 전송

      const documentIds = [];
      async function saveDB(item) {
        console.log("Bulk 전송:" + item)
        let body = {
          user: _id,
          // docTitle: (documentType === "PC") ? documentTitle : templateTitle,
          docTitle: docTitle,
          docType: "B",
          // email: email,
          docRef: docRef,
          // emails: emails,
          users: [item],
          xfdf: xfdf, 
          items: items,
          isWithPDF: true,
          signedBy: signedBy,
          signed: signed,
          signedTime: signedTime,
          thumbnail: thumbnailUrl,
          pageCount: pageCount,
          observers: observers,
          attachFiles: files
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
        docTitle: docTitle,
        // docTitle: (documentType === "PC") ? documentTitle : templateTitle,
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


    //5. 임시파일삭제
    if (documentType === 'PC' || documentType === 'DIRECT') {
      await axios.post(`/api/storage/deleteFile`, {target: documentTempPath})
    }
    

    //6. 초기화 및 화면 이동
    dispatch(resetAssignAll());
    setLoading(false);

    navigate('/prepareResult', { state: {status:status, title:resultMsg, docId:docId}}); 

  }

  const uploadForSigning = async () => {

    // const referenceString = `docToSign/${getToday()}/${_id}${Date.now()}.pdf`;
    // var reg = new RegExp('(.*\/).*')
    // var path = reg.exec(referenceString)[1];
    // console.log("path:"+path)

    const filename = `${_id}${Date.now()}.pdf`
    const path = `documents/${getToday()}/`


    // 1. 파일 저장
    // 2. DB 저장
    // const docRef = storageRef.child(referenceString);
    const { Core } = instance;
    const { documentViewer, annotationManager } = Core;
    const doc = documentViewer.getDocument();
    const xfdfString = await annotationManager.exportAnnotations({ widgets: true, fields: true });
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





    // 2-1. 첨부파일 저장히기 
    const attachPaths = []
    var files = []
    console.log('attachFiles:', attachFiles)
    if (attachFiles.length > 0) {

      const formData = new FormData()
      formData.append('path', 'attachfiles/'+Date.now()+'/');

      attachFiles.forEach(file => formData.append('files', file));

      const resFile = await axios.post(`/api/storage/uploadFiles`, formData)
      if (resFile.data.success) {
        // resFile.data.files.map(file => {
        //   attachPaths.push(file.path)
        // })
        files = resFile.data.files
      }
    }






    // 3. SAVE DOCUMENT
    const signed = false;
    const xfdf = [];
    const signedBy = [];
    const signedTime = '';

    // 본인 사인이 필요한 경우 바로 사인 유도를 위해 다음페이지에 문서 아이디를 넘겨준다. (일반 요청인 경우에만)
    var docId = '';
    var status = 'success';
    var resultMsg = '서명 요청되었습니다.';

    if (sendType === 'G') { // 일반

      //users 배열 위치 조정: observer 가 제일 아래로 가도록 한다.
      // observers.map(observer => {
      //   if (users.includes(observer)) {
      //     const idx = users.indexOf(observer)
      //     const item = users.splice(idx, 1) 
      //     users.splice(users.length, 0, item[0])

      //     console.log('result:'+users)
      //   }
      // })

      // 순차 전송을 위해 필드 추가
      var usersOrder = [];
      var usersTodo = [];
      // SUSIN: 수신 기능만 활성화
      // users.map(user => {
      //   if (observers.includes(user)) {
      //     usersOrder.push({'user': user, 'order': 1})
      //   } else {
      //     usersOrder.push({'user': user, 'order': 0})
      //     usersTodo.push(user)
      //   }
      // })

      // SUNCHA: 순차 기능 활성화 
      var orderType = 'A';
      assignees.map(user => {
        usersOrder.push({'user': user.key, 'order': user.order})
        if (user.order == 0) {
          usersTodo.push(user.key)
        }
        if (user.order > 0) {
          orderType = 'S';
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
        observers: observers,
        // orderType: observers.length > 0 ? 'S':'A', // SUSIN: 수신 기능만 활성화
        orderType: orderType, //SUNCHA: 순차 기능 활성화 
        usersOrder: usersOrder,
        usersTodo: usersTodo,
        attachFiles: files
      }
      console.log("일반 전송")
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
          observers: observers,
          attachFiles: files
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
    if (documentType === 'PC' || documentType === 'DIRECT') {
      await axios.post(`/api/storage/deleteFile`, {target: documentTempPath})
    }
    
    dispatch(resetAssignAll());
    setLoading(false);

    navigate('/prepareResult', { state: {status:status, title:resultMsg, docId:docId}}); 
    // navigate('/');
  };

  const dragOver = e => {
    e.preventDefault();
    return false;
  };

  const drop = (e, instance) => {
    const { Core } = instance;
    const { documentViewer } = Core;
    const scrollElement = documentViewer.getScrollViewElement();
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

  const handleItemChanged = (action, item) => {
    console.log(action, item);

    if (action === 'add') {

      let member = boxData.filter(e => e.key === item.uid)[0];
      if (item.subType === TYPE_SIGN) {
        member.sign = member.sign + 1;
      } else if (item.subType === TYPE_TEXT) {
        
        if (item.autoInput) {
          if (item.autoInput === AUTO_NAME) {
            member.auto_name = member.auto_name + 1;
          } else if (item.autoInput === AUTO_JOBTITLE) {
            member.auto_jobtitle = member.auto_jobtitle + 1;
          } else if (item.autoInput === AUTO_OFFICE) {
            member.auto_office = member.auto_office + 1;
          } else if (item.autoInput === AUTO_DEPART) {
            member.auto_depart = member.auto_depart + 1;
          } else if (item.autoInput === AUTO_SABUN) {
            member.auto_sabun = member.auto_sabun + 1;
          } else if (item.autoInput === AUTO_DATE) {
            member.auto_date = member.auto_date + 1;
          }
        } else {
          member.text = member.text + 1;
        }
        
      } else if (item.subType === TYPE_CHECKBOX) {
        member.checkbox = member.checkbox + 1;
      }

      let newBoxData = boxData.slice();
      newBoxData[boxData.filter(e => e.key === item.uid).index] = member;
      setBoxData(newBoxData);

    } else if (action === 'delete') {

      let member = boxData.filter(e => e.key === item.uid)[0];
      if (item.subType === TYPE_SIGN) {
        member.sign = member.sign - 1;
      } else if (item.subType === TYPE_TEXT) {

        if (item.autoInput) {
          if (item.autoInput === AUTO_NAME) {
            member.auto_name = member.auto_name - 1;
          } else if (item.autoInput === AUTO_JOBTITLE) {
            member.auto_jobtitle = member.auto_jobtitle - 1;
          } else if (item.autoInput === AUTO_OFFICE) {
            member.auto_office = member.auto_office - 1;
          } else if (item.autoInput === AUTO_DEPART) {
            member.auto_depart = member.auto_depart - 1;
          } else if (item.autoInput === AUTO_SABUN) {
            member.auto_sabun = member.auto_sabun - 1;
          } else if (item.autoInput === AUTO_DATE) {
            member.auto_date = member.auto_date - 1;
          }
        } else {
          member.text = member.text - 1;
        }

      } else if (item.subType === TYPE_CHECKBOX) {
        member.checkbox = member.checkbox - 1;
      }

      let newBoxData = boxData.slice();
      newBoxData[boxData.filter(e => e.key === item.uid).index] = member;
      setBoxData(newBoxData);

    }
  }

  const addBox = (type, member, color) => {
    if (type === 'SIGN') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_SIGN, sendType === 'B' ? `SIGN` : `${member.name}<br>SIGN`, 100, 60, true, color);
    } else if (type === 'TEXT') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, 'TEXT', 120, 25, true, color);
    } else if (type === 'CHECKBOX') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_CHECKBOX, 'CHECKBOX', 25, 25, true, color);
    } else if (type === 'AUTONAME') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '이름', 100, 25, true, color, AUTO_NAME);
    } else if (type === 'AUTOJOBTITLE') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '직급', 100, 25, true, color, AUTO_JOBTITLE);
    } else if (type === 'AUTOSABUN') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '사번', 100, 25, true, color, AUTO_SABUN);
    } else if (type === 'AUTOOFFICE') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '회사명', 130, 25, true, color, AUTO_OFFICE);
    } else if (type === 'AUTODEPART') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '소속명', 130, 25, true, color, AUTO_DEPART);
    } else if (type === 'AUTODATE') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '날짜', 130, 25, true, color, AUTO_DATE);
    }
    
  }

  const onChangeDocTitle = (text) => {
    if (text === '') return false;
    (documentType === "PC") ? dispatch(setDocumentTitle(text)) : dispatch(setTemplateTitle(text))
    setDocTitle(text);
  }

  return (
    // <div className={'prepareDocument'}>
    <div>
    <PageContainerStyle>
    <PageContainer  
      // ghost
      header={{
        // title: (sendType == 'B') ? '서명 요청(대량 전송)' : <Typography.Title editable={{onChange: (text) => {onChangeDocTitle(text)}, tooltip: false}} level={5} style={{ margin: 0 }} >{docTitle}</Typography.Title>,
        title: <Typography.Title editable={{onChange: (text) => {onChangeDocTitle(text)}, tooltip: false}} level={5} style={{ margin: 0 }} >{docTitle}</Typography.Title>,
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="3" icon={<ArrowLeftOutlined />} onClick={() => {navigate(`/assign`);}}></Button>,,
          <Button key="2" icon={<SendOutlined />} type="primary" onClick={USE_WITHPDF ? send : applyFields} disabled={disableNext} loading={loading}>
            {formatMessage({id: 'Send'})}
          </Button>,
        ],
      }}
      style={{height:`calc(100vh + 200px)`}}
      content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={2} /></ProCard> }
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
        <Row gutter={[24, 24]}>
          {/* <Col span={responsive ? 24 : 5}> */}
          {/* <Col flex='250px' xl={6} lg={7} md={7} sm={24} xs={24}> */}
          <Col flex='250px'>

            {/* 일반 발송 */}
            {(sendType === 'G') ? (<div>  
              <List
              rowKey="id"
              loading={loading}
              grid={{ gutter: 24, lg: 1, md: 1, sm: 2, xs: 2 }}
              // grid={{ gutter: 24, column: responsive ? 2 : 1}}
              dataSource={assignees}
              renderItem={(item, idx) =>
                <List.Item key={item.key}>
                  {/* <Card size="small" type="inner" title={item.JOB_TITLE ? item.name+' '+item.JOB_TITLE : item.name} style={{ width: '220px' }} extra={ */}  

                  <Card size="small" type="inner" title={<><Tag color='blue'>{Number(item.order)+1}</Tag> {item.JOB_TITLE ? item.name+' '+item.JOB_TITLE : item.name} </>} style={{ width: '236px' }} extra={
                    <Tooltip placement="top" title={'문서에 서명 없이 문서 수신만 하는 경우'}>
                    <Checkbox onChange={e => {

                      console.log('called observer:'+item.key)
                      console.log('checked = ', e.target.checked);

                      if (USE_WITHPDF) {
                        if (e.target.checked) {
                          // observer 추가 
                          setObservers([...observers, item.key])
                          
                          // boxData 갱신
                          const member = boxData.filter(e => e.key === item.key)[0]
                          member.observer = member.observer + 1
                          member.sign = 0;
                          member.text = 0;
                          member.checkbox = 0;
                          const newBoxData = boxData.slice()
                          newBoxData[boxData.filter(e => e.key === item.key).index] = member 
                          setBoxData(newBoxData)
  
                          // annotation 삭제
                          pdfRef.current.deleteItemsByUserId(item.key);
  
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
                      } else {
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
                          const { Core } = instance;
                          const { Annotations, documentViewer } = Core;
                          const annotationManager = documentViewer.getAnnotationManager();
                          const annotationsList = annotationManager.getAnnotationsList();
                          const annotsToDelete = [];
  
                          annotationsList.map(async (annot, index) => {
                            console.log("annot.custom.name:"+annot?.custom?.name)
                            if (annot?.custom?.name.includes(item.key)) {
                              annotsToDelete.push(annot)
                            }
                          })
                          annotationManager.deleteAnnotations(annotsToDelete, null, true);
                 
  
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
                      }
                    }}
                    checked={observers.filter(v => v === item.key).length > 0}
                    >수신자 지정</Checkbox></Tooltip>
                  }>

                    <div className="absolute left-0 top-0" style={{width:0, height:0, borderBottom: '10px solid transparent', borderLeft: `10px solid ${COLORS[idx]}`, borderRight: '10px solid transparent'}} />

                    <Tooltip placement="right" title={'참여자가 사인을 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === item.key)[0].sign}>
                        <Button style={{width:'190px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0} icon={<Icon component={IconSign} style={{ fontSize: '120%'}} />} onClick={e => { addField('SIGN', {}, item, COLORS[idx]); }}>{formatMessage({id: 'input.sign'})}</Button>
                      </Badge>
                    </Tooltip>
                      {/* {boxData.filter(e => e.key === item.key)[0].sign} */}
                      <p></p>
                    <Tooltip placement="right" title={(browser && browser.name.includes('chrom') && parseInt(browser.version) < 87) ? '사용중인 브라우저의 버전이 낮습니다.(버전 87 이상 지원)' : '참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === item.key)[0].text}>
                        <Button style={{width:'91px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0 || (browser && browser.name.includes('chrom') && parseInt(browser.version) < 87)} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('TEXT', {}, item, COLORS[idx]); }}>{formatMessage({id: 'input.text'})}</Button>
                      </Badge>
                    </Tooltip>
                    &nbsp;&nbsp;&nbsp;
                    <Tooltip placement="right" title={(browser && browser.name.includes('chrom') && parseInt(browser.version) < 87) ? '사용중인 브라우저의 버전이 낮습니다.(버전 87 이상 지원)' : '참여자가 체크박스를 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === item.key)[0].checkbox}>
                        <Button style={{width:'90px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0 || (browser && browser.name.includes('chrom') && parseInt(browser.version) < 87)} icon={<Icon component={IconCheckbox} style={{ fontSize: '120%'}} />} onClick={e => { addField('CHECKBOX', {}, item, COLORS[idx]); }}>{formatMessage({id: 'input.checkbox'})}</Button>
                      </Badge>
                    </Tooltip>
                      {/* {boxData.filter(e => e.key === item.key)[0].text} */}
                    {/* 옵저버 기능 추가 */}
                    {/* <p>
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
                      }}>수신자로 지정</Checkbox>
                    </p> */}
                  </Card>
                </List.Item>
              }
              />

            {/* 대량 발송 */}
            </div>) : (<div>
              <Card size="small" type="inner" title="서명 참여자" style={{ width: '220px' }}>
                    <Tooltip block placement="right" title={'참여자가 사인을 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].sign : 0}>
                        <Button style={{width:'190px', textAlign:'left'}} icon={<Icon component={IconSign} style={{ fontSize: '120%'}} />} onClick={e => { addField('SIGN', {}, {key: 'bulk'}); }}>{formatMessage({id: 'input.sign'})}</Button>
                      </Badge>
                    </Tooltip>
                    <p></p>
                    <Tooltip placement="right" title={'참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].text : 0}>
                        <Button style={{width:'91px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('TEXT', {}, {key: 'bulk'}); }}>{formatMessage({id: 'input.text'})}</Button>
                      </Badge>
                    </Tooltip>
                    &nbsp;&nbsp;&nbsp;
                    <Tooltip placement="right" title={'참여자가 체크박스를 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].checkbox : 0}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconCheckbox} style={{ fontSize: '120%'}} />} onClick={e => { addField('CHECKBOX', {}, {key: 'bulk'}); }}>{formatMessage({id: 'input.checkbox'})}</Button>
                      </Badge>
                    </Tooltip>

                    <div>
                      <Divider plain>자동 입력</Divider>
                      <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_name}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTONAME', {}, {key: 'requester1', type: 'AUTONAME', name: "이름"}); }}>{formatMessage({id: 'name'})}</Button>
                      </Badge>
                      &nbsp;&nbsp;&nbsp;
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_jobtitle}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOJOBTITLE', {}, {key: 'requester1', type: 'AUTOJOBTITLE', name: "직급"}); }}>{formatMessage({id: 'jobtitle'})}</Button>
                      </Badge>
                      </p>
                      <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_office}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOOFFICE', {}, {key: 'requester1', type: 'AUTOOFFICE', name: "회사명"}); }}>{formatMessage({id: 'office'})}</Button>
                      </Badge>
                      &nbsp;&nbsp;&nbsp;
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_depart}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODEPART', {}, {key: 'requester1', type: 'AUTODEPART', name: "팀명"}); }}>{formatMessage({id: 'depart'})}</Button>
                      </Badge>
                      </p>
                      <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_sabun}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOSABUN', {}, {key: 'requester1', type: 'AUTOSABUN', name: "사번"}); }}>{formatMessage({id: 'sabun'})}</Button>
                      </Badge>
                      &nbsp;&nbsp;&nbsp;
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_date}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODATE', {}, {key: 'requester1', type: 'AUTODATE', name: "날짜"}); }}>{formatMessage({id: 'date'})}</Button>
                      </Badge>
                      </p>
                    </div>
              </Card>
            </div>
            )}  
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
          {/* <Col span={responsive ? 24 : 19}> */}
          {/* <Col flex='auto' xl={18} lg={17} md={17} sm={24} xs={24}> */}
          <Col flex='auto'>

            {/* <div className="webviewer" ref={viewer}></div> */}

            <Spin tip="로딩중..." spinning={loading}>
            {USE_WITHPDF ? <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={true} onItemChanged={handleItemChanged} defaultScale={1.0} />  : <div className="webviewer" ref={viewer}></div>}
            </Spin>


          </Col>
        </Row>

      {/* </RcResizeObserver> */}


    </PageContainer>
    </PageContainerStyle>
    
    </div>
  );
};

export default PrepareDocument;