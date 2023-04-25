import React, { useState, useRef } from 'react'
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { navigate, Link } from '@reach/router';
import { setUser } from '../../app/infoSlice';
import { setPathname } from '../../config/MenuSlice';
// import logo from '../../assets/images/logo_nhforms1.png';
import title from '../../assets/images/logo_withsign.png';
import styles from './login.module.css';
import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { useCookies } from 'react-cookie';
import { useIntl } from "react-intl";
import styled from 'styled-components';
const LoginStyle = styled.div`
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -30%);
    .ant-pro-form-login-header {
    margin-bottom: 15px !important; 
    }
`;


function Login(props) {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();
    const [cookies, setCookie, removeCookie] = useCookies(['SABUN']);

    const onFinish = (values) => {
        if (values.remember) {
            setCookie('SABUN', values.SABUN, {maxAge: 30 * 24 * 60 * 60});
        } else {
            removeCookie('SABUN');
        }

        let body = {
            SABUN: values.SABUN,
            password: values.password
        }

        axios.post('/api/users/login', body).then(response => {
            console.log(response);
            if (response.data.success) {
                localStorage.setItem('__rToken__', response.data.user.__rToken__);
                dispatch(setUser(response.data.user));
                dispatch(setPathname('/'));
                navigate('/', { replace: true });
            } else {
                if (response.data.user) {   // 약관 동의 절차 필요
                    navigate('/agreement', { state: {user: response.data.user}})
                } else {
                    alert(response.data.message ? response.data.message : 'login failed !')
                }
            } 
        });
    }

    return (
      <div style={{ backgroundColor: 'white' }}>
        {process.env.NODE_ENV==='development'?<div style={{position: 'fixed', textAlign: 'center', width: '100%', color: 'red', zIndex: '10000', fontSize: 'xx-large', pointerEvents: 'none'}}>LOCAL</div>:''}
        {process.env.REACT_APP_MODE==='TEST' ?<div style={{position: 'fixed', textAlign: 'center', width: '100%', color: 'red', zIndex: '10000', fontSize: 'xx-large', pointerEvents: 'none'}}>TEST</div> :''}
        <LoginStyle>
        <LoginForm
        //   logo={logo}
          title={<img src={title} />}
          subTitle=""
          // actions={
          //   <Space>
          //     其他登录方式
          //     <AlipayCircleOutlined style={iconStyles} />
          //     <TaobaoCircleOutlined style={iconStyles} />
          //     <WeiboCircleOutlined style={iconStyles} />
          //   </Space>
          // }
          initialValues={{
            SABUN: cookies.SABUN,
            remember: (cookies.SABUN)?true:false
        }}
          onFinish={onFinish}
          submitter={{ searchConfig: { submitText: formatMessage({id: 'Login'}) } }}
        >
          <>
            <ProFormText
              name="SABUN"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined className={'prefixIcon'} />,
              }}
              placeholder={'사번'}
              rules={[
                {
                  required: true,
                  message: formatMessage({id: 'input.SABUN'}),
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className={'prefixIcon'} />,
              }}
              placeholder={'Password'}
              rules={[
                {
                  required: true,
                  message: formatMessage({id: 'input.password'}),
                },
              ]}
            />
          </>

          <div
            style={{
              marginBottom: 24,
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              {formatMessage({id: 'RememberMe'})}
            </ProFormCheckbox>
            <div
              style={{
                float: 'right',
              }}
            >
              <Link to="/initPassword">
              {formatMessage({id: 'ForgotPassword'})}
              </Link>
              {/* <Link to="/register">
              {formatMessage({id: 'Regist'})}
              </Link> */}
            </div>
          </div>
        </LoginForm>
        </LoginStyle>
      </div>

    )
}

export default Login