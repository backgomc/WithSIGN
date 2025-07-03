// client/src/components/Link/LinkSignDocument.js
// PDF 뷰어 연결 버전

import React, { useState, useEffect, useRef } from 'react';
import { useParams, navigate } from '@reach/router';
import { 
  Button, 
  message, 
  Typography, 
  Spin,
  Modal,
  Input,
  Card,
  Space
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/ko';
import PDFViewer from "@niceharu/withpdf";

const { Title, Text } = Typography;

const LinkSignDocument = (props) => {
  const { linkId } = useParams();
  
  // 링크에서 전달된 정보 (LinkAccess에서 인증 완료 후)
  const linkInfo = props.location?.state?.linkInfo;
  const verified = props.location?.state?.verified;

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [showSignerInfoModal, setShowSignerInfoModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [disableComplete, setDisableComplete] = useState(true);

  // PDF 뷰어 ref
  const pdfRef = useRef();

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

      // 실제 API 호출로 문서 데이터 가져오기
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
      console.error('문서 로드 오류:', error);
      message.error('문서 로드 중 오류가 발생했습니다.');
      
      // API가 없는 경우 임시 데이터로 테스트
      console.log('임시 데이터로 테스트 진행');
      const tempDocumentData = {
        _id: linkInfo._id,
        linkTitle: linkInfo.linkTitle,
        docTitle: linkInfo.docTitle,
        items: [], // 서명 항목들
        docRef: null, // PDF 파일 경로 (실제 파일이 있을 때)
      };
      
      setDocumentData(tempDocumentData);
    } finally {
      setLoading(false);
    }
  };

  // PDF 뷰어 초기화
  const initializePDFViewer = async (document) => {
    try {
        if (pdfRef.current) {
            console.log('🔍 PDF 뷰어 초기화 시작:', document);
            
            if (document.docRef) {
                console.log('📄 PDF 경로:', document.docRef);
                console.log('🌐 전체 URL:', `http://34.64.93.94:5001/${document.docRef}`);
                
                try {
                    // 절대 URL로 시도
                    const fullUrl = `http://34.64.93.94:5001/${document.docRef}`;
                    await pdfRef.current.uploadPDF(fullUrl);
                    console.log('✅ PDF 로드 성공 (전체 URL)');
                } catch (urlError) {
                    console.log('❌ 전체 URL 실패, 상대 경로 시도');
                    try {
                        await pdfRef.current.uploadPDF(document.docRef);
                        console.log('✅ PDF 로드 성공 (상대 경로)');
                    } catch (relativeError) {
                        console.error('❌ 모든 경로 시도 실패:', relativeError);
                        throw relativeError;
                    }
                }
            }
            
            // 서명 항목들 로드
            if (document.items && document.items.length > 0) {
                console.log('📝 서명 항목 로드:', document.items);
                await pdfRef.current.importItems(document.items);
            }
        }
    } catch (error) {
        console.error('💥 PDF 뷰어 초기화 오류:', error);
        message.error('문서 뷰어 초기화에 실패했습니다: ' + error.message);
    }
};

  // 서명 항목 변경 시 호출
  const handleItemChanged = (action, item, validation) => {
    console.log('서명 항목 변경:', action, item);
    // 실시간 유효성 검사 결과 반영
    setDisableComplete(!validation);
  };

  // 유효성 검사 변경 시 호출
  const handleValidationChanged = (validation) => {
    console.log('유효성 검사 결과:', validation);
    setDisableComplete(!validation);
  };

  // 서명 완료 시작
  const startCompleteSign = async () => {
    try {
      // PDF에서 최종 항목들 추출
      if (pdfRef.current) {
        const items = await pdfRef.current.exportItems();
        console.log('서명 완료 시 추출된 항목들:', items);
        
        // 모든 필수 서명이 완료되었는지 검사
        const hasEmptySignature = items.some(item => 
          item.type === 'SIGN' && (!item.value || item.value.trim() === '')
        );
        
        if (hasEmptySignature) {
          message.warning('모든 서명 항목을 완료해주세요.');
          return;
        }
      }
      
      setShowSignerInfoModal(true);
    } catch (error) {
      console.error('서명 완료 준비 오류:', error);
      message.error('서명 완료 준비 중 오류가 발생했습니다.');
    }
  };

  // 뒤로 가기
  const goBack = () => {
    navigate(`/sign/link/${linkId}`);
  };

  // 서명 완료 처리
  const completeSign = async () => {
    if (!signerName.trim() || !signerPhone.trim()) {
      message.error('서명자 이름과 연락처를 입력해주세요.');
      return;
    }

    try {
      setSigningLoading(true);

      // PDF에서 최종 서명 데이터 추출
      let signedItems = [];
      if (pdfRef.current) {
        signedItems = await pdfRef.current.exportItems();
      }

      // 서명 완료 API 호출
      const response = await axios.post('/api/link/completeSign', {
        linkId: linkId,
        signerName: signerName.trim(),
        signerPhone: signerPhone.trim(),
        signerEmail: signerEmail.trim(),
        signedItems: signedItems
      });

      if (response.data.success) {
        message.success('서명이 완료되었습니다!');
        setShowSignerInfoModal(false);
        
        // 완료 메시지 표시 후 창 닫기 안내
        setTimeout(() => {
          Modal.success({
            title: '서명 완료',
            content: '서명이 성공적으로 완료되었습니다. 이 창을 닫으셔도 됩니다.',
            onOk: () => {
              // 브라우저 탭 닫기 시도 (보안상 제한될 수 있음)
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
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={goBack}
          >
            뒤로가기
          </Button>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            disabled={disableComplete}
            onClick={startCompleteSign}
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
              isEditing={true}
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

      {/* 서명자 정보 입력 모달 */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            서명자 정보 입력
          </div>
        }
        open={showSignerInfoModal}
        onOk={completeSign}
        onCancel={() => setShowSignerInfoModal(false)}
        okText="서명 완료"
        cancelText="취소"
        confirmLoading={signingLoading}
        width={500}
        centered
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              <span style={{ color: '#ff4d4f' }}>*</span> 서명자 이름
            </label>
            <Input
              placeholder="실명을 입력해주세요"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              <span style={{ color: '#ff4d4f' }}>*</span> 연락처
            </label>
            <Input
              placeholder="휴대폰 번호를 입력해주세요"
              value={signerPhone}
              onChange={(e) => setSignerPhone(e.target.value)}
              maxLength={20}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              이메일 (선택)
            </label>
            <Input
              placeholder="이메일 주소를 입력해주세요"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              type="email"
            />
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f6ffed', 
            borderRadius: '6px',
            border: '1px solid #b7eb8f'
          }}>
            <Text style={{ fontSize: '14px', color: '#389e0d' }}>
              📋 입력하신 정보는 서명 기록으로만 사용되며, 서명 완료 후 안전하게 관리됩니다.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LinkSignDocument;