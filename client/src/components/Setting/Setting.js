import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { selectUser } from '../../app/infoSlice';
import { EllipsisOutlined } from '@ant-design/icons';
import { Form, message, Spin } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormText, ProFormSelect, ProFormDependency } from '@ant-design/pro-form';

import 'antd/dist/antd.css';

const Setting = () => {

  const user = useSelector(selectUser);
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

  const onFinish = (values) => {
    console.log(values)

    //TODO 기본정보 변경 API Call
  }

  const validateMessages = {
    required: '${label} is required!',
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

            <ProForm
            onFinish={onFinish}
            validateMessages={validateMessages}
            submitter={{
              // Configure the button text
              searchConfig: {
                resetText: '초기화',
                submitText: '변경',
              }
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
              placeholder="이름"
              tooltip="이름 변경은 관리자에게 문의해주세요"
            />
            <ProFormText
              disabled
              width="md"
              name="jobTitle"
              label="직급"
              placeholder="직급"
              tooltip="직급 변경은 관리자에게 문의해주세요"
            />
            <ProFormText
              width="md"
              name="email"
              label="이메일"
              placeholder="이메일"
              tooltip="이메일로 문서를 수신/발신시 사용됩니다"
              rules={[
                {
                  type: 'email',
                },
              ]}
            />
    
            <ProFormText
              disabled
              width="md"
              name="office"
              label="소속"
              placeholder="소속명"
            />
    
            <ProFormText
              disabled
              width="md"
              name="depart"
              label="부서명"
              placeholder="부서명"
            />
    
          </ProForm>
        )   
    }
  }

  return (
    <div
        style={{
        background: '#F5F7FA',
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

            <ProCard
                tabs={{
                type: 'card',
                activeKey: tab,
                onChange: (key) => {
                    setTab(key);
                },
                }}
            >
                <ProCard.TabPane key="tab1" tab="기본 정보">
                  <div style={{marginLeft:'35px'}}>{userinfo()}</div>
                </ProCard.TabPane>
                <ProCard.TabPane key="tab2" tab="비밀번호 변경">
                ...
                </ProCard.TabPane>
            </ProCard>
        
        </PageContainer>
    </div>
  );
};

export default Setting;