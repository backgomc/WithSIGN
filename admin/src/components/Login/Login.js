import React from 'react'
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { setUser } from '../../app/infoSlice';
import { Button, Form, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styles from './login.module.css';
import { useIntl } from "react-intl";
import LogoImage from '../../assets/images/logo_withsign1.png'
import LogoText from '../../assets/images/logo_withsign2.png'

function Login() {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();

    const onFinish = (values) => {
        console.log(values);

        let body = {
          SABUN: values.SABUN,
          password: values.password
        }

        axios.post('/admin/login', body).then(response => {
          if (response.data.success) {
            dispatch(setUser(response.data.user));
            localStorage.setItem('__rToken__', response.data.user.__rToken__);
            navigate('/');
          } else {
            alert(response.data.message ? response.data.message : 'Login Failed');
          }
        });
    }

    return (
      <>
        <div className={styles.header}>
          <div className={styles['header-wrapper']}>
            <header>
              <a href="/">
                <img src={LogoImage} alt="WithSIGN" />
                <img src={LogoText} alt="WithSIGN" />
                {/* <h2>{formatMessage({id: 'AppName'})}</h2> */}
                <h5 style={{'color':'cyan'}}>{formatMessage({id: 'AppSubName'})}</h5>
              </a>
              {/* <div className={styles['nav-wrapper']}>
                <nav>
                  <ul>
                    <li>
                      <Link to="/register">{formatMessage({id: 'Register'})}</Link>
                    </li>
                  </ul>
                </nav>
              </div> */}
            </header>
          </div>
        </div>
        <div className={styles.content}>
            <Form
            name="normal_login"
            className="login-form"
            initialValues={{
                remember: true,
            }}
            onFinish={onFinish}
            >
            <h3>{formatMessage({id: 'Login'})}</h3>
            <Form.Item
                name="SABUN"
                rules={[
                {
                    required: true,
                    message: formatMessage({id: 'input.SABUN'}),
                },
                ]}
            >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} size="large" placeholder="사번" />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[
                {
                    required: true,
                    message: formatMessage({id: 'input.password'}),
                },
                ]}
            >
                <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="Password"
                size="large"
                />
                {/* <Input.Password  /> */}
            </Form.Item>
            {/* <Form.Item>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>{formatMessage({id: 'RememberMe'})}</Checkbox>
                </Form.Item>
                <a className="login-form-forgot" href="">
                  {formatMessage({id: 'ForgotPassword'})}
                </a>
            </Form.Item> */}
            <Form.Item>
                <Button type="primary" htmlType="submit" className={styles['login-form-button']} size="large">
                {formatMessage({id: 'Login'})}
                </Button>
                {/* {formatMessage({id: 'Or'})} <Link to="/register">{formatMessage({id: 'Regist'})}</Link> */}
            </Form.Item>
            </Form>
        </div>
        <div className={styles['footer']}>
          WITH SIGN © NH INFORMATION SYSTEM 2021
        </div>
      </>
    )
}

export default Login
