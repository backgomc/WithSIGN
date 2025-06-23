// client/src/components/Link/LinkSetting.js
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { 
  PageContainer, 
  ProCard 
} from '@ant-design/pro-components';
import { 
  Button, 
  Row, 
  Col, 
  Typography, 
  Divider, 
  Space, 
  Card, 
  Input, 
  InputNumber,
  Select, 
  Form,
  message,
  Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  LinkOutlined,
  QrcodeOutlined,
  SecurityScanOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import StepLinkWrite from './StepLinkWrite';
import { selectSendType, selectDocumentTitle, setDocumentTitle } from '../Assign/AssignSlice';
import { selectUser } from '../../app/infoSlice';

const { Title, Text } = Typography;

const LinkSetting = (props) => {
  const dispatch = useDispatch();
  const sendType = useSelector(selectSendType);
  const docTitle = useSelector(selectDocumentTitle);
  const user = useSelector(selectUser);
  const { _id, name } = user;
  
  // 로컬 docTitle state 추가
  const [localDocTitle, setLocalDocTitle] = useState(docTitle);

  // 전달받은 데이터
  const { attachFiles, documentFile, items } = props.location?.state || {};

  // 폼 상태
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [expiryDays, setExpiryDays] = useState(14);
  const [passwordHint, setPasswordHint] = useState('');
  const [selectedApprover, setSelectedApprover] = useState(null);

  // 임시 승인자 목록 (실제로는 API에서 가져와야 함)
  const [approvers] = useState([
    { value: 'manager1', label: '김부장 (개발팀 부장)' },
    { value: 'manager2', label: '이차장 (기획팀 차장)' },
    { value: 'manager3', label: '박과장 (보안팀 과장)' }
  ]);

  useEffect(() => {
    // 기본값 설정
    form.setFieldsValue({
      expiryDays: 14,
      accessPassword: '',
      passwordHint: ''
    });
    setAccessPassword('');
    setExpiryDays(14);
  }, [form]);

  // 패스워드 가시성 토글
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // 이전 단계로
  const handlePrevious = () => {
    navigate('/prepareLinkDocument', { 
      state: { 
        attachFiles, 
        documentFile,
        // 🔥 3단계에서 받은 PDF 데이터들 그대로 전달
        savedPdfItems: props.location?.state?.savedPdfItems,
        savedPageCount: props.location?.state?.savedPageCount,
        savedThumbnail: props.location?.state?.savedThumbnail,
        savedBoxData: props.location?.state?.savedBoxData
      } 
    });
  };

  // 링크 생성 (다음 단계)
  const handleCreateLink = async () => {
    try {
      // 수동 검증
      let hasError = false;
      
      // 접근 암호 검증
      if (!accessPassword || accessPassword.trim() === '') {
        message.error('접근 암호를 입력해주세요.');
        hasError = true;
      } else if (accessPassword.length < 6) {
        message.error('접근 암호는 최소 6자 이상이어야 합니다.');
        hasError = true;
      } else if (accessPassword.length > 20) {
        message.error('접근 암호는 최대 20자 이하로 설정해주세요.');
        hasError = true;
      }
      
      // 책임자 선택 검증
      if (!selectedApprover) {
        message.error('책임자를 선택해주세요.');
        hasError = true;
      }
      
      // 유효기간 검증
      if (!expiryDays || expiryDays < 1 || expiryDays > 365) {
        message.error('유효기간을 올바르게 입력해주세요.');
        hasError = true;
      }
      
      if (hasError) {
        return;
      }

      setLoading(true);

      // TODO: API 호출로 링크서명 생성
      const linkData = {
        user: _id,
        docTitle: localDocTitle,
        accessPassword: accessPassword,
        passwordHint: passwordHint,
        expiryDays: expiryDays,
        approver: selectedApprover,
        items: items,
        attachFiles: attachFiles,
        documentFile: documentFile
      };

      console.log('링크서명 생성 데이터:', linkData);
      
      // 임시로 성공 처리
      setTimeout(() => {
        setLoading(false);
        message.success('링크서명이 생성되었습니다!');
        
        // TODO: 링크/QR코드 생성 팝업 표시
        // 일단은 링크서명 목록으로 이동
        navigate('/linkList');
      }, 1000);

    } catch (error) {
      console.error('링크 생성 실패:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <PageContainer
        header={{
          title: <Typography.Title 
            editable={{
              onChange: (text) => {
                if (text === '') return false;
                dispatch(setDocumentTitle(text));
                setLocalDocTitle(text);
              }, 
              tooltip: false
            }} 
            level={5} 
            style={{ margin: 0 }}
          >
            {localDocTitle}
          </Typography.Title>,
          ghost: true,
          breadcrumb: { routes: [] },
          extra: [
            <Button 
              key="prev" 
              icon={<ArrowLeftOutlined />} 
              onClick={handlePrevious}
            ></Button>,
            <Button 
              key="create" 
              icon={<LinkOutlined />} 
              type="primary" 
              loading={loading}
              onClick={handleCreateLink}
            >
              링크 생성
            </Button>
          ]
        }}
        content={
            <ProCard style={{ background: '#ffffff' }} layout="center">
              <StepLinkWrite current={2} documentFile={documentFile} attachFiles={attachFiles} location={props.location} />
            </ProCard>
        }
      >
        <Row gutter={[32, 24]} style={{ alignItems: 'stretch' }}>
          {/* 왼쪽 설정 영역 */}
          <Col xs={24} lg={12} style={{ display: 'flex' }}>
            <Card title="서명 설정" bordered={false} style={{ width: '100%' }}>
              <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                initialValues={{
                  expiryDays: 14,
                  passwordHint: ''
                }}
              >
                {/* 서명 유효기간 설정 */}
                <Form.Item
                  label="서명 유효기간 설정"
                  name="expiryDays"
                  rules={[
                    { required: true, message: '유효기간을 입력해주세요.' },
                    { type: 'number', min: 1, max: 365, message: '1일 이상 365일 이하로 설정해주세요.' }
                  ]}
                  style={{ marginBottom: '20px' }}
                >
                  <InputNumber 
                    style={{ width: '100%' }}
                    placeholder="유효기간 입력"
                    min={1}
                    max={365}
                    value={expiryDays}
                    onChange={(value) => setExpiryDays(value)}
                    addonAfter="일"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                  />
                  <div style={{ marginTop: '8px', paddingLeft: '11px', color: '#8c8c8c', fontSize: '14px' }}>
                    이 서명은 {expiryDays}일 이내에 완료하지 않으면 자동으로 폐기됩니다. (기본값: 14일)
                  </div>
                </Form.Item>

                <Divider />

                {/* 접근 암호 설정 */}
                <Form.Item
                  label="접근 암호 설정"
                  name="accessPassword"
                  rules={[
                    { required: true, message: '접근 암호는 필수입니다.' },
                    { min: 6, message: '접근 암호는 최소 6자 이상이어야 합니다.' },
                    { max: 20, message: '접근 암호는 최대 20자 이하로 설정해주세요.' }
                  ]}
                  validateStatus={passwordError ? 'error' : ''}
                  help={passwordError}
                  style={{ marginBottom: '20px' }}
                >
                  <Input.Group compact style={{ display: 'flex', alignItems: 'center' }}>
                    <Input
                      style={{ flex: 1 }}
                      type={passwordVisible ? 'text' : 'password'}
                      value={accessPassword}
                      onChange={(e) => {
                        const filtered = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
                        setAccessPassword(filtered);
                        form.setFieldsValue({ accessPassword: filtered });
                        
                        // 실시간 검증
                        if (filtered.length === 0) {
                          setPasswordError('접근 암호는 필수입니다.');
                        } else if (filtered.length < 6) {
                          setPasswordError('접근 암호는 최소 6자 이상이어야 합니다.');
                        } else {
                          setPasswordError('');
                        }
                      }}
                      onKeyDown={(e) => {
                        // 한글 및 특수문자 입력 방지 (영문/숫자만 허용)
                        if (e.key.length === 1 && !/[a-zA-Z0-9]/.test(e.key) && 
                            e.key !== 'Backspace' && e.key !== 'Delete' && 
                            e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && 
                            e.key !== 'Home' && e.key !== 'End' && 
                            !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="영문/숫자만 6자 이상 20자 이하로 입력해주세요"
                      maxLength={20}
                    />
                    <Button
                      style={{
                        width: '90px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      type="primary"
                      icon={passwordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={togglePasswordVisibility}
                    >
                      {passwordVisible ? '숨기기' : '암호 보기'}
                    </Button>
                  </Input.Group>
                  <div style={{ marginTop: '8px', paddingLeft: '11px', color: '#8c8c8c', fontSize: '14px' }}>
                    서명자가 링크 접근 시 입력해야 하는 암호입니다.
                  </div>
                </Form.Item>

                {/* 접근 암호 힌트 */}
                <Form.Item
                  label="접근 암호 힌트 (선택사항)"
                  name="passwordHint"
                  style={{ marginBottom: '20px' }}
                >
                  <Input
                    value={passwordHint}
                    onChange={(e) => setPasswordHint(e.target.value)}
                    placeholder="예: 회사 설립연도 4자리"
                    maxLength={50}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                  />
                  <div style={{ marginTop: '8px', paddingLeft: '11px', color: '#8c8c8c', fontSize: '14px' }}>
                    서명자가 암호를 쉽게 기억할 수 있도록 힌트를 제공할 수 있습니다.
                  </div>
                </Form.Item>

                {/* 암호 관련 안내사항 */}
                <Alert
                  message="접근 암호 안내사항"
                  description={
                    <div>
                      • 접근 암호를 서명자에게 미리 전달해주세요.<br/>
                      • 암호는 링크 생성 후 변경할 수 없습니다.<br/>
                      • 암호를 분실한 경우 새로운 링크를 생성해야 합니다.<br/>
                      • 보안을 위해 복잡한 암호를 설정하는 것을 권장합니다.
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 0 }}
                />
              </Form>
            </Card>
          </Col>

          {/* 오른쪽 승인 및 요약 영역 */}
          <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 책임자 승인 선택 */}
            <Card title="책임자 승인 선택" bordered={false} style={{ marginBottom: 24, flex: 1 }}>
              <Form.Item
                label="승인 책임자"
                extra="외부 링크서명을 위한 내부 통제자를 지정해주세요."
              >
                <Select
                  placeholder="책임자를 선택해주세요"
                  value={selectedApprover}
                  onChange={setSelectedApprover}
                  options={approvers}
                  style={{ width: '100%' }}
                  allowClear={false}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                />
              </Form.Item>
            </Card>

            {/* 설정 요약 */}
            <Card title="설정 요약" bordered={false} style={{ flex: 1, backgroundColor: '#ffffff' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text><strong>문서명:</strong> {localDocTitle}</Text>
                <Text><strong>요청자:</strong> {name}</Text>
                <Text><strong>유효기간:</strong> {expiryDays}일</Text>
                <Text><strong>접근암호:</strong> {
                  accessPassword ? 
                    (passwordVisible ? accessPassword : accessPassword.replace(/./g, '●')) : 
                    '미입력'
                }</Text>
                {passwordHint && <Text><strong>암호힌트:</strong> {passwordHint}</Text>}
                <Text><strong>승인자:</strong> {
                  approvers.find(a => a.value === selectedApprover)?.label || 
                  <span style={{ color: '#ff4d4f' }}>미선택</span>
                }</Text>
                <Divider style={{ margin: '12px 0' }} />
                <Alert
                  message="서명 접근 절차"
                  description="서명자는 접근 암호를 입력한 다음 휴대폰 본인인증을 완료해야만 문서 열람 및 서명이 가능합니다."
                  type="success"
                  showIcon
                  style={{ fontSize: '12px' }}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </PageContainer>
    </div>
  );
};

export default LinkSetting;