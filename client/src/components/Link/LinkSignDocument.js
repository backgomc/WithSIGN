// client/src/components/Link/LinkSignDocument.js
// 기존 WithSIGN 패턴을 따른 링크서명 문서 화면

import React, { useState, useEffect, useRef } from 'react';
import { useParams, navigate } from '@reach/router';
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
import SignaturePad from 'react-signature-canvas';
import { v4 as uuidv4 } from 'uuid';
import loadash from 'lodash';
import {TYPE_SIGN, TYPE_TEXT, AUTO_NAME, AUTO_DATE} from '../../common/Constants';

const { Title, Text } = Typography;

const LinkSignDocument = (props) => {
  const { linkId } = useParams();
  
  // 링크에서 전달된 정보 (LinkAccess에서 인증 완료 후)
  const linkInfo = props.location?.state?.linkInfo;
  const verified = props.location?.state?.verified;
  const signerName = props.location?.state?.signerName || '';
  const signerPhone = props.location?.state?.signerPhone || '';

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [disableComplete, setDisableComplete] = useState(true);

  // 서명 관련 상태
  const [signModal, setSignModal] = useState(false);
  const [webViewInstance, setWebViewInstance] = useState(null);

  // PDF 뷰어 ref
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
        
        // PDF 뷰어 초기화
        setTimeout(() => {
          initializePDFViewer(documentData);
        }, 100);
      } else {
        throw new Error(response.data.message || '문서를 불러올 수 없습니다.');
      }
      
    } catch (error) {
      message.error('문서 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // PDF 뷰어 초기화 (기존 WithSIGN의 initWithPDF 패턴)
  const initializePDFViewer = async (document) => {
    try {
      if (pdfRef.current) {
        // PDF 로드
        if (document.docRef) {
          const rootPath = `/${document.docRef}`;
          await pdfRef.current.uploadPDF(rootPath);
        }
        
        // 서명 항목들 전처리 및 로드 (기존 WithSIGN 패턴)
        if (document.items && document.items.length > 0) {
          let newItems = loadash.cloneDeep(document.items);
          
          let processedItems = newItems.map(item => {
            if (item.uid === 'bulk') {
              // 서명 항목 설정
              if (item.type === TYPE_SIGN) {
                item.movable = true;
                item.resizable = true;
                item.required = true;
              } else {
                item.movable = false;
                item.resizable = false;
                item.disableOptions = true;
              }

              // 자동 입력 필드 처리
              if (item.autoInput) {
                if (item.autoInput === AUTO_NAME) {
                  item.lines = [signerName];
                } else if (item.autoInput === AUTO_DATE) {
                  item.lines = [moment().format('YYYY년 MM월 DD일')];
                }
              }
            } else {
              // 다른 uid의 항목들은 숨김 처리 (기존 WithSIGN 패턴)
              item.disable = true;
              item.borderColor = 'transparent';
              item.hidden = true;
            }
            return item;
          });

          await pdfRef.current.importItems(processedItems);
        }

        // 서명 목록 초기화 (외부 사용자는 빈 목록)
        pdfRef.current.setSigns([]);
      }
    } catch (error) {
      message.error('문서 뷰어 초기화에 실패했습니다.');
    }
  };

  // 서명 항목 변경 시 호출 (기존 WithSIGN 패턴 - 로깅만)
  const handleItemChanged = (action, item, validation) => {
    // 기존 WithSIGN처럼 로깅만 하고 버튼 상태는 건드리지 않음
    console.log(action, item);
  };

  // 유효성 검사 변경 시 호출 (기존 WithSIGN 패턴)
  const handleValidationChanged = (validation) => {
    setDisableComplete(!validation);
  };

  // 서명 모달 관련 함수들 (기존 WithSIGN 패턴)
  const clear = () => {
    sigCanvas.current.clear();
    let chkObj = document.getElementsByClassName('ant-pro-checkcard-checked');
    if (chkObj && chkObj[0]) chkObj[0].click();
  };

  const handleSignOk = async () => {
    if (!sigCanvas.current.isEmpty() && webViewInstance) {
      const { Core, UI } = webViewInstance;
      const { documentViewer } = Core;
      const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
      await signatureTool.setSignature(sigCanvas.current.toDataURL('image/png'));
      signatureTool.addSignature();
      UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
    }
    setSignModal(false);
    clear();
  };

  const handleSignCancel = () => {
    if (webViewInstance) {
      const { UI } = webViewInstance;
      UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
    }
    setSignModal(false);
    clear();
  };

  // 서명 완료 처리 (기존 WithSIGN의 send 함수 패턴)
  const completeSign = async () => {
    try {
      setSigningLoading(true);

      // PDF에서 최종 서명 데이터 추출
      const exportItems = await pdfRef.current.exportItems();

      // 본인 컴포넌트만 업데이트 (기존 WithSIGN 패턴)
      let updateItems = [];
      exportItems.forEach(item => {
        if (item.uid === 'bulk') {
          updateItems.push(item);
        }
      });

      // 서명 완료 API 호출
      const response = await axios.post('/api/link/completeSign', {
        linkId: linkId,
        signerName: signerName,
        signerPhone: signerPhone,
        signedItems: updateItems
      });

      if (response.data.success) {
        message.success('서명이 완료되었습니다!');
        
        // 완료 메시지 표시 후 창 닫기 안내
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
      message.error('서명 완료 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSigningLoading(false);
    }
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
            disabled={disableComplete}
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

      {/* PDF 뷰어 영역 */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        background: '#f5f5f5'
      }}>
        {documentData ? (
          <div style={{ height: '100%', padding: '0' }}>
            <PDFViewer 
              ref={pdfRef} 
              isUpload={false} 
              isSave={false} 
              isEditing={false}
              onReady={(instance) => setWebViewInstance(instance)}
              onItemChanged={handleItemChanged}
              onValidationChanged={handleValidationChanged}
              defaultScale={1.0}
              headerSpace={0}
              style={{ height: '100%' }}
            />
          </div>
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#8c8c8c'
          }}>
            <FileTextOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
            <Title level={4} type="secondary">문서를 불러오는 중...</Title>
          </div>
        )}
      </div>

      {/* 서명 입력 모달 (기존 WithSIGN 패턴) */}
      <Modal
        visible={signModal}
        width={450}
        title="서명 입력"
        onOk={handleSignOk}
        onCancel={handleSignCancel}
        footer={[
          <Button key="clear" onClick={clear}>
            지우기
          </Button>,
          <Button key="submit" type="primary" loading={signingLoading} onClick={handleSignOk}>
            확인
          </Button>
        ]}
        bodyStyle={{padding: '0px 24px'}}
      >
        <div style={{padding: '20px 0px'}}>
          <SignaturePad 
            penColor='black' 
            ref={sigCanvas} 
            canvasProps={{
              className: 'signCanvas',
              style: {
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                width: '100%',
                height: '200px'
              }
            }} 
          />
          <div style={{
            position: 'relative',
            top: '-120px',
            textAlign: 'center',
            pointerEvents: 'none',
            color: '#bfbfbf',
            fontSize: '16px'
          }}>
            여기에 서명해주세요
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LinkSignDocument;