import React from 'react'
import axios from 'axios';
import { navigate, Link } from '@reach/router';
import { Checkbox, Button, Form, Input } from 'antd';
import logo from '../../assets/images/logo.svg';
import styles from './register.module.css';
import { useIntl } from "react-intl";

function Register(props) {
    const { formatMessage } = useIntl();

    const onFinish = (values) => {
        console.log(values)

        let body = {
            email: values.email,
            password: values.password,
            name: values.name
        }

        axios.post('/api/users/register', body).then(response => {

            console.log(response)
            if (response.data.success) {
                navigate('/');
                alert(formatMessage({id: 'register.success'}))
            } else {
                alert(response.data.error)
            }
          });
    }

    const formItemLayout = {
        labelCol: {
          xs: {
            span: 24,
          },
          sm: {
            span: 8,
          },
        },
        wrapperCol: {
          xs: {
            span: 24,
          },
          sm: {
            span: 16,
          },
        },
    };

    const tailFormItemLayout = {
        wrapperCol: {
            xs: {
            span: 24,
            offset: 0,
            },
            sm: {
            span: 16,
            offset: 8,
            },
        },
    };

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
                      <Link to="/">{formatMessage({id: 'Login'})}</Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </header>
          </div>
        </div>
        <div className={styles.content}>
            <Form
            {...formItemLayout}
            name="normal_register"
            className="register-form"
            initialValues={{
                remember: true,
            }}
            onFinish={onFinish}
            scrollToFirstError
            >
            <h3>{formatMessage({id: 'Register'})}</h3>
            <Form.Item
                name="email"
                label={formatMessage({id: 'Email'})}
                rules={[
                {
                    type: 'email',
                    message: formatMessage({id: 'validation.email'}),
                },
                {
                    required: true,
                    message: formatMessage({id: 'input.email'}),
                },
                ]}
            >
                <Input />
            </Form.Item>            

            <Form.Item
                name="password"
                label={formatMessage({id: 'Password'})}
                rules={[
                {
                    required: true,
                    min: 5,
                    message: formatMessage({id: 'input.password'}),
                },
                ]}
                hasFeedback
            >
                <Input.Password />
            </Form.Item>

            <Form.Item
                name="confirm"
                label={formatMessage({id: 'ConfirmPassword'})}
                dependencies={['password']}
                hasFeedback
                rules={[
                {
                    required: true,
                    message: formatMessage({id: 'confirm.password'}),
                },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                    }

                    return Promise.reject(new Error(formatMessage({id: 'nomatch.password'})));
                    },
                }),
                ]}
            >
                <Input.Password />
            </Form.Item>

            <Form.Item
                name="name"
                label={formatMessage({id: 'Name'})}
                tooltip="What do you want others to call you?"
                rules={[
                {
                    required: true,
                    message: formatMessage({id: 'input.name'}),
                    whitespace: true,
                },
                ]}
            >
                <Input />
            </Form.Item>

            <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                {
                    validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error(formatMessage({id: 'accept.aggreement'}))),
                },
                ]}
                {...tailFormItemLayout}
            >
                <Checkbox>
                {formatMessage({id: 'agree.agreement'})} <a href="">{formatMessage({id: 'view.agreement'})}</a>
                </Checkbox>
            </Form.Item>

            <Form.Item {...tailFormItemLayout}>
                <Button type="primary" htmlType="submit">
                    {formatMessage({id: 'Register'})}
                </Button>
            </Form.Item>
            
            </Form>
        </div>
        <div className={styles['footer']}>
          WITH SIGN © NH INFORMATION SYSTEM 2021
        </div>
      </>
    )
}

export default Register