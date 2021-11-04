import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Header from './Header';
import { useDispatch } from 'react-redux';
import { navigate, Link } from '@reach/router';
import { setUser } from '../../app/infoSlice';
import { Checkbox, Button, Form, Input, Card, Modal } from 'antd';
import Icon, { ExclamationCircleOutlined } from '@ant-design/icons';
import logo from '../../assets/images/logo.svg';
import termsFile from '../../assets/txt/이용약관.txt';
import privacyFile from '../../assets/txt/개인정보_수집_및_이용.txt';
import policyFile from '../../assets/txt/개인정보처리방침.txt';
import styles from './login.module.css';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';


function Agreement(props) {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();

    const [terms, setTerms] = useState();
    const [privacy, setPrivacy] = useState();
    const [policy, setPolicy] = useState();

    const [totalChecked, setTotalChecked] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);

    const [disableNext, setDisableNext] = useState(true);

    const [termsModalVisible, setTermsModalVisible] = useState(false);
    const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
    const [policyModalVisible, setPolicyModalVisible] = useState(false);

    const txtReader = (file) => {
      fetch(file)
      .then((r) => r.text())
      .then(text  => {
        console.log(text);
      })  

    }

    useEffect(() => {
      fetch(termsFile)
      .then((r) => r.text())
      .then(text  => {
        setTerms(text)
      }) 
      
      fetch(privacyFile)
      .then((r) => r.text())
      .then(text  => {
        setPrivacy(text)
      })  

      fetch(policyFile)
      .then((r) => r.text())
      .then(text  => {
        setPolicy(text)
      })  

    }, []);

    const onFinish = (values) => {
        console.log(values)

        let body = {
            SABUN: values.SABUN,
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

    const onChangeTotal = (e) => {

      setTotalChecked(e.target.checked)

      if (e.target.checked) {
        setTermsChecked(true)
        setPrivacyChecked(true)
        setDisableNext(false)
      } else {
        setTermsChecked(false)
        setPrivacyChecked(false)
        setDisableNext(true)
      }
    }

    const onChangeTerms = (e) => {
      setTermsChecked(e.target.checked)

      if (e.target.checked && privacyChecked) {
        setTotalChecked(true)
        setDisableNext(false)
      } else {
        setTotalChecked(false)
        setDisableNext(true)
      }
    }

    const onChangePrivacy = (e) => {
      setPrivacyChecked(e.target.checked)

      if (e.target.checked && termsChecked) {
        setTotalChecked(true)
        setDisableNext(false)
      } else {
        setTotalChecked(false)
        setDisableNext(true)
      }
    }

    
    const modalTerms = (
      <Modal title="이용약관" visible={termsModalVisible} footer={[
        <Button key="back" onClick={() => {setTermsModalVisible(false)}}>
          닫기
        </Button>
      ]}>
        <div
          style={{height:'100%', padding:'0px'}}
          dangerouslySetInnerHTML={{
            __html: terms
          }} 
        />
      </Modal>
    )

    const modalPrivacy = (
      <Modal title="개인정보 수집 및 이용" visible={privacyModalVisible} footer={[
        <Button key="back" onClick={() => {setPrivacyModalVisible(false)}}>
          닫기
        </Button>
      ]}>
        <div
          style={{height:'100%', padding:'0px'}}
          dangerouslySetInnerHTML={{
            __html: privacy
          }} 
        />
      </Modal>
    )

    const modalPolicy = (
      <Modal title="개인정보처리방침" visible={policyModalVisible} footer={[
        <Button key="back" onClick={() => {setPolicyModalVisible(false)}}>
          닫기
        </Button>
      ]}>
        <div
          style={{height:'100%', padding:'0px'}}
          dangerouslySetInnerHTML={{
            __html: policy
          }} 
        />
      </Modal>
    )

    const agreementBody = (
      // <div className={styles.contentAgree}>
      <div>
        {/* <Card title={<Checkbox checked={totalChecked} onChange={onChangeTotal}>NHSign 이용약관, 개인정보 수집 및 이용에 모두 동의합니다.</Checkbox>}> */}

          <Card
            type="inner"
            bodyStyle={{ padding: 0 }}
            title={<Checkbox checked={termsChecked} onChange={onChangeTerms}>이용약관 동의 <font color='red'>(필수)</font></Checkbox>}
            extra={<Button type='link' style={{marginRight:-5}} size='small' onClick={() => {setTermsModalVisible(true)}}>전문보기</Button>}
          >
            <div
              style={{overflowY:'scroll', height:'200px', padding:'15px'}}
              dangerouslySetInnerHTML={{
                __html: terms
              }} 
            />

          </Card>

          <Card
            style={{ marginTop: 16 }}
            bodyStyle={{ padding: 0 }}
            type="inner"
            title={<Checkbox checked={privacyChecked} onChange={onChangePrivacy}>개인정보 수집 및 이용 동의 <font color='red'>(필수)</font></Checkbox>}
            extra={<Button type='link' style={{marginRight:-5}} size='small' onClick={() => {setPrivacyModalVisible(true)}}>전문보기</Button>}
          >
            <div
              style={{overflowY:'scroll', height:'200px', padding:'15px'}}
              dangerouslySetInnerHTML={{
                __html: privacy
              }} 
            />

          </Card>

          <Card
            style={{ marginTop: 16 }}
            bodyStyle={{ padding: 0 }}
            type="inner"
            title={<span><ExclamationCircleOutlined/>&nbsp;개인정보처리방침</span>}
            extra={<Button type='link' style={{marginRight:-5}} size='small' onClick={() => {setPolicyModalVisible(true)}}>전문보기</Button>}
          >
            <div
              style={{overflowY:'scroll', height:'200px', padding:'15px'}}
              dangerouslySetInnerHTML={{
                __html: policy
              }} 
            />

          </Card>
        {/* </Card> */}
      </div>
    )

    return (
        <>
        <Header></Header>
        <br></br><br></br><br></br>
        <div className={styles.middle}>
        <PageContainer
          ghost
          header={{
            // title: formatMessage({id: 'document.template'}),
            title: "이용약관 및 개인정보 처리 방침",
            ghost: false,
            breadcrumb: {
              routes: [
              ],
            },
            extra: [       
            <Button onClick={() => {navigate('/');}}>
              이전
            </Button>,    
            <Button type="primary" onClick={() => {navigate('/updateAgreement');}} disabled={disableNext}>
              약관 동의
            </Button>
            ],
          }}
          content={<Checkbox checked={totalChecked} onChange={onChangeTotal} style={{marginTop:15}}><b>NHSign 이용약관, 개인정보 수집 및 이용에 모두 동의합니다.</b></Checkbox>}
          footer={[
          ]}
        >
          {agreementBody}
          {modalTerms}
          {modalPrivacy}
          {modalPolicy}

        </PageContainer>
        </div>

        <div className={styles['footer']}>
          NH SIGN © NH INFORMATION SYSTEM 2021
        </div>
      </>
    )
}

export default Agreement
