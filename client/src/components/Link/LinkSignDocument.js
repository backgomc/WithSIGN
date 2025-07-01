// client/src/components/Link/LinkSignDocument.js
// 기존 코드와 완전히 독립적인 외부 서명자용 서명 화면

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

      // 임시로 linkInfo를 documentData로 사용 (나중에 실제 API로 교체)
      const tempDocumentData = {
        _id: linkInfo._id,
        linkTitle: linkInfo.linkTitle,
        docTitle: linkInfo.docTitle,
        items: [], // 서명 항목들 (실제로는 API에서 가져와야 함)
        // docRef: 실제 PDF 파일 경로 (실제로는 API에서 가져와야 함)
      };
      
      setDocumentData(tempDocumentData);
      
      // PDF 뷰어 초기화는 실제 PDF 파일이 있을 때 수행
      // setTimeout(() => {
      //   initializePDFViewer(tempDocumentData);
      // }, 100);
      
    } catch (error) {
      console.error('문서 로드 오류:', error);
      message.error('문서 로드 중 오류가 발생했습니다.');
      navigate(`/sign/link/${linkId}`);
    } finally {
      setLoading(false);
    }
  };

  // PDF 뷰어 초기화 (실제 PDF 파일이 있을 때 사용)
  const initializePDFViewer = async (document) => {
    try {
      if (pdfRef.current && document.docRef) {
        // PDF 로드
        await pdfRef.current.uploadPDF(document.docRef);
        
        // 서명 항목들 로드
        if (document.items && document.items.length > 0) {
          await pdfRef.current.importItems(document.items);
        }
      }
    } catch (error) {
      console.error('PDF 뷰어 초기화 오류:', error);
      message.error('문서 뷰어 초기화에 실패했습니다.');
    }
  };

  // 서명 항목 변경 시 호출
  const handleItemChanged = (action, item, validation) => {
    console.log('서명 항목 변경:', action, item);
    // setDisableComplete(!validation);
  };

  // 유효성 검사 변경 시 호출
  const handleValidationChanged = (validation) => {
    console.log('유효성 검사 결과:', validation);
    // setDisableComplete(!validation);
  };

  // 서명 완료 시작 (임시로 모달만 표시)
  const startCompleteSign = () => {
    setShowSignerInfoModal(true);
  };

  // 뒤로 가기
  const goBack = () => {
    navigate(`/sign/link/${linkId}`);
  };

  // 서명 완료 처리 (임시 구현)
  const completeSign = async () => {
    if (!signerName.trim() || !signerPhone.trim()) {
      message.error('서명자 이름과 연락처를 입력해주세요.');
      return;
    }

    try {
      setSigningLoading(true);

      // 임시로 성공 처리
      message.success('서명이 완료되었습니다!');
      setShowSignerInfoModal(false);
      
      // 완료 페이지로 이동 (나중에 구현)
      setTimeout(() => {
        message.info('서명 완료! 이 창을 닫으셔도 됩니다.');
      }, 1000);
      
    } catch (error) {
      console.error('서명 완료 오류:', error);
      message.error('서명 완료 중 오류가 발생했습니다.');
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

  // 메인 서명 화면 (기존 WithSIGN 레이아웃 없이 독립적)
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fff'
    }}>
      {/* 상단 헤더 (간단한 헤더) */}
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
            disabled={false} // 임시로 항상 활성화
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
          모든 필수 서명이 완료되면 "서명 완료" 버튼을 클릭하세요.
        </Text>
      </div>

      {/* PDF 뷰어 영역 */}
      <div style={{ 
        flex: 1, 
        padding: '24px',
        overflow: 'auto',
        background: '#f5f5f5'
      }}>
        <Card style={{ height: '100%', minHeight: '600px' }}>
          {/* 임시 내용 - 실제로는 PDF 뷰어가 들어갈 자리 */}
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#8c8c8c'
          }}>
            <FileTextOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
            <Title level={4} type="secondary">문서 뷰어</Title>
            <Text type="secondary">
              실제 PDF 문서가 여기에 표시됩니다.<br/>
              현재는 API 연동 전 임시 화면입니다.
            </Text>
          </div>
          
          {/* 실제 PDF 뷰어 (나중에 활성화)
          <Spin tip="처리 중..." spinning={loading}>
            <PDFViewer 
              ref={pdfRef} 
              isUpload={false} 
              isSave={false} 
              isEditing={true}
              onItemChanged={handleItemChanged}
              onValidationChanged={handleValidationChanged}
              defaultScale={1.0}
              headerSpace={0}
            />
          </Spin>
          */}
        </Card>
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