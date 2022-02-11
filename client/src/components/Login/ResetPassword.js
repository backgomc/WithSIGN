import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Header from './Header';
import { useDispatch } from 'react-redux';
import { navigate, Link } from '@reach/router';
import { Checkbox, Button, Form, Input, Card, Modal } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import ProForm, { ProFormText, ProFormSelect, ProFormDependency } from '@ant-design/pro-form';
import styles from './login.module.css';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import '@ant-design/pro-card/dist/card.css';


function ResetPassword({location}) {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();
    const user = location.state ? location.state.user : '';
    const [formPassword] = Form.useForm();

    useEffect(() => {
    }, []);


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

    const onFinishPassword = async (values) => {
      console.log(values)
  
      // 비밀번호 변경 API Call
      let param = {
          user: user,
          currentPassword: 'temp',
          isNew: true,
          password: values.password
  
      }  
      const res = await axios.post('/api/users/updatePassword', param)
  
      if (res.data.success) {
        alert('비밀번호가 변경되었습니다!')
        navigate('/login');
      } else {
        alert(res.data.message? res.data.message : '비밀번호 변경에 실패하였습니다!')
      }
    }


  const updatePassword = (
    <Card
    bodyStyle={{ paddingLeft: 58 }}
    title={'신규 비밀번호를 설정해주세요.'}
    >
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
        {/* <ProFormText.Password
          width="md"
          name="currentPassword"
          label="현재 비밀번호"
          disabled
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className={'prefixIcon'} />,
            defaultValue: '11111'
          }}
          placeholder={'현재 비밀번호'}
          rules={[
            {
              required: true,
              min: 5,
              message: '현재 비밀번호를 입력하세요 !',
            },
          ]}
        /> */}

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
              min: 8,
              message: '비밀번호는 영문자, 숫자, 특수문자를 혼합하여 8자리 이상으로 입력하세요.',
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!-/:-@\[-`{-~])[A-Za-z\d!-/:-@\[-`{-~]{8,}$/
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
              min: 8,
              message: '',
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!-/:-@\[-`{-~])[A-Za-z\d!-/:-@\[-`{-~]{8,}$/
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

    </Card>
  )   


    return user ? (
        <>
        <Header></Header>
        <div className={styles.middleCard}>
          {updatePassword}
        </div>
        <div className={styles['footer']}>
          WITH SIGN © NH INFORMATION SYSTEM 2021
        </div>
      </>
    ) : (
      <></>
    )
}

export default ResetPassword
