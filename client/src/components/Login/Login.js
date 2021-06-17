import React, { useState, useRef } from 'react'
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { navigate, Link } from '@reach/router';
// import { loginUser } from '../../api/api'
import { setUser } from '../../app/infoSlice';

import { Checkbox, Button, Form, Input } from 'antd';
import Icon, { UserOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import logo from '../../assets/images/logo.svg';
import styles from './login.module.css';
// import './login.css';
// const FormItem = Form.Item;

import { useIntl } from "react-intl";


function Login(props) {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();

    // const inputRef = useRef(null);
    // const [Email, setEmail] = useState("")
    // const [Password, setPassword] = useState("")

    // const emitEmptyEmail = () => {
    //     inputRef.current.focus();
    //     setEmail('');
    //   };
    
    // const onEmailHandler = (event) => {
    //     setEmail(event.currentTarget.value)
    // }

    // const onPasswordHandler = (event) => {
    //     setPassword(event.currentTarget.value)
    // }

    const onFinish = (values) => {
        console.log(values)

        let body = {
            email: values.email,
            password: values.password
        }

        axios.post('/api/users/login', body).then(response => {

            console.log(response)
            if (response.data.success) {
                navigate('/');
                dispatch(setUser(response.data.user));
            } else {
                alert('Login Failed')
            }
          });
    }

    // const gotoLogin = (event) => {
    //     event.preventDefault();

    //     let body = {
    //         email: Email,
    //         password: Password
    //     }

    //     axios.post('/api/users/login', body).then(response => {

    //         console.log(response)
    //         if (response.data.success) {
    //             navigate('/');
    //             dispatch(setUser(response.data.user));
    //         } else {
    //             alert('Login Failed')
    //         }
    //       });

    // }

    // const userEmailSuffix = Email ? <Icon type="close-circle" onClick={emitEmptyEmail} /> : null;


    return (
        <>
        <div className={styles.header}>
          <div className={styles['header-wrapper']}>
            <header>
              <a href="/">
                <img src={logo} alt="ant design mini" />
                <h2>{formatMessage({id: 'AppName'})}</h2>
              </a>
              <div className={styles['nav-wrapper']}>
                <nav>
                  <ul>
                    <li>
                      <Link to="/register">{formatMessage({id: 'Register'})}</Link>
                    </li>
                  </ul>
                </nav>
              </div>
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
                name="email"
                rules={[
                {
                    required: true,
                    message: formatMessage({id: 'input.email'}),
                },
                ]}
            >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Email" />
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
                />
                {/* <Input.Password  /> */}
            </Form.Item>
            <Form.Item>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>{formatMessage({id: 'RememberMe'})}</Checkbox>
                </Form.Item>
        
                <a className="login-form-forgot" href="">
                  {formatMessage({id: 'ForgotPassword'})}
                </a>
            </Form.Item>
        
            <Form.Item>
                <Button type="primary" htmlType="submit" className={styles['login-form-button']}>
                {formatMessage({id: 'Login'})}
                </Button>
                {formatMessage({id: 'Or'})} <Link to="/register">{formatMessage({id: 'Regist'})}</Link>
            </Form.Item>
            </Form>
        </div>
        <div className={styles['footer']}>
          NH SIGN © NH INFORMATION SYSTEM 2021
        </div>
      </>
    )
}

export default Login
