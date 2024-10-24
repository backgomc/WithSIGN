import React from 'react'
import axios from 'axios';
import { navigate } from '@reach/router';
import title from '../../assets/images/logo_withsign.png';
import { LockOutlined,  UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
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


function Login({location}) {
    const { formatMessage } = useIntl();
    const [cookies, setCookie, removeCookie] = useCookies(['SABUN']);

    const docId = location.state.dId
    console.log('Login > docId : '+ docId);

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
          //localStorage.setItem('__rToken__', response.data.user.__rToken__);
          localStorage.setItem('__docId__', docId);
          navigate(0);
        } else {
          if (response.data.user) {   // 약관 동의 절차 필요
            alert('PC버전에서 약관 동의 후 사용 가능합니다')
          } else {
            alert(response.data.message ? response.data.message : 'login failed !')
          }
        } 
      });
    }

    return (
      <div style={{ backgroundColor: 'white' }}>
        <div className="svInfo" >
          {process.env.NODE_ENV==='development'? 'LOCAL' : window.location.port =='3004' ? '개발' : ''}
        </div>
        <LoginStyle>
        <LoginForm
          title={<img src={title} />}
          subTitle=""
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

          {/*<div
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
                  formatMessage({id: 'ForgotPassword'})
                </Link>
                <Link to="/register">
                  {formatMessage({id: 'Regist'})}
                </Link> 
            </div>
          </div>*/}
        </LoginForm>
        </LoginStyle>
      </div>

    )
}

export default Login