import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import SignaturePad from 'react-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { navigate } from '@reach/router';
import { TreeSelect, Input, Row, Col, Modal, Spin, Button, Upload, message, Typography, Divider, Steps, Tag } from 'antd';
import { selectUser } from '../../app/infoSlice';
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
import { selectDirect, setDirectTempPath } from './DirectSlice';
import { setDocumentTempPath, selectTemplateTitle, setTemplateTitle, selectIsWithPDF } from '../Assign/AssignSlice';
import moment from 'moment';
import 'moment/locale/ko';
import ProForm, { ProFormUploadButton } from '@ant-design/pro-form';
import UserSelectorModal from '../Common/UserSelectorModal';
import { deepCopyObject } from '../../util/common';
import styled from 'styled-components';

import PDFViewer from "@niceharu/withpdf";
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_BOX, TYPE_CHECKBOX, TYPE_DROPDOWN, COLORS, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';
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

.ant-page-header-content {
  padding-top: 0px;
}

.ant-form-item {
  margin-bottom: 0px;
}

.ant-divider-horizontal {
  margin: 15px 0;
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
  const [fileList, setFileList] = useState([]); // 첨부 파일 (max:3개)
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


  const { directRef, docRef, items, xfdfIn, requesters, observers, signees, usersOrder } = direct;
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
    initWithPDF();
  }, [directRef, _id]);

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axiosInterceptor.post('/api/sign/signs', param);
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

    if (loading) return;  // 중복 실행 방지 추가

    // 유효성 체크 : 참여자
    if ((requesters.length - 1) !== selectUsers.length) {
      message.warning('참여자를 지정해주세요!');
      return;
    }

    setLoading(true);

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

      if (item.uid?.startsWith('requester')) { // uid 변경 

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
    const res = await axiosInterceptor.post(`/api/storage/upload`, formData)

    // 업로드 후 파일 경로 가져오기  
    var docRef = ''
    if (res.data.success){
      docRef = res.data.file.path 
    }
    console.log('docRef', docRef);

    // 2. SAVE THUMBNAIL
    let _thumbnail = await pdfRef.current.getThumbnail(0, 0.6);
    const resThumbnail = await axiosInterceptor.post('/api/document/addThumbnail', {user: _id, thumbnail: _thumbnail})
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

      const resFile = await axiosInterceptor.post(`/api/storage/uploadFiles`, formData)
      if (resFile.data.success) {
        files = resFile.data.files
      }
    }

    // 4. SAVE DOCUMENT
    var docId = '';
    var status = 'success';
    var resultMsg = '서명 요청이 정상 처리되었습니다.';

    // 순차 전송을 위해 필드 추가
    var _usersOrder = [];
    var usersTodo = [];

    console.log('usersOrder from server', usersOrder)

    // SUNCHA: 순차 기능 활성화 
    // let assignees = [..._requesters, ...signees];


    _lastUsers.sort((a, b) => a.order - b.order);
    let maxOrder = _lastUsers[0]?.order;

    console.log('_lastUsers', _lastUsers);
    console.log('maxOrder', maxOrder);
    var orderType = 'A';
    _lastUsers.forEach(user => {
      _usersOrder.push({'user': user.key, 'order': user.order, 'allowSkip': usersOrder.find(el => el.user === user.key)?.allowSkip})
      if (user.order === maxOrder) {
        usersTodo.push(user.key)
      }
      if (user.order > 0) {
        orderType = 'S';
      }
    })

    console.log('_usersOrder changed', _usersOrder)

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
      usersOrder: _usersOrder,
      usersTodo: usersTodo,
      attachFiles: files,
      isWithPDF: true
    }

    const res2 = await axiosInterceptor.post('/api/document/addDocumentToSign', body)
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
      // dispatch(setAttachFiles(newFileList));
      // setAttachFiles(newFileList)
      // dispatch(selectAttachFiles);
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
      // dispatch(setAttachFiles([...fileList, file]));
      // setAttachFiles([...fileList, file])
      // dispatch(selectAttachFiles);

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
          <Button key="2" type="primary" loading={loading} onClick={() => send()} disabled={disableNext}>
            {formatMessage({id: 'submit'})}
          </Button>,
        ],
      }}
      style={{height:`calc(100vh - 72px)`}}
      content={content}
      // footer={[
      // ]}
      // loading={loading}
    >

          <Spin tip="로딩중..." spinning={loading}>
            <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} onItemChanged={handleItemChanged} onValidationChanged={handleValidationChanged} defaultScale={1.0} headerSpace={300} />
          </Spin>

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
