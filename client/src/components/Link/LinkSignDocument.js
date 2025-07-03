// client/src/components/Link/LinkSignDocument.js
// 기존 SignDocument.js를 베이스로 링크서명용으로 최소 수정

import React, { useRef, useEffect, useState } from 'react';
import { useParams, navigate } from '@reach/router';
import SignaturePad from 'react-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Input, Row, Col, Modal, Checkbox, message, Button, List, Spin } from 'antd';
import { 
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import ProCard, { CheckCard } from '@ant-design/pro-card';
import {
  PaperClipOutlined
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import moment from 'moment';
import 'moment/locale/ko';
import PDFViewer from "@niceharu/withpdf";
import loadash from 'lodash';
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_CHECKBOX, TYPE_DROPDOWN, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';
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

const LinkSignDocument = (props) => {
  const { linkId } = useParams();
  const { formatMessage } = useIntl();

  // 링크에서 전달된 정보 (LinkAccess에서 인증 완료 후)
  const linkInfo = props.location?.state?.linkInfo;
  const verified = props.location?.state?.verified;
  const signerName = props.location?.state?.signerName || '';
  const signerPhone = props.location?.state?.signerPhone || '';

  // 기존 SignDocument.js와 동일한 state들
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
  const [textSign, setTextSign] = useState('서명 완료');

  // 링크서명용 문서 데이터 (Redux 대신)
  const [documentData, setDocumentData] = useState(null);
  const [annotsToDelete, setAnnotsToDelete] = useState([]);
  
  // 기존과 동일한 refs
  const viewer = useRef(null);
  const cancelMessage = useRef({});
  const pdfRef = useRef();
  const sigCanvas = useRef({});

  useEffect(() => {
    // 인증되지 않은 경우 접속 화면으로 리다이렉트
    if (!verified || !linkInfo) {
      message.warning('먼저 링크 인증을 완료해주세요.');
      navigate(`/sign/link/${linkId}`);
      return;
    }

    loadDocumentData();
  }, [linkId, verified, linkInfo]);

  // 링크서명 문서 데이터 로드
  const loadDocumentData = async () => {
    try {
      setLoading(true);

      const response = await axios.post('/api/link/getSignDocument', {
        linkId: linkId
      });

      if (response.data.success) {
        const data = response.data.document;
        setDocumentData(data);
        
        // 문서 데이터 로드 후 초기화
        setTimeout(() => {
          fetchSigns();
          initWithPDF(data);
        }, 100);
      } else {
        throw new Error(response.data.message || '문서를 불러올 수 없습니다.');
      }
      
    } catch (error) {
      console.error('문서 로드 오류:', error);
      alert('문서 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기존 SignDocument.js와 동일한 함수들
  const clear = () => {
    sigCanvas.current.clear();
    let chkObj = document.getElementsByClassName('ant-pro-checkcard-checked');
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

  // 기존과 동일한 initWithPDF (데이터 소스만 변경)
  const initWithPDF = async (data) => {
    const docRef = `/${data.docRef}`;  // 루트 경로로
    const items = data.items;

    // PDF 로드
    await pdfRef.current.uploadPDF(docRef);

    // 기존과 동일한 items 처리
    console.log('items', items);
    let newItems = loadash.cloneDeep(items);

    let renewItems = newItems.map(item => {
      // 링크서명은 'bulk'만 처리 (기존: _id || 'bulk')
      if (item.uid === 'bulk') {
        if (item.type === TYPE_SIGN) {
          item.movable = true;
          item.resizable = true;
        } else {
          item.movable = false;
          item.resizable = false;
          item.disableOptions = true;
        }

        // 자동 입력 처리 (링크서명용 데이터 사용)
        if (item.autoInput) {
          if (item.autoInput === AUTO_NAME) {
            item.lines = [signerName];  // 본인인증에서 받은 이름
          } else if (item.autoInput === AUTO_JOBTITLE) {
            item.lines = [''];
          } else if (item.autoInput === AUTO_OFFICE) {
            item.lines = [''];
          } else if (item.autoInput === AUTO_DEPART) {
            item.lines = [''];
          } else if (item.autoInput === AUTO_SABUN) {
            item.lines = [''];
          } else if (item.autoInput === AUTO_DATE) {
            item.lines = [moment().format('YYYY년 MM월 DD일')];
          }
        }
      } else {
        // 기존과 동일한 다른 uid 처리
        item.disable = true;
        item.borderColor = 'transparent';
        
        if ((item.type === (TYPE_SIGN || TYPE_IMAGE)) && !item.payload) {
          item.hidden = true;
        }
        if (item.type === TYPE_TEXT || item.type === TYPE_DROPDOWN) {
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

  // 기존과 동일한 fetchSigns (외부 사용자용)
  const fetchSigns = async () => {
    // 외부 사용자는 기존 서명 목록이 없으므로 빈 배열
    setSignList([]);
    if (pdfRef.current) {
      pdfRef.current.setSigns([]);
    }
  }

  const signCard = (sign) => {
    return <CheckCard key={uuidv4()} style={{width:'auto', height: 'auto'}} value={sign.signData} avatar={sign.signData} className="customSignCardCSS"/>
  }

  // 링크서명용 완료 처리 (기존 send 함수 수정)
  const send = async () => {
    const pageCount = await pdfRef.current.getPageCount();
    const exportItems = await pdfRef.current.exportItems();

    console.log('pageCount', pageCount);
    console.log('exportItems', exportItems);

    // 기존과 동일한 방식으로 updateItems 필터링
    let updateItems = [];
    exportItems.forEach(item => {
      if (item.uid === 'bulk') { // 링크서명은 'bulk'만
        updateItems.push(item);
      } else {
        if (documentData.items.filter(el => el.id === item.id).length < 1) {
          updateItems.push(item);
        }
      }      
    })

    console.log('updateItems', updateItems);

    setLoading(true);

    // 링크서명 완료 API 호출 (기존과 다른 부분)
    let param = {
      linkId: linkId,
      signerName: signerName,
      signerPhone: signerPhone,
      signedItems: updateItems
    }
    console.log("link sign param:", param)

    try {
      const res = await axios.post('/api/link/completeSign', param)
      if (res.data.success) {
        setLoading(false);
        
        // 링크서명 완료 메시지
        Modal.success({
          title: '서명 완료',
          content: (
            <div>
              <p>서명이 성공적으로 완료되었습니다.</p>
              <p>서명자: {signerName}</p>
              <p>연락처: {signerPhone}</p>
              <p>완료 시간: {moment().format('YYYY년 MM월 DD일 HH:mm')}</p>
            </div>
          ),
          onOk: () => {
            window.close();
          }
        });
      } else {
        if (res.data.message) {
          alert(res.data.message);
        }
        console.log("sign error:", res.data.message)
        setLoading(false);
      } 
    } catch (error) {
      console.log(error)
      setLoading(false);
      alert('서명 완료 중 오류가 발생했습니다.');
    }
  }

  // 기존과 동일한 handleItemChanged, handleValidationChanged
  const handleItemChanged = (action, item, validation) => {
    console.log(action, item);
  }

  const handleValidationChanged = (validation) => {
    console.log('handleValidationChanged called', validation);
    setDisableNext(!validation);
  }

  // 로딩 화면
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, fontSize: '16px' }}>
          문서를 불러오고 있습니다...
        </div>
      </div>
    );
  }

  // 기존 SignDocument.js UI 구조 그대로 (헤더만 링크서명용으로 수정)
  return (
    <div>
    <PageContainerStyle>
    <PageContainer  
      header={{
        title: documentData?.linkTitle || documentData?.docTitle || '링크 서명',
        ghost: true,
        breadcrumb: {
          routes: [],
        },
        extra: [
          <div key="signer" style={{ marginRight: '16px', color: '#666' }}>
            서명자: <strong>{signerName}</strong>
          </div>,
          <Button key="2" type="primary" loading={loading} onClick={() => send()} disabled={disableNext}>
            {textSign}
          </Button>,
        ],
      }}
      style={{height:`calc(100vh - 72px)`}}
    >
      <Spin tip="로딩중..." spinning={loading}>
      <PDFViewer 
        ref={pdfRef} 
        isUpload={false} 
        isSave={false} 
        isEditing={false}
        readOnly={false}           // 추가
        editMode={false}           // 추가  
        mode="sign"               // 추가
        signMode={true}           // 추가
        disableEdit={true}        // 추가
        enableEdit={false}        // 추가
        onItemChanged={handleItemChanged} 
        onValidationChanged={handleValidationChanged}  
        defaultScale={1.0} 
        headerSpace={128}
        onReady={(instance) => {   // 추가
            setWebViewInstance(instance);
            
            // 강제로 서명모드 설정
            setTimeout(() => {
            if (instance && instance.UI) {
                const { UI, Core } = instance;
                const { documentViewer } = Core;
                
                // 모든 편집 도구 비활성화
                UI.disableElements([
                'toolbarGroup-Edit',
                'toolbarGroup-Insert', 
                'toolbarGroup-Annotate',
                'editButton',
                'insertButton'
                ]);
                
                // 서명 도구만 활성화
                UI.enableElements(['signatureButton']);
                
                // 강제로 서명 모드 설정
                const signTool = documentViewer.getTool('AnnotationCreateSignature');
                documentViewer.setToolMode(signTool);
                
                console.log('🔥 강제 서명모드 설정 완료');
            }
            }, 3000);
        }}
        />
      </Spin>

      {/* 기존과 동일한 서명 모달 */}
      <Modal
        visible={signModal}
        width={450}
        title="직접서명 또는 서명선택"
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
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

    </PageContainer> 
    </PageContainerStyle>
    </div>
  );
};

export default LinkSignDocument;