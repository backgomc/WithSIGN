import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { Button} from 'antd';
import termsFile from '../../assets/txt/이용약관.txt';
import privacyFile from '../../assets/txt/개인정보_수집_및_이용.txt';
import policyFile from '../../assets/txt/개인정보처리방침.txt';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';

function Policy() {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();

    const [policy, setPolicy] = useState();

    useEffect(() => {
      fetch(policyFile)
      .then((r) => r.text())
      .then(text  => {
        setPolicy(text)
      }) 
      
    }, []);

    return (
        <PageContainer
          ghost
          header={{
            title: "개인정보처리방침",
            ghost: true,
            breadcrumb: {
              routes: [
              ],
            },
            extra: [       
            <Button onClick={() => {navigate('/');}}>
              이전
            </Button>
            ],
          }}
          footer={[
          ]}
        >
          <div
            style={{height:'100%', padding:'0px'}}
            dangerouslySetInnerHTML={{
              __html: policy
            }} 
          />
        </PageContainer>
    )
}

export default Policy
