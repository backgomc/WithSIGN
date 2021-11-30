import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import BoardCard from '../Board/BoardCard';
import FAQCard from '../Board/FAQCard';
import { setUser, selectUser } from '../../app/infoSlice';
import { navigate, Link } from '@reach/router';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Form, message, Spin, Avatar, Alert, Row, Col } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormText, ProFormSelect, ProFormDependency } from '@ant-design/pro-form';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import '@ant-design/pro-card/dist/card.css';

const Setting = () => {

  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const [formPassword] = Form.useForm();

  const { _id, name, JOB_TITLE, email, DEPART_CODE, OFFICE_CODE } = user;

  const [tab, setTab] = useState('tab1');

  const [loading, setLoading] = useState(true);
  const [departName, setDepartName] = useState('');
  const [officeName, setOfficeName] = useState('');

  useEffect(() => {
    orgInfo();
  }, []);


  // 조직정보 가져오기
  const orgInfo = async () => {
    setLoading(true)
    let param = {
        DEPART_CODE: DEPART_CODE      
    }  
    const res = await axios.post('/api/users/orgInfo', param)
    
    if (res.data.success) {
        setDepartName(res.data.org.DEPART_NAME)
        setOfficeName(res.data.org.OFFICE_NAME)
    }
    setLoading(false)
  }

  const onFinish = async (values) => {
    console.log(values)

    // 유저정보 변경 API Call
    let param = {
        user: _id,
        email: values.email      
    }  
    const res = await axios.post('/api/users/updateUser', param)

    if (res.data.success) {
      message.success('변경되었습니다 !');

      // 유저정보 갱신
      axios.get('/api/users/auth').then(response => {
        if (!response.data.isAuth) {
            dispatch(setUser(null));
        } else {
            dispatch(setUser(response.data));
        }
      });

    } else {
      message.error('변경 실패하였습니다 !');
    }
  }

  const onFinishPassword = async (values) => {
    console.log(values)

    // 비밀번호 변경 API Call
    let param = {
        user: _id,
        currentPassword: values.currentPassword,
        password: values.password

    }  
    const res = await axios.post('/api/users/updatePassword', param)

    if (res.data.success) {
      message.success('비밀번호가 변경되었습니다!');
      // 입력폼 초기화
      formPassword.resetFields()

    } else if (res.data.message) {
      message.error(res.data.message);
    } else {
      message.error('비밀번호 변경에 실패하였습니다!');
    }
  }

  const validateMessages = {
    required: '${label} 을 입력하세요!',
    types: {
      email: '${label}이 유효하지 않습니다!',
      number: '${label} is not a valid number!',
    },
    number: {
      range: '${label} must be between ${min} and ${max}',
    },
  };

  const userinfo = () => {

    if(loading) {
        return (<div><Spin /></div>) 
    } else {
        return (

          <div>

            <div style={{marginLeft:'150px', marginTop:'15px', marginBottom:'15px'}}>
              <Avatar size={84} icon={<UserOutlined />} />
            </div>
            
            <div style={{marginLeft:'30px'}}>
            <ProForm
              onFinish={onFinish}
              validateMessages={validateMessages}

              submitter={{
                // Configure the button text
                searchConfig: {
                  resetText: '초기화',
                  submitText: '변경',
                },
                render: (_, dom) => {},
              }}
      
              initialValues={{
                name: name,
                jobTitle: JOB_TITLE,
                email: email,
                office: officeName,
                depart: departName
              }}
            >
              
              <ProFormText
                disabled
                width="md"
                name="name"
                label="이름"
                fieldProps={{
                  size: 'large'
                }}
                placeholder="이름"
                tooltip="이름 변경은 관리자에게 문의해주세요"
              />
              <ProFormText
                disabled
                width="md"
                name="jobTitle"
                label="직급"
                fieldProps={{
                  size: 'large'
                }}
                placeholder="직급"
                tooltip="직급 변경은 관리자에게 문의해주세요"
              />
              {/* <ProFormText
                width="md"
                name="email"
                label="이메일"
                fieldProps={{
                  size: 'large'
                }}
                placeholder="이메일"
                tooltip="이메일로 문서를 수신/발신시 사용됩니다"
                rules={[
                  {
                    type: 'email',
                  },
                ]}
              /> */}
      
              <ProFormText
                disabled
                width="md"
                name="office"
                label="소속"
                fieldProps={{
                  size: 'large'
                }}
                placeholder="소속명"
              />
      
              <ProFormText
                disabled
                width="md"
                name="depart"
                label="부서명"
                fieldProps={{
                  size: 'large'
                }}
                placeholder="부서명"
              />
    
            <div style={{width:"328px"}}>
              <Alert
                message="기본정보 변경 안내"
                description="내부시스템(ERP) 기본정보를 변경하시면 익일 자동 반영됩니다."
                type="info"
                showIcon
              />
            </div>

            </ProForm>
            </div>

          </div>

        )   
    }
  }

  const updatePassword = () => {
    return (
        <div style={{marginLeft:'30px'}}>
        <ProForm
        form={formPassword}
        onFinish={onFinishPassword}
        validateMessages={validateMessages}
        submitter={{
          // Configure the button text
          searchConfig: {
            resetText: '초기화',
            submitText: '비밀번호 변경',
          }
        }}

        initialValues={{
        }}
      >
        <ProFormText.Password
          width="md"
          name="currentPassword"
          label="현재 비밀번호"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className={'prefixIcon'} />,
          }}
          placeholder={'현재 비밀번호'}
          rules={[
            {
              required: true,
              min: 5,
              message: '현재 비밀번호를 입력하세요 !',
            },
          ]}
        />

        <ProFormText.Password
          width="md"
          name="password"
          label="새 비밀번호"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className={'prefixIcon'} />,
          }}
          placeholder={'새 비밀번호'}
          rules={[
            {
              required: true,
              min: 5,
              message: '새 비밀번호를 입력하세요 !',
            },
          ]}
        /> 

        <ProFormText.Password
          width="md"
          name="confirmPassword"
          label="새 비밀번호 확인"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className={'prefixIcon'} />,
          }}
          placeholder={'비밀번호'}
          rules={[
            {
              required: true,
              min: 5,
              // message: '새 비밀번호를 다시 입력하세요 !',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
  
                return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
              },
            }),
          ]}
        />

      </ProForm>
      </div>
    )   
  }

  const faq = () => {
    return (
      <div>
        <ProCard
          colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
          style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
          title="공지사항"
          bordered={false}
          headerBordered
          extra={<Link to="/boardList">더보기</Link>}
          // loading={loadingNotice}
          bodyStyle={{ padding: 10 }}
          >
            dsdsd
        </ProCard>
      </div>
    )
  }

  return (
    <div
        style={{
        background: '',
        }}
    >
        <PageContainer
        header={{
            title: '설정',
            ghost: false,
            breadcrumb: {
            routes: [
                // {
                // path: '',
                // breadcrumbName: '설정',
                // }
            ],
            },
            extra: [
            ],
        }}
        content={'사용자 정보 및 관련 설정을 변경 할 수 있습니다.'}
        >

          <Row gutter={24}>
              <Col xl={10} lg={24} md={24} sm={24} xs={24}>

                <ProCard
                  title='사용자 정보 및 변경'
                  tabs={{
                  type: 'card',
                  activeKey: tab,
                  onChange: (key) => {
                      setTab(key);
                  },
                  }}
                >
                  <ProCard.TabPane key="tab1" tab="기본 정보">
                    <div>{userinfo()}</div>
                  </ProCard.TabPane>
                  <ProCard.TabPane key="tab2" tab="비밀번호 변경">
                    <div>{updatePassword()}</div>
                  </ProCard.TabPane>
                </ProCard>
                <br></br>
              </Col>
              <Col xl={14} lg={24} md={24} sm={24} xs={24}>
                {/* {faq()} */}
                <BoardCard boardType={'notice'} boardName={'공지사항'}></BoardCard>
                <br></br>
                <FAQCard boardType={'faq'} boardName={'FAQ'}></FAQCard>
                
              </Col>
          </Row>

        
        </PageContainer>
    </div>
  );
};

export default Setting;