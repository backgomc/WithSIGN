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
  const [annotManager, setAnnotatManager] = useState(null);
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

        // 썸네일 저장
        const doc = docViewer.getDocument();
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
            if (annot instanceof Annotations.SignatureWidgetAnnotation && annot.fieldName.startsWith('requester1')) widgetCount++;
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

              if (!annot.fieldName.startsWith('requester1')) {
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

    // 유효성 체크
    if ((requesters.length - 1) !== selectUsers.length) {
      message.warning('참여자를 지정해주세요!');
      return;
    }

    setSpinning(true)

    const xfdf = await annotManager.exportAnnotations({ widgets: true, fields: true });

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
            {formatMessage({id: 'Next'})}
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

        <UserSelectorModal showModal={userModal} setShowModal={setUserModal} selectUsers={selectUsers} setSelectUsers={setSelectUsers} userKey={userKey} setUserKey={setUserKey} signees={signees} />

    </PageContainer> 

    </div>
  );
};

export default SignDirect;
