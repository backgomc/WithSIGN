// client/src/components/Link/LinkSetting.js
import React, { useEffect, useState } from 'react';
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
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import StepLinkWrite from './StepLinkWrite';
import { selectSendType, selectDocumentTitle, setDocumentTitle } from '../Assign/AssignSlice';
import { selectUser } from '../../app/infoSlice';
import axiosInterceptor from '../../config/AxiosConfig';
import LinkInfoModal from './LinkInfoModal';
import bcrypt from 'bcryptjs';

const { Text } = Typography;

// CSS 스타일 추가
const customStyles = `
  .ant-form-vertical .ant-form-item-label {
    padding: 0 0 4px !important;
  }
`;

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
  const [expiryDays, setExpiryDays] = useState(7);
  const [expiryDaysError, setExpiryDaysError] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [selectedApprover, setSelectedApprover] = useState(null);

  // 링크 생성 관련 상태
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkId, setLinkId] = useState('');
  const [expiryDate, setExpiryDate] = useState(null);

  // 승인자 목록
  const [approvers, setApprovers] = useState([]); // 빈 배열로 시작
  const [loadingApprovers, setLoadingApprovers] = useState(false);

  useEffect(() => {
    // 기본값 설정
    form.setFieldsValue({
      expiryDays: 7,
      accessPassword: '',
      passwordHint: ''
    });
    setAccessPassword('');
    setExpiryDays(7);

    // 팀원 목록 불러오기
    fetchTeamMembers();
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
        // 3단계에서 받은 PDF 데이터들 그대로 전달
        savedPdfItems: props.location?.state?.savedPdfItems,
        savedPageCount: props.location?.state?.savedPageCount,
        savedThumbnail: props.location?.state?.savedThumbnail,
        savedBoxData: props.location?.state?.savedBoxData
      } 
    });
  };

  // 🔥 여기에 팀원 조회 함수 추가!
  const fetchTeamMembers = async () => {
      setLoadingApprovers(true);
      
      try {
        const response = await axiosInterceptor.post('/api/link/teamMembers');
  
        if (response.data.success) {
          const teamOptions = response.data.teamMembers.map(member => ({
            value: member._id,
            label: `${member.name} (${member.JOB_TITLE || '직급없음'})`
          }));
  
          setApprovers(teamOptions);
  
          if (teamOptions.length === 0) {
            message.info('동일 팀에 승인 가능한 팀원이 없습니다.');
          }
        } else {
          message.error('팀원 목록을 불러오는데 실패했습니다: ' + response.data.message);
          setApprovers([]);
        }
      } catch (error) {
        console.error('팀원 조회 오류:', error);
        message.error('팀원 목록 조회 중 오류가 발생했습니다.');
        setApprovers([]);
      } finally {
        setLoadingApprovers(false);
      }
    };

  // 링크 생성 (실제 API 호출)
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

      // ✅ 접근 암호 암호화 처리 (추가된 부분)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(accessPassword, saltRounds);
    
      console.log('원본 암호:', accessPassword);
      console.log('암호화된 암호:', hashedPassword);      

      // 실제 API 호출
      const linkData = {
        linkTitle: localDocTitle,
        docTitle: localDocTitle,
        accessPassword: hashedPassword,
        passwordHint: passwordHint,
        expiryDays: expiryDays,
        approver: selectedApprover,
        items: JSON.stringify(items || []),
        docRef: props.location?.state?.docRef
      };
      
      const response = await axiosInterceptor.post('/api/link/addLink', linkData);
      
      setLoading(false);

      if (response.data.success) {
        // 성공 시 링크 정보 저장
        const newLinkId = response.data.linkId;
        const linkUrl = response.data.linkUrl;
        const expiryDate = response.data.expiryDate;
        
        setLinkId(newLinkId);
        setGeneratedLink(linkUrl);
        setExpiryDate(expiryDate);
        
        // 팝업만 표시 (navigate는 확인 버튼 누를 때까지 하지 않음)
        setShowLinkModal(true);
        
        message.success('링크서명이 성공적으로 생성되었습니다!');
      } else {
        message.error('링크서명 생성에 실패했습니다: ' + (response.data.message || '알 수 없는 오류'));
      }

    } catch (error) {
      console.error('링크 생성 실패:', error);
      setLoading(false);
      message.error('링크 생성 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  // 모달 닫기 함수 (확인 버튼)
  const handleModalConfirm = () => {
    setShowLinkModal(false);
    // 확인 버튼을 눌렀을 때 링크서명 목록으로 이동
    navigate('/linkList');
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
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
                initialValues={{
                  expiryDays: 7,
                  passwordHint: ''
                }}
              >
                {/* 서명 유효기간 설정 */}
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span> 서명 유효기간 설정</span>}
                  name="expiryDays"
                  validateStatus={expiryDaysError ? 'error' : ''}
                  style={{ marginBottom: '20px' }}
                >
                  <div style={{ marginLeft: '10px', marginBottom: '10px', color: '#8c8c8c', fontSize: '14px' }}>
                    이 서명은 {expiryDays || 0}일 이내에 완료하지 않으면 자동으로 폐기됩니다.
                  </div>
                  <InputNumber 
                    style={{ width: 'calc(100% - 20px)', marginLeft: '10px', marginRight: '10px' }}
                    placeholder="유효기간 입력"
                    min={1}
                    max={365}
                    value={expiryDays}
                    onChange={(value) => {
                      setExpiryDays(value);
                      form.setFieldsValue({ expiryDays: value });
                      
                      // 실시간 검증
                      if (!value || value === null) {
                        setExpiryDaysError('서명 유효기간은 필수 입력 사항입니다.');
                      } else if (value < 1 || value > 365) {
                        setExpiryDaysError('유효기간은 1일 이상 365일 이하로 설정해주세요.');
                      } else {
                        setExpiryDaysError('');
                      }
                    }}
                    addonAfter="일"
                    autoComplete="off"
                  />
                  {expiryDaysError && (
                    <div style={{ marginTop: '4px', paddingLeft: '11px', color: '#ff4d4f', fontSize: '14px' }}>
                      {expiryDaysError}
                    </div>
                  )}
                </Form.Item>

                <Divider />

                {/* 접근 암호 설정 */}
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f' }}>*</span> 접근 암호 설정</span>}
                  name="accessPassword"
                  validateStatus={passwordError ? 'error' : ''}
                  style={{ marginBottom: '20px' }}
                >
                  <div style={{ marginLeft: '10px', marginBottom: '10px', color: '#8c8c8c', fontSize: '14px' }}>
                    서명자가 링크 접근 시 입력해야 하는 암호입니다.
                  </div>
                  <Input.Group compact style={{ display: 'flex', alignItems: 'center', marginLeft: '10px', marginRight: '10px', width: 'calc(100% - 20px)' }}>
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
                          setPasswordError('접근 암호는 필수 입력 사항입니다.');
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
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
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
                  {passwordError && (
                    <div style={{ marginTop: '4px', paddingLeft: '11px', color: '#ff4d4f', fontSize: '14px' }}>
                      {passwordError}
                    </div>
                  )}
                </Form.Item>

                {/* 접근 암호 힌트 */}
                <Form.Item
                  label={<span style={{ marginLeft: '10px' }}>접근 암호 힌트 (선택사항)</span>}
                  name="passwordHint"
                  style={{ marginBottom: '20px' }}
                >
                  <div style={{ marginLeft: '10px', marginBottom: '10px', color: '#8c8c8c', fontSize: '14px' }}>
                    서명자가 암호를 쉽게 기억할 수 있도록 힌트를 제공할 수 있습니다.
                  </div>
                  <Input
                    style={{ marginLeft: '10px', marginRight: '10px', width: 'calc(100% - 20px)' }}
                    value={passwordHint}
                    onChange={(e) => setPasswordHint(e.target.value)}
                    placeholder="예: 회사 설립연도 4자리"
                    maxLength={50}
                    autoComplete="off"
                  />
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
                  style={{ marginBottom: 0, marginLeft: '10px', marginRight: '10px' }}
                />
              </Form>
            </Card>
          </Col>

          {/* 오른쪽 승인 및 요약 영역 */}
          <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 책임자 승인 선택 */}
            <Card title="책임자 승인 선택" bordered={false} style={{ marginBottom: 24, flex: 1 }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#ff4d4f' }}>*</span> 승인 책임자
              </div>
              <div style={{ marginLeft: '10px', marginBottom: '10px', color: '#8c8c8c', fontSize: '14px' }}>
                외부 링크서명을 위한 내부 통제자를 지정해주세요.
              </div>
              <Select
                placeholder="책임자를 선택해주세요"
                value={selectedApprover}
                onChange={setSelectedApprover}
                options={approvers}
                style={{ width: 'calc(100% - 20px)', marginLeft: '10px', marginRight: '10px' }}
                allowClear={false}
              />
            </Card>

            {/* 설정 요약 */}
            <Card title="설정 요약" bordered={false} style={{ flex: 1, backgroundColor: '#ffffff' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text style={{ marginLeft: '10px' }}><strong>문서명 :</strong> {localDocTitle}</Text>
                <Text style={{ marginLeft: '10px' }}><strong>요청자 :</strong> {name}</Text>
                <Text style={{ marginLeft: '10px' }}><strong>유효기간 :</strong> {expiryDays ? `${expiryDays}일` : <span style={{ color: '#ff4d4f' }}>미입력</span>}</Text>
                <Text style={{ marginLeft: '10px' }}><strong>접근암호 :</strong> {
                  accessPassword ? 
                    (passwordVisible ? accessPassword : accessPassword.replace(/./g, '•')) : 
                    <span style={{ color: '#ff4d4f' }}>미입력</span>
                }</Text>
                {passwordHint && <Text style={{ marginLeft: '10px' }}><strong>암호힌트 :</strong> {passwordHint}</Text>}
                <Text style={{ marginLeft: '10px' }}><strong>승인자 :</strong> {
                  approvers.find(a => a.value === selectedApprover)?.label || 
                  <span style={{ color: '#ff4d4f' }}>미선택</span>
                }</Text>
                <Divider style={{ margin: '12px 0' }} />
                <Alert
                  message="서명 접근 절차"
                  description="서명자는 접근 암호를 입력한 다음 휴대폰 본인인증을 완료해야만 문서 열람 및 서명이 가능합니다."
                  type="success"
                  showIcon
                  style={{ fontSize: '12px', marginLeft: '10px', marginRight: '10px' }}
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 링크 정보 모달 */}
        <LinkInfoModal
          visible={showLinkModal}
          onClose={handleModalConfirm}
          linkUrl={generatedLink}
          accessPassword={accessPassword}
          expiryDays={expiryDays}
          expiryDate={expiryDate}
          title="링크서명 생성 완료"
        />

      </PageContainer>
    </div>
  );
};

export default LinkSetting;