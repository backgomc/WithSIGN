// client/src/components/Link/LinkAccess.js
// 본인인증 정보 전달 기능 추가

import React, { useState, useEffect } from 'react';
import { useParams, navigate } from '@reach/router';
import { 
  Card, 
  Input, 
  Button, 
  Form, 
  message, 
  Typography, 
  Space, 
  Alert,
  Row,
  Col,
  Spin
} from 'antd';
import { 
  LockOutlined, 
  SafetyOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/ko';

const { Title, Text, Paragraph } = Typography;

const LinkAccess = () => {
  const { linkId } = useParams();
  
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [linkInfo, setLinkInfo] = useState(null);
  const [accessPassword, setAccessPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 링크체크, 2: 암호입력, 3: 본인인증, 4: 서명화면
  const [form] = Form.useForm();

  // 컴포넌트 마운트 시 링크 유효성 체크
  useEffect(() => {
    checkLinkAccess();
  }, [linkId]);

  // 링크 접속 가능 여부 체크
  const checkLinkAccess = async () => {
    try {
      setLoading(true);

      const response = await axios.post('/api/link/checkAccess', {
        linkId: linkId
      });

      if (response.data.success) {
        const link = response.data.link;
        setLinkInfo(link);

        // 링크 상태별 처리
        if (!link.isActive) {
          message.error('비활성화된 링크입니다.');
          return;
        }

        const now = new Date();
        const expiryDate = new Date(link.expiryDate);
        if (now > expiryDate) {
          message.error('만료된 링크입니다.');
          return;
        }

        // 정상적인 링크면 암호 입력 단계로
        setStep(2);
      } else {
        message.error(response.data.message || '링크에 접속할 수 없습니다.');
      }

    } catch (error) {
      console.error('링크 접속 체크 오류:', error);
      message.error('링크 접속 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 접근 암호 확인
  const verifyPassword = async () => {
    if (!accessPassword || accessPassword.trim() === '') {
      message.error('접근 암호를 입력해주세요.');
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await axios.post('/api/link/verifyPassword', {
        linkId: linkId,
        accessPassword: accessPassword.trim()
      });

      if (response.data.success) {
        message.success('접근 암호가 확인되었습니다!');
        setStep(3); // 본인인증 단계로
      } else {
        message.error(response.data.message || '접근 암호가 올바르지 않습니다.');
        setAccessPassword('');
        form.resetFields();
      }

    } catch (error) {
      console.error('접근 암호 확인 오류:', error);
      message.error('암호 확인 중 오류가 발생했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 본인인증 처리 (실제로는 휴대폰 인증 API 호출)
  const handlePhoneAuth = async () => {
    try {
      // 실제 본인인증 API 호출
      // const authResponse = await axios.post('/api/auth/phoneAuth', { ... });
      
      // 임시로 모의 본인인증 데이터 (실제로는 API에서 받아옴)
      const mockAuthResult = {
        success: true,
        name: "홍길동",           // 본인인증에서 받은 실명
        phone: "010-1234-5678",  // 본인인증에서 받은 휴대폰번호
        verified: true
      };

      if (mockAuthResult.success) {
        message.success('본인인증이 완료되었습니다!');
        
        // 서명 화면으로 이동 (본인인증 정보 전달)
        navigate(`/sign-document/${linkId}`, { 
          state: { 
            linkId: linkId,
            linkInfo: linkInfo,
            verified: true,
            signerName: mockAuthResult.name,    // 본인인증에서 받은 이름
            signerPhone: mockAuthResult.phone   // 본인인증에서 받은 휴대폰번호
          } 
        });
      } else {
        message.error('본인인증에 실패했습니다. 다시 시도해주세요.');
      }

    } catch (error) {
      console.error('본인인증 오류:', error);
      message.error('본인인증 중 오류가 발생했습니다.');
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ textAlign: 'center', minWidth: '300px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>링크 확인 중...</Text>
          </div>
        </Card>
      </div>
    );
  }

  // 2단계: 접근 암호 입력
  if (step === 2) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Row justify="center" style={{ width: '100%', maxWidth: '500px' }}>
          <Col span={24}>
            <Card 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)' 
              }}
            >
              {/* 헤더 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <SafetyOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={3} style={{ margin: 0, color: '#262626' }}>
                  보안 인증
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  문서 접근을 위해 암호를 입력해주세요
                </Text>
              </div>

              {/* 문서 정보 */}
              <Alert
                message={
                  <div>
                    <FileTextOutlined style={{ marginRight: '8px' }} />
                    <strong>{linkInfo?.linkTitle || linkInfo?.docTitle}</strong>
                  </div>
                }
                description={
                  <div>
                    만료일: {linkInfo?.expiryDate ? 
                      moment(linkInfo.expiryDate).format('YYYY년 MM월 DD일') : 
                      `${linkInfo?.expiryDays}일 후`
                    }
                  </div>
                }
                type="info"
                showIcon={false}
                style={{ 
                  marginBottom: '24px',
                  borderRadius: '8px',
                  backgroundColor: '#f6f8fa'
                }}
              />

              {/* 암호 입력 폼 */}
              <Form
                form={form}
                onFinish={verifyPassword}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="accessPassword"
                  label="접근 암호"
                  rules={[
                    { required: true, message: '접근 암호를 입력해주세요!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="접근 암호를 입력하세요"
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    onPressEnter={verifyPassword}
                    autoComplete="off"
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Item>

                {/* 암호 힌트 표시 */}
                {linkInfo?.passwordHint && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary">
                      <InfoCircleOutlined style={{ marginRight: '4px' }} />
                      힌트: {linkInfo.passwordHint}
                    </Text>
                  </div>
                )}

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={passwordLoading}
                    block
                    style={{ 
                      height: '48px', 
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    확인
                  </Button>
                </Form.Item>
              </Form>

              {/* 안내사항 */}
              <div style={{ 
                marginTop: '24px', 
                padding: '16px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '6px',
                border: '1px solid #e8e8e8'
              }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  <strong>안내사항</strong><br />
                  • 서명 담당자로부터 전달받은 접근 암호를 입력해주세요<br />
                  • 암호 입력 후 본인인증을 진행합니다<br />
                  • 문제가 있을 경우 서명 요청자에게 문의해주세요
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // 3단계: 본인인증
  if (step === 3) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Row justify="center" style={{ width: '100%', maxWidth: '500px' }}>
          <Col span={24}>
            <Card 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)' 
              }}
            >
              {/* 헤더 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                <Title level={3} style={{ margin: 0, color: '#262626' }}>
                  본인인증
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  서명을 위해 본인인증을 진행해주세요
                </Text>
              </div>

              {/* 접근 암호 확인 완료 */}
              <Alert
                message="접근 암호 확인 완료"
                description="이제 본인인증을 진행하여 서명자 정보를 확인합니다."
                type="success"
                showIcon
                style={{ marginBottom: '24px' }}
              />

              {/* 본인인증 버튼 */}
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handlePhoneAuth}
                  style={{ 
                    height: '56px', 
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  휴대폰 본인인증
                </Button>
                
                <Button
                  size="large"
                  block
                  disabled
                  style={{ 
                    height: '56px', 
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  공동인증서 (준비중)
                </Button>
              </Space>

              {/* 안내사항 */}
              <div style={{ 
                marginTop: '24px', 
                padding: '16px', 
                backgroundColor: '#f6ffed', 
                borderRadius: '6px',
                border: '1px solid #b7eb8f'
              }}>
                <Text style={{ fontSize: '14px', color: '#389e0d' }}>
                  <strong>본인인증 안내</strong><br />
                  • 서명을 위해서는 본인인증이 필수입니다<br />
                  • 휴대폰 인증을 통해 이름과 연락처를 확인합니다<br />
                  • 인증 정보는 서명 완료 후 안전하게 관리됩니다
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return null;
};

export default LinkAccess;