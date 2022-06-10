import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import SignaturePad from 'react-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { navigate } from '@reach/router';
// import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { Input, Row, Col, Modal, Checkbox, Button, List, Typography } from 'antd';
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
import { setDocumentTempPath, selectTemplateTitle, setTemplateTitle } from '../Assign/AssignSlice';
import moment from 'moment';
import 'moment/locale/ko';
// import Item from 'antd/lib/list/Item';

const { confirm } = Modal;
const { TextArea } = Input;

const SignDirect = () => {

  const { formatMessage } = useIntl();

  const [webViewInstance, setWebViewInstance] = useState(null);
  const [annotManager, setAnnotatManager] = useState(null);
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

  const dispatch = useDispatch();
  // const uploading = useSelector(selectUploading);
  const direct = useSelector(selectDirect);
  const user = useSelector(selectUser);
  const templateTitle = useSelector(selectTemplateTitle);

  const { directRef } = direct;
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
    if (!sigCanvas.current.isEmpty()) {
      const { docViewer } = webViewInstance;
      const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      await signatureTool.setSignature(sigCanvas.current.toDataURL('image/png'));
      signatureTool.addSignature();
      webViewInstance.closeElements(['signatureModal']);
      webViewInstance.setToolbarGroup('toolbarGroup-View');
    }
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

    fetchSigns();

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
      const { docViewer, annotManager, Annotations, CoreControls } = instance;
      setAnnotatManager(annotManager);
      setWebViewInstance(instance);

      const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      signatureTool.on('locationSelected', async () => {
        setSignModal(true);
        instance.closeElements(['signatureModal']);
        instance.setToolbarGroup('toolbarGroup-View');
      });

      // set language
      instance.setLanguage('ko');

      // set the ribbons(상단 그룹) and second header
      instance.enableElements(['ribbons']);
      instance.disableElements(['toolbarGroup-View', 'toolbarGroup-Shapes', 'toolbarGroup-Measure', 'toolbarGroup-Edit']);
      
      // select only the insert group
      // instance.disableElements(['header']);
      instance.setToolbarGroup('toolbarGroup-View');
      CoreControls.setCustomFontURL("/webfonts/");

      // load document
      // const storageRef = storage.ref();
      // const URL = await storageRef.child(docRef).getDownloadURL();
      
      // DISTO
      const URL = '/' + directRef;
      docViewer.loadDocument(URL);

      docViewer.on('documentLoaded', () => {
        console.log('documentLoaded called');
        setPageCount(docViewer.getPageCount());

        // 밸류 자동 셋팅
        docViewer.getAnnotationsLoadedPromise().then(() => {
          // iterate over fields
          const fieldManager = annotManager.getFieldManager();
          fieldManager.forEachField(field => {
            console.log(field.getValue());
            console.log('fieldName', field.ad);
            
            if (field.ad?.includes('AUTONAME')) {
              field.setValue(name);
            } else if (field.ad?.includes('AUTOJOBTITLE')) {
              field.setValue(JOB_TITLE);
            } else if (field.ad?.includes('AUTOSABUN')) {
              field.setValue(SABUN);
            } else if (field.ad?.includes('AUTODATE')) {
              field.setValue(moment().format('YYYY년 MM월 DD일'));
            } else if (field.ad?.includes('AUTOOFFICE')) {
              field.setValue(OFFICE_NAME);
            } else if (field.ad?.includes('AUTODEPART')) {
              field.setValue(DEPART_NAME);
            }
            
          });
        });
        
      });

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {

          if (widget.fieldName.startsWith(_id) || widget.fieldName.startsWith('requester')) { 
            return {
              border: '1px solid #a5c7ff',
              'background-color': '#e8e8e8',
              color: 'black',
            };
          } else {
            return {
              color: 'black',
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

      annotManager.on('annotationChanged', (annotations, action, { imported }) => {
        console.log("annotationChanged called(action):"+ action)

        if (!imported && action === 'add') {  // 서명 및 입력값이 추가 된 경우
          const annotList = annotManager.getAnnotationsList();
          let widgetCount = 0;
          let createCount = 0;
          annotList.forEach(function(annot) {
            if (annot instanceof Annotations.SignatureWidgetAnnotation && annot.fieldName.startsWith('requester')) widgetCount++;
            if (annot.ToolName === 'AnnotationCreateSignature') createCount++;
          });
          if (widgetCount === 0 || widgetCount > 0 && widgetCount === createCount) setDisableNext(false);
        }

        if (!imported && action === 'delete') {  // 서명 및 입력값이 삭제 된 경우
          annotations.forEach(function(annot) {
            if (annot.ToolName === 'AnnotationCreateSignature') setDisableNext(true);
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

              if (!annot.fieldName.startsWith('requester')) {
                annot.Hidden = true;
                annot.Listable = false;
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

    // TODO 
    //1. 문서 Merge (O)
    //2. 문서 임시 저장 (O)
    //3. 임시 경로 redux 저장 setDirectTempPath (O)   
    //4. 사람 선택 화면으로 이동 

    const xfdf = await annotManager.exportAnnotations({ widgets: true, fields: true });
    // const xfdf = await annotManager.exportAnnotations({ widgets: true, fields: true,	annotList: annotManager.getAnnotationsList() });

    const tempPath = await mergeDirect(directRef, [xfdf]);
    console.log(tempPath)
    dispatch(setDocumentTempPath(tempPath))

    navigate('/assign');
  }

  const onChangeTemplateTitle = (text) => {
    if (text === '') return false;
    dispatch(setTemplateTitle(text));
  }

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
            {formatMessage({id: 'Next'})}
          </Button>,
        ],
      }}
      // content=''
      footer={[
      ]}
      loading={loading}
    >

        <Row gutter={[24, 24]}>
          <Col span={24}>
          <div className="webviewer" ref={viewer}></div>
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
            <Button key="submit" type="primary" loading={loading} onClick={handleOk}>확인</Button>
          ]}
          bodyStyle={{padding: '0px 24px'}}
        >
          <ProCard bodyStyle={{padding: '20px 0px'}}>
            <SignaturePad penColor='black' ref={sigCanvas} canvasProps={{className: 'signCanvas'}} />
            <div class="signBackground"><div class="signHereText">직접서명 또는 서명선택</div></div>
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

    </PageContainer> 

    </div>
  );
};

export default SignDirect;
