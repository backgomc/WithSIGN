// client/src/components/Link/LinkInfoModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, Divider, message } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';

const { Text, Paragraph } = Typography;

const LinkInfoModal = ({ 
  visible, 
  onClose, 
  linkUrl, 
  accessPassword, 
  expiryDays,
  expiryDate,
  title = "링크서명 생성 완료"
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // 모달 닫기 처리 (애니메이션 고려)
  const handleClose = () => {
    setIsClosing(true);
    // 애니메이션 시간(300ms) 후에 실제 닫기
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // QR코드 생성 함수
  const generateQRCode = async (text) => {
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 160,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      return dataUrl;
    } catch (error) {
      console.error('QR코드 생성 실패:', error);
      return '';
    }
  };

  // 모달이 열릴 때 QR코드 생성 및 closing 상태 리셋
  useEffect(() => {
    if (visible && linkUrl) {
      setIsClosing(false); // 모달이 열릴 때 closing 상태 리셋
      generateQRCode(linkUrl).then(setQrCodeDataUrl);
    }
  }, [visible, linkUrl]);

  // QR코드 다운로드 함수
  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `링크서명_QR코드.png`;
      link.href = qrCodeDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px', marginRight: '8px' }} />
          {title}
        </div>
      }
      open={visible && !isClosing}
      onCancel={handleClose}
      footer={null}
      width={530}
      centered={true}
      destroyOnClose={true}
      style={{ borderRadius: '12px' }}
      bodyStyle={{ borderRadius: '12px' }}
    >
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <Space direction="vertical" size="medium" style={{ width: '100%' }}>

          {/* QR 코드 */}
          <div style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '16px' }}>QR 코드</Text>
            <br />
            <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  style={{ width: '160px', height: '160px', border: '1px solid #d9d9d9' }}
                />
              ) : (
                <div style={{ 
                  width: '160px', 
                  height: '160px', 
                  border: '1px solid #d9d9d9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5'
                }}>
                  <Text type="secondary">QR 코드 생성 중...</Text>
                </div>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              모바일에서 QR코드를 스캔하여 서명할 수 있습니다.
            </Text>
            <br />
            <Button 
              type="link" 
              icon={<DownloadOutlined />}
              onClick={downloadQRCode}
              style={{ padding: 0, fontSize: '14px', marginTop: '8px' }}
            >
              QR코드 다운로드
            </Button>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* 링크 URL */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <Text strong style={{ fontSize: '16px' }}>서명 링크</Text>
              <Button 
                size="small" 
                icon={<ShareAltOutlined style={{ color: '#1890ff' }} />}
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  borderColor: '#d9d9d9', 
                  color: '#000000',
                  position: 'absolute', 
                  right: 0 
                }}
                onClick={() => message.info('위드로 보내기 기능은 준비 중입니다.')}
              >
                위드로 보내기
              </Button>
            </div>
            <div style={{ margin: '16px 0' }}>
              <Paragraph 
                copyable={{ 
                  text: linkUrl,
                  onCopy: () => message.success('링크가 복사되었습니다!')
                }}
                style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '6px',
                  wordBreak: 'break-all',
                  margin: 0,
                  fontSize: '14px'
                }}
              >
                {linkUrl}
              </Paragraph>
            </div>
          </div>

          {/* 안내사항 */}
          <div style={{ background: '#f0f6ff', padding: '16px', borderRadius: '6px', border: '1px solid #d6e4ff', marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>📋 안내사항</Text>
            </div>
            <Text style={{ fontSize: '14px', color: '#595959' }}>
              • 서명자에게 위 링크와 접근 암호를 전달해주세요.<br />
              • 링크는 {expiryDate ? new Date(expiryDate).toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'}) : `${expiryDays}일`}까지 유효하며, 만료 시 자동으로 비활성화됩니다.<br />
              • 서명 완료 시 관리자에게 알림이 발송됩니다.
            </Text>
          </div>

          {/* 확인 버튼 */}
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" onClick={handleClose}>
              확인
            </Button>
          </div>

        </Space>
      </div>
    </Modal>
  );
};

export default LinkInfoModal;