// client/src/components/Link/LinkSignDocument.js
// 기존 SignDocument.js 베이스로 링크서명 전용 수정

import React, { useState, useEffect, useRef } from 'react';
import { useParams, navigate } from '@reach/router';
import SignaturePad from 'react-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import { 
  Button, 
  message, 
  Typography, 
  Spin,
  Modal,
  Space
} from 'antd';
import { 
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/ko';
import PDFViewer from "@niceharu/withpdf";
import { CheckCard } from '@ant-design/pro-card';
import loadash from 'lodash';
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_CHECKBOX, TYPE_DROPDOWN, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';

const { Title, Text } = Typography;

const LinkSignDocument = (props) => {
  const { linkId } = useParams();
  
  // 링크에서 전달된 정보 (LinkAccess에서 인증 완료 후)
  const linkInfo = props.location?.state?.linkInfo;
  const verified = props.location?.state?.verified;
  const signerName = props.location?.state?.signerName || '';
  const signerPhone = props.location?.state?.signerPhone || '';

  // 기존 SignDocument.js와 동일한 상태들
  const [loading, setLoading] = useState(false);
  const [disableNext, setDisableNext] = useState(true);
  const [signList, setSignList] = useState([]);
  const [signModal, setSignModal] = useState(false);
  const [webViewInstance, setWebViewInstance] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [signingLoading, setSigningLoading] = useState(false);

  // 기존과 동일한 refs
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
        const documentData = response.data.document;
        setDocumentData(documentData);
        
        // 기존 방식으로 초기화
        setTimeout(() => {
          initWithPDF(documentData);
        }, 100);
      } else {
        throw new Error(response.data.message || '문서를 불러올 수 없습니다.');
      }
      
    } catch (error) {
      console.error('문서 로드 오류:', error);
      message.error('문서 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기존 SignDocument.js의 initWithPDF를 링크서명용으로 수정
  const initWithPDF = async (document) => {
    try {
      // PDF 로드 (루트 경로로)
      const rootPath = `/${document.docRef}`;
      await pdfRef.current.uploadPDF(rootPath);

      // 기존과 동일한 방식으로 items 처리
      console.log('items', document.items);
      let newItems = loadash.cloneDeep(document.items);

      let renewItems = newItems.map(item => {
        // 링크서명은 uid='bulk'만 처리 (기존은 _id || 'bulk')
        if (item.uid === 'bulk') {
          if (item.type === TYPE_SIGN) {
            item.movable = true;
            item.resizable = true;
          } else {
            item.movable = false;
            item.resizable = false;
            item.disableOptions = true;
          }

          // 자동 입력 처리 (본인인증 정보 사용)
          if (item.autoInput) {
            if (item.autoInput === AUTO_NAME) {
              item.lines = [signerName];
            } else if (item.autoInput === AUTO_DATE) {
              item.lines = [moment().format('YYYY년 MM월 DD일')];
            }
          }
        } else {
          // 다른 uid 항목들은 숨김 (기존과 동일)
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
      });

      await pdfRef.current.importItems(renewItems);

      // 서명 목록 설정 (외부 사용자는 빈 목록)
      pdfRef.current.setSigns([]);
    } catch (error) {
      console.error('PDF 초기화 오류:', error);
      message.error('문서 뷰어 초기화에 실패했습니다.');
    }
  };

  // 기존 SignDocument.js와 동일한 서명 관련 함수들
  const clear = () => {
    sigCanvas.current.clear();
    let chkObj = document.getElementsByClassName('ant-pro-checkcard-checked');
    if (chkObj && chkObj[0]) chkObj[0].click();
  };
  
  const handleOk = async () => {
    if (webViewInstance) {
      const { Core, UI } = webViewInstance;
      const { documentViewer } = Core;
      if (!sigCanvas.current.isEmpty()) {
        const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
        await signatureTool.setSignature(sigCanvas.current.toDataURL('image/png'));
        signatureTool.addSignature();
      }
      UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
    }
    setSignModal(false);
    clear();
  };

  const handleCancel = () => {
    if (webViewInstance) {
      const { Core, UI } = webViewInstance;
      UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
    }
    setSignModal(false);
    clear();
  };

  // 기존과 동일한 검증 함수들
  const handleItemChanged = (action, item, validation) => {
    console.log(action, item);
  };

  const handleValidationChanged = (validation) => {
    console.log('handleValidationChanged called', validation);
    setDisableNext(!validation);
  };

  // 서명 완료 처리
  const completeSign = async () => {
    try {
      setSigningLoading(true);

      const pageCount = await pdfRef.current.getPageCount();
      const exportItems = await pdfRef.current.exportItems();

      console.log('exportItems', exportItems);

      // 기존과 동일한 방식으로 updateItems 필터링
      let updateItems = [];
      exportItems.forEach(item => {
        if (item.uid === 'bulk') {
          updateItems.push(item);
        }
      });

      console.log('updateItems', updateItems);

      // 서명 완료 API 호출
      const response = await axios.post('/api/link/completeSign', {
        linkId: linkId,
        signerName: signerName,
        signerPhone: signerPhone,
        signedItems: updateItems
      });

      if (response.data.success) {
        message.success('서명이 완료되었습니다!');
        
        setTimeout(() => {
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
        }, 1000);
      } else {
        throw new Error(response.data.message || '서명 완료에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('서명 완료 오류:', error);
      message.error('서명 완료 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSigningLoading(false);
    }
  };

  // 기존과 동일한 signCard 함수
  const signCard = (sign) => {
    return (
      <CheckCard 
        key={uuidv4()} 
        style={{width:'auto', height: 'auto'}} 
        value={sign.signData} 
        avatar={sign.signData} 
        className="customSignCardCSS"
      />
    );
  };

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

  // 메인 서명 화면
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fff'
    }}>
      {/* 상단 헤더 */}
      <div style={{ 
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff', fontSize: '20px' }} />
          <Title level={4} style={{ margin: 0, color: '#262626' }}>
            {documentData?.linkTitle || documentData?.docTitle || '링크 서명'}
          </Title>
        </div>
        
        <Space>
          <div style={{ marginRight: '16px', color: '#666' }}>
            서명자: <strong>{signerName}</strong>
          </div>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            disabled={disableNext}
            loading={signingLoading}
            onClick={completeSign}
          >
            서명 완료
          </Button>
        </Space>
      </div>

      {/* 안내 메시지 */}
      <div style={{ 
        padding: '12px 24px', 
        backgroundColor: '#f6f8fa', 
        borderBottom: '1px solid #e8e8e8'
      }}>
        <Text style={{ color: '#666' }}>
          💡 문서의 서명 필드를 클릭하여 서명을 입력해주세요. 
          모든 필수 서명이 완료되면 "서명 완료" 버튼이 활성화됩니다.
        </Text>
      </div>

      {/* PDF 뷰어 영역 - 기존과 동일한 설정 */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        background: '#f5f5f5'
      }}>
        <Spin tip="로딩중..." spinning={loading}>
          <PDFViewer 
            ref={pdfRef} 
            isUpload={false} 
            isSave={false} 
            isEditing={false}
            onItemChanged={handleItemChanged}
            onValidationChanged={handleValidationChanged}
            defaultScale={1.0}
            headerSpace={128}
            onReady={(instance) => setWebViewInstance(instance)}
          />
        </Spin>
      </div>

      {/* 기존 SignDocument.js와 동일한 서명 모달 */}
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
        <div style={{padding: '20px 0px'}}>
          <SignaturePad 
            penColor='black' 
            ref={sigCanvas} 
            canvasProps={{className: 'signCanvas'}} 
          />
          <div className="signBackground">
            <div className="signHereText">직접서명 또는 서명선택</div>
          </div>
        </div>
        
        <CheckCard.Group 
          style={{
            width: '100%', 
            margin: '0px', 
            padding: '0px', 
            whiteSpace: 'nowrap', 
            overflow: 'auto', 
            textAlign: 'center'
          }}
          onChange={(value) => {
            sigCanvas.current.clear();
            if (value) sigCanvas.current.fromDataURL(value);
          }}
        >
          {signList.map((sign) => signCard(sign))}
        </CheckCard.Group>
      </Modal>
    </div>
  );
};

export default LinkSignDocument;