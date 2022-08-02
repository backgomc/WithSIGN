import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Badge, Button, Row, Col, List, Card, Checkbox, Tooltip, Tag, Space, Divider } from 'antd';
import Icon, { PlusOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { selectSignees, selectObservers, selectTemplateId, selectTemplateRef, selectTemplateFileName, resetAssignAll } from './AssignTemplateSlice';
import { selectUser } from '../../app/infoSlice';
import WebViewer from '@pdftron/webviewer';
import './PrepareTemplate.css';
import StepWrite from '../PrepareTemplate/StepTemplate';
import { useIntl } from 'react-intl';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { LICENSE_KEY } from '../../config/Config';
import { ReactComponent as IconSign} from '../../assets/images/sign.svg';
import { ReactComponent as IconText} from '../../assets/images/text.svg';
import { ReactComponent as IconCheckbox} from '../../assets/images/checkbox.svg';

const { detect } = require('detect-browser');
const browser = detect();

const PrepareTemplate = () => {
  
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [instance, setInstance] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [observers, setObservers] = useState([]);
  
  const templateId = useSelector(selectTemplateId);
  const templateRef = useSelector(selectTemplateRef);
  const templateFileName = useSelector(selectTemplateFileName);
  const preObserver = useSelector(selectObservers);
  const assignees = useSelector(selectSignees);
  const box = assignees.map(user => {
    return { key:user.key, sign:0, text:0, checkbox:0, auto_name:0, auto_jobtitle:0, auto_office:0, auto_depart:0, auto_sabun:0, auto_date:0, observer:(preObserver.filter(v => v === user.key).length > 0)?1:0};
  });
  const [boxData, setBoxData] = useState(box);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { _id, email } = user;
  
  const viewer = useRef(null);

  // const props = {
  //   name: 'file',
  //   multiple: false,
  //   // action: '',
  //   beforeUpload: file => {
  //     if (file.type !== 'application/pdf') {
  //         console.log(file.type);
  //         message.error(`${file.name} is not a pdf file`);
  //         return Upload.LIST_IGNORE;
  //     }
  //     instance.loadDocument(file);
  //     return false;
  //   },
  //   onChange(info) {
  //     console.log(info.file, info.fileList);
  //   },
  //   onDrop(e) {
  //     console.log('Dropped files', e.dataTransfer.files);
  //   },
  // };

  // if using a class, equivalent of componentDidMount
  useEffect(() => {

    setObservers(preObserver.filter((value) => {
      return assignees.some(v => value == v.key);
    }));
    
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
      // const { iframeWindow, docViewer, CoreControls } = instance;
      const { Core, UI } = instance;
      const { documentViewer, Annotations, Tools } = Core;
      
      // set the ribbons(상단 그룹) and second header
      UI.enableElements(['ribbons']);
      UI.disableElements(['toolbarGroup-View', 'toolbarGroup-Annotate', 'toolbarGroup-Shapes', 'toolbarGroup-Insert', 'toolbarGroup-Measure', 'toolbarGroup-Edit', 'toolbarGroup-Forms', 'annotationCommentButton', 'linkButton', 'contextMenuPopup']);
      UI.disableTools([Tools.ToolNames.FORM_FILL_CROSS, Tools.ToolNames.FORM_FILL_CHECKMARK, Tools.ToolNames.FORM_FILL_DOT]);
      UI.setToolbarGroup('toolbarGroup-View');

      // set local font 
      Core.setCustomFontURL('/webfonts/');

      // set language
      UI.setLanguage('ko');

      // copy 방지 
      UI.disableFeatures(instance.Feature.Copy);

      // 포커스 
      documentViewer.setToolMode(documentViewer.getTool('Pan'));

      setInstance(instance);

      const iframeDoc = UI.iframeWindow.document.body;
      iframeDoc.addEventListener('dragover', dragOver);
      iframeDoc.addEventListener('drop', e => {
        drop(e, instance);
      });

      UI.loadDocument('/'+templateRef);

      documentViewer.addEventListener('documentLoaded', () => {
        console.log('documentLoaded called');

        // 디폴트 설정
        // docViewer.setToolMode(docViewer.getTool('AnnotationCreateFreeText'));

        // 페이지 저장
        setPageCount(documentViewer.getPageCount());
      });

      const annotationManager = documentViewer.getAnnotationManager();

      annotationManager.addEventListener('annotationChanged', (annotations, action, info) => {

        console.log('called annotationChanged:'+ action);

        // const { Annotations, docViewer, Font } = instance;
        let firstChk = false;

        annotations.forEach(function(annot) {
          console.log('annot', annot);
          console.log(annot.getCustomData('id'));
          // 템플릿 항목 설정 체크
          if (annot.getCustomData('id') && annot.getCustomData('id').endsWith('CUSTOM')) {
            let name = annot.getCustomData('id'); // sample: 6156a3c9c7f00c0d4ace4744_SIGN_CUSTOM
            let user = name.split('_')[0];
            let type = name.split('_')[1];
            
            firstChk = true;

            let member = boxData.filter(e => e.key === user)[0];
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

                // annot.FontSize = '' + 18.0 / docViewer.getZoom() + 'px';
                annot.custom = {
                  type,
                  name : `${member.key}_${type}_`
                }
                annot.deleteCustomData('id');
              }
            } else {
              // boxData 와 일치하는 annotation 없을 경우 삭제
              annotationManager.deleteAnnotation(annot);
            }
          }
        });
        
        // 자유 텍스트 상단 짤리는 문제 ...
        console.log(annotations[0].Subject, annotations[0].ToolName, annotations[0].TextAlign);
        if (annotations[0].ToolName && annotations[0].ToolName.startsWith('AnnotationCreateFreeText') && action === 'add') {
          // annotations[0].TextAlign = 'center';
          annotations[0].setPadding(new Annotations.Rect(0, 0, 0, 2)); // left bottom right top 
          annotations[0].Font = 'monospace';
        }
        
        // 최초 실행 또는 applyFields 에서 호출 시는 아래가 호출되지 않도록 처리 
        if (firstChk || !annotations[0].custom) {
          return;
        } 

        //TODO
        // 해당 메서드에서는 state 값을 제대로 못불러온다 ... 
        // Ref 를 써서 해결 ...
        if (action === 'add') {
          console.log('added annotation');

          const name = annotations[0].custom.name; //sample: 6156a3c9c7f00c0d4ace4744_SIGN_
          const user = name.split('_')[0];

          const member = boxData.filter(e => e.key === user)[0];

          if (name.includes('SIGN')) {
            member.sign = member.sign + 1;
          } else if (name.includes('TEXT')) {
            member.text = member.text + 1;
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

          const newBoxData = boxData.slice();
          newBoxData[boxData.filter(e => e.key === user).index] = member;
          
          setBoxData(newBoxData);

          // 0: {key: '6156a3c9c7f00c0d4ace4744', sign: 0, text: 0}
          // 1: {key: '6156a3c9c7f00c0d4ace4746', sign: 0, text: 0}

          // setBoxData( (prev) => [...prev, {key:123, sign:1, text:2}] );
          // setBoxData([{key: '6156a3c9c7f00c0d4ace4744', sign: 1, text: 0}, {key: '6156a3c9c7f00c0d4ace4746', sign: 0, text: 0}])

        } else if (action === 'modify') {
          console.log('this change modified annotations');
        } else if (action === 'delete') {
          console.log('deleted annotation:'+ annotations);

          // annotation 이 동시 삭제되는 경우 처리 : observer 체크 시 
          annotations.map(annotation => {
            const name = annotation.custom.name;  //sample: 6156a3c9c7f00c0d4ace4744_SIGN_
            const user = name.split('_')[0];
            const member = boxData.filter(e => e.key === user)[0];
  
            if (name.includes('SIGN')) {
              member.sign = member.sign - 1;
            } else if (name.includes('TEXT')) {
              member.text = member.text - 1;
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
  
            const newBoxData = boxData.slice();
            newBoxData[boxData.filter(e => e.key === user).index] = member;
            
            setBoxData(newBoxData);
          });
        }
      });

      // 내 사인 이미지 가져와서 출력하기
      const res = await axios.post('/api/sign/signs', {user: _id});
      if (res.data.success) {
        const signs = res.data.signs;
        var signDatas = [];
        signs.forEach(element => {
          signDatas.push(element.signData);
        });

        if (signDatas.length > 0) {
          const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
          documentViewer.addEventListener('documentLoaded', () => {
            signatureTool.importSignatures(signDatas);
          });
        }
      }
    });
  }, []);

  // observers.filter(v => v == box.key).count === 0
  useEffect(() => {

    // 유효성 체크 
    var check = false;
    boxData.map(box => {
      if(box.sign === 0 && box.text === 0 && box.observer === 0) { 
        check = true;
      }
    });
    setDisableNext(check);
  }, [boxData]);

  const applyFields = async () => {

    console.log('applyFields called');
    
    const { Core } = instance;
    const { documentViewer } = Core;
    const annotationManager = documentViewer.getAnnotationManager();
    const annotationsList = annotationManager.getAnnotationsList();

    await Promise.all(
      annotationsList.map(async (annot) => {
        if (annot.custom) {
          console.log(annot.custom);
          annot.setCustomData('id', annot.custom.name + 'CUSTOM');  // 템플릿 항목 설정 표시
          annot.setCustomData('fontSize', annot.FontSize);  // 폰트사이즈 저장
        }
      })
    );

    await uploadForSigning();
  };

  const applyFieldsDirect = async () => {

    console.log('applyFieldsDirect called');
    // setLoading(true);

    // const { Annotations, docViewer } = instance;
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
                flags: [Annotations.WidgetFlags.MULTILINE, Annotations.WidgetFlags.DO_NOT_SCROLL, Annotations.WidgetFlags.DO_NOT_SPELL_CHECK]
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
            inputAnnot.setCustomData('font', annot.Font);
            inputAnnot.setCustomData('fontSize', annot.FontSize);
            inputAnnot.setCustomData('textAlign', annot.TextAlign);
            inputAnnot.setCustomData('textVerticalAlign', annot.TextVerticalAlign);
            if (annot.getRichTextStyle() && annot.getRichTextStyle()[0]) {
              inputAnnot.setCustomData('fontStyle', annot.getRichTextStyle()[0]['font-style']);
              inputAnnot.setCustomData('fontWeight', annot.getRichTextStyle()[0]['font-weight']);
              inputAnnot.setCustomData('textDecoration', annot.getRichTextStyle()[0]['text-decoration']);
            }
            
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

  };
  

  const addField = (type, point = {}, member = {}, name = '', value = '', flag = {}) => {

    console.log('called addField');

    // const { docViewer, Annotations } = instance;
    const { Core } = instance;
    const { documentViewer, Annotations } = Core;
    const annotationManager = documentViewer.getAnnotationManager();
    const doc = documentViewer.getDocument();
    const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx = page.first !== null ? page.first : documentViewer.getCurrentPage();
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = documentViewer.getZoom();

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
      name: `${member.key}_${type}_`
    };

    // set the type of annot
    if (type.includes("AUTO")) {
      textAnnot.setContents(member.name);
      textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
      textAnnot.TextColor = new Annotations.Color(73, 73, 73);
      textAnnot.StrokeColor = new Annotations.Color(73, 73, 73);
      textAnnot.TextAlign = 'left'; //텍스트는 좌측정렬
    } else {
      textAnnot.setContents(member.name+(type==='SIGN'?'\n'+type:' '+type));
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

  const uploadForSigning = async () => {

    const path = 'templates/';
    // const { docViewer, annotManager } = instance;
    const { Core } = instance;
    const { documentViewer, annotationManager } = Core;
    let doc = documentViewer.getDocument();
    let xfdfString = await annotationManager.exportAnnotations({ widgets: true, fields: true });
    let xfdfStringCopy = xfdfString
    let data = await doc.getFileData({ xfdfString });
    let arr = new Uint8Array(data);
    let blob = new Blob([arr], { type: 'application/pdf' });
    const assigneesExceptRequester = assignees.filter(el => !el.key.includes('requester'))
    const users = assigneesExceptRequester.map(assignee => {
      return assignee.key;
    });
    
    // ISSUE 로딩바가 켜지면 웹뷰어가 사라져서 아래 진행이 안되므로 레이어 위에 로딩바형태로 변경 필요할듯 
    // TODO 로딩바 바뀌기
    // setLoading(true);
    
    // 1. SAVE FILE
    let formData = new FormData();
    formData.append('path', path);
    formData.append('file', blob, templateFileName);
    let res = await axios.post('/api/storage/upload', formData);
    console.log(res);

    // 업로드 후 파일 경로 가져오기  
    var customRef = '';
    if (res.data.success) {
      customRef = res.data.file.path;
    }


    // 1-2 신청서 양식 생성
    await applyFieldsDirect();
    console.log("AFTER applyFieldsDirect");
    doc = documentViewer.getDocument();

    // TODO requester1은 파일에 reqeuset2,3 는 DB에 별도로 저장해 둔다.
    // let annotList = await annotManager.getAnnotationsList().filter(annot => annot.fieldName.startsWith('requester1'))
    // annotList.forEach(el => {
    //   console.log('A1', el.fieldName)
    // })

    // xfdfString = await annotManager.exportAnnotations({ widgets: true, fields: true, annotList: annotList });
    // console.log('xfdfString', xfdfString)

    // let annotList2 = await annotManager.getAnnotationsList().filter(annot => !annot.fieldName.startsWith('requester1'))
    // let xfdfString2 = await annotManager.exportAnnotations({ widgets: true, fields: true, annotList: annotList2 });
    // console.log('xfdfString2', xfdfString2)

    // annotList2.forEach(el => {
    //   console.log('A2', el.fieldName)
    // })


    xfdfString = await annotationManager.exportAnnotations({ widgets: true, fields: true });
    data = await doc.getFileData({ xfdfString });
    // data = await doc.getFileData({ });  // DB 에 저장 후 불러오는 방식으로 변경 중 : 파일에는 값 저장하지 않음 
    arr = new Uint8Array(data);
    blob = new Blob([arr], { type: 'application/pdf' });

    setLoading(true);

    let formData2 = new FormData();
    formData2.append('path', path);
    formData2.append('file', blob, templateFileName.replace('CUSTOM', 'DIRECT'));
    let res2 = await axios.post('/api/storage/upload', formData2);

    var directRef = '';
    if (res2.data.success) {
      directRef = res2.data.file.path;
    }


    // 2. UPDATE DOCUMENT
    var usersOrder = [];
    var usersTodo = [];
    var orderType = 'A';

    //TODO: request가 0단계인 경우 1단계 서명자를 TODO로 내려준다???
    assigneesExceptRequester.map(user => {
      usersOrder.push({'user': user.key, 'order': user.order});
      if (user.order == 0) {
        usersTodo.push(user.key);
      }
      if (user.order > 0) {
        orderType = 'S';
      }
    })

    let body = {
      _id: templateId,
      user: _id,
      customRef: customRef,
      directRef: directRef,
      users: users,
      observers: observers,
      orderType: orderType, //SUNCHA: 순차 기능 활성화 
      usersOrder: usersOrder,
      usersTodo: usersTodo,
      signees: assigneesExceptRequester,
      hasRequester: assignees.some(v => v.key === 'requester1'),
      requesters: assignees.filter(el => el.key.includes('requester')),
      xfdfIn: xfdfString
    }
    
    res = await axios.post('/api/template/updateTemplate', body);
    console.log(res);

    dispatch(resetAssignAll());


    setLoading(false);
    navigate('/templateList'); 
  };

  const uploadForDirect = async () => {

    const path = 'templates/';
    // const { docViewer, annotManager } = instance;
    const { Core } = instance;
    const { documentViewer, annotationManager } = Core;
    const doc = documentViewer.getDocument();
    const xfdfString = await annotationManager.exportAnnotations({ widgets: true, fields: true });
    const data = await doc.getFileData({ xfdfString });
    const arr = new Uint8Array(data);
    const blob = new Blob([arr], { type: 'application/pdf' });
    const assigneesExceptRequester = assignees.filter(el => !el.key.includes('requester'))
    const users = assigneesExceptRequester.map(assignee => {
      return assignee.key;
    });
    
    setLoading(true);
    
    // 1. SAVE FILE
    let formData = new FormData();
    formData.append('path', path);
    formData.append('file', blob, templateFileName.replace('CUSTOM', 'DIRECT'));
    let res = await axios.post('/api/storage/upload', formData);
    console.log(res);

    // 업로드 후 파일 경로 가져오기  
    var customRef = '';
    if (res.data.success) {
      customRef = res.data.file.path;
    }

    var directRef = '';
    setLoading(false);

  };

  const dragOver = e => {
    e.preventDefault();
    return false;
  };

  const drop = (e, instance) => {
    // const { docViewer } = instance;
    const { Core } = instance;
    const { documentViewer } = Core;
    const scrollElement = documentViewer.getScrollViewElement();
    const scrollLeft = scrollElement.scrollLeft || 0;
    const scrollTop = scrollElement.scrollTop || 0;
    setDropPoint({ x: e.pageX + scrollLeft, y: e.pageY + scrollTop });
    e.preventDefault();
    return false;
  };

  return (
    <div>
      <PageContainer
        // ghost
        header={{
          title: '입력 설정',
          ghost: true,
          breadcrumb: {
            routes: [],
          },
          extra: [
            <Button key="2" icon={<ArrowLeftOutlined />} onClick={() => {navigate('/assignTemplate');}}></Button>,
            <Button key="1" icon={<SendOutlined />} type="primary" onClick={applyFields} disabled={disableNext} loading={loading}>{formatMessage({id: 'Save'})}</Button>
          ]
        }}
        content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={2} /></ProCard> }
        footer={[
        ]}
        loading={loading}
      >
        <Row gutter={[24, 24]}>
          <Col xl={4} lg={4} md={4} sm={24} xs={24}>
            <div>
              <List
                rowKey="id"
                loading={loading}
                grid={{ gutter: 24, lg: 1, md: 1, sm: 2, xs: 2 }}
                dataSource={assignees}
                renderItem={item =>
                  <List.Item key={item.key}>
                    <Card size="small" type="inner" title={<><Tag color="blue">{Number(item.order)+1}</Tag> {item.JOB_TITLE ? item.name+' '+item.JOB_TITLE : item.name} </>} style={{ width: '240px' }} extra={
                      <Tooltip placement="top" title={'문서에 서명 없이 문서 수신만 하는 경우'}>
                        <Checkbox onChange={e => {
                          if (e.target.checked) {
                            // observer 추가 
                            setObservers([...observers, item.key]);
                            // boxData 갱신
                            const member = boxData.filter(e => e.key === item.key)[0];
                            member.observer = member.observer + 1;
                            const newBoxData = boxData.slice();
                            newBoxData[boxData.filter(e => e.key === item.key).index] = member;
                            setBoxData(newBoxData);
                            // annotation 삭제
                            const { Annotations, docViewer } = instance;
                            const annotManager = docViewer.getAnnotationManager();
                            const annotationsList = annotManager.getAnnotationsList();
                            const annotsToDelete = [];
                            annotationsList.map(async (annot, index) => {
                              if (annot?.custom?.name.includes(item.key)) {
                                annotsToDelete.push(annot);
                              }
                            });
                            annotManager.deleteAnnotations(annotsToDelete, null, true);
                          } else {
                            // observer 삭제
                            setObservers(observers.filter(v => v != item.key));
                            // boxData 갱신
                            const member = boxData.filter(e => e.key === item.key)[0];
                            member.observer = member.observer - 1;
                            const newBoxData = boxData.slice();
                            newBoxData[boxData.filter(e => e.key === item.key).index] = member;
                            setBoxData(newBoxData);
                          }
                        }}
                        checked={observers.filter(v => v === item.key).length > 0}
                        disabled={item.key === 'requester1' ? true : false}
                        >수신자 지정</Checkbox>
                      </Tooltip>
                    }>
                      <p>
                      <Tooltip placement="right" title={'참여자가 사인을 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].sign}>
                          <Button style={{width:'190px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0} icon={<Icon component={IconSign} style={{ fontSize: '120%'}} />} onClick={e => { addField('SIGN', {}, item); }}>{formatMessage({id: 'input.sign'})}</Button>
                        </Badge>
                      </Tooltip>
                      </p>
                      <p>
                      <Tooltip placement="right" title={(browser && browser.name.includes('chrom') && parseInt(browser.version) < 87) ? '사용중인 브라우저의 버전이 낮습니다.(버전 87 이상 지원)' : '참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].text}>
                          <Button style={{width:'91px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0 || (browser && browser.name.includes('chrom') && parseInt(browser.version) < 87)} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('TEXT', {}, item); }}>{formatMessage({id: 'input.text'})}</Button>
                        </Badge>
                      </Tooltip>
                      &nbsp;&nbsp;&nbsp;
                      <Tooltip placement="right" title={(browser && browser.name.includes('chrom') && parseInt(browser.version) < 87) ? '사용중인 브라우저의 버전이 낮습니다.(버전 87 이상 지원)' : '참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].checkbox}>
                          <Button style={{width:'90px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0 || (browser && browser.name.includes('chrom') && parseInt(browser.version) < 87)} icon={<Icon component={IconCheckbox} style={{ fontSize: '120%'}} />} onClick={e => { addField('CHECKBOX', {}, item); }}>{formatMessage({id: 'input.checkbox'})}</Button>
                        </Badge>
                      </Tooltip>
                      </p>

                      {/*  자동 입력값 셋팅 */}
                      {item.key === 'requester1' && 
                        <div>
                        <Divider plain>자동 입력</Divider>
                        <p>
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_name}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTONAME', {}, {key: 'requester1', type: 'AUTONAME', name: "이름"}); }}>{formatMessage({id: 'name'})}</Button>
                        </Badge>
                        &nbsp;&nbsp;&nbsp;
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_jobtitle}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOJOBTITLE', {}, {key: 'requester1', type: 'AUTOJOBTITLE', name: "직급"}); }}>{formatMessage({id: 'jobtitle'})}</Button>
                        </Badge>
                        </p>
                        <p>
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_office}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOOFFICE', {}, {key: 'requester1', type: 'AUTOOFFICE', name: "회사명"}); }}>{formatMessage({id: 'office'})}</Button>
                        </Badge>
                        &nbsp;&nbsp;&nbsp;
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_depart}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODEPART', {}, {key: 'requester1', type: 'AUTODEPART', name: "부서명"}); }}>{formatMessage({id: 'depart'})}</Button>
                        </Badge>
                        </p>
                        <p>
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_sabun}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOSABUN', {}, {key: 'requester1', type: 'AUTOSABUN', name: "사번"}); }}>{formatMessage({id: 'sabun'})}</Button>
                        </Badge>
                        &nbsp;&nbsp;&nbsp;
                        <Tooltip placement="right" title={'예) 2022년 06월 10일'}>
                          <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_date}>
                            <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODATE', {}, {key: 'requester1', type: 'AUTODEPART', name: "날짜"}); }}>{formatMessage({id: 'date'})}</Button>
                          </Badge>
                        </Tooltip>
                        </p></div>}



                    </Card>
                  </List.Item>
                }
              />
            </div>
            
            {/*  자동 입력값 셋팅 */}
            {/* {boxData.filter(e => e.key === 'requester').length > 0 && 
            <div>
            <Card size="small" type="inner" title="자동 입력" style={{ width: '240px' }}>
              <p>
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_name}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTONAME', {}, {key: 'requester', type: 'AUTONAME', name: "이름"}); }}>{formatMessage({id: 'name'})}</Button>
              </Badge>
              &nbsp;&nbsp;&nbsp;
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_jobtitle}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOJOBTITLE', {}, {key: 'requester', type: 'AUTOJOBTITLE', name: "직급"}); }}>{formatMessage({id: 'jobtitle'})}</Button>
              </Badge>
              </p>
              <p>
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_office}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOOFFICE', {}, {key: 'requester', type: 'AUTOOFFICE', name: "회사명"}); }}>{formatMessage({id: 'office'})}</Button>
              </Badge>
              &nbsp;&nbsp;&nbsp;
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_depart}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODEPART', {}, {key: 'requester', type: 'AUTODEPART', name: "부서명"}); }}>{formatMessage({id: 'depart'})}</Button>
              </Badge>
              </p>
              <p>
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_sabun}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOSABUN', {}, {key: 'requester', type: 'AUTOSABUN', name: "사번"}); }}>{formatMessage({id: 'sabun'})}</Button>
              </Badge>
              &nbsp;&nbsp;&nbsp;
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_date}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODATE', {}, {key: 'requester', type: 'AUTODEPART', name: "날짜"}); }}>{formatMessage({id: 'date'})}</Button>
              </Badge>
              </p>
            </Card>
            </div>} */}



          </Col>
          <Col xl={20} lg={20} md={20} sm={24} xs={24}>
            <div className="webviewer" ref={viewer}></div>
          </Col>
        </Row>
      </PageContainer>
    </div>
  );
};

export default PrepareTemplate;
