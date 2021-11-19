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

function Terms() {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();
    // const user = location.state.user;

    const [terms, setTerms] = useState();

    useEffect(() => {
      fetch(termsFile)
      fetch(termsFile)
      .then((r) => r.text())
      .then(text  => {
        setTerms(text)
      }) 
      
    }, []);

    return (
        <PageContainer
          ghost
          header={{
            title: "이용약관",
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
            style={{height:'100%', padding:'0px', fontSize:'calc(13px + .2vw)'}}
            dangerouslySetInnerHTML={{
              __html: terms
            }} 
          />
        </PageContainer>
    )
}

export default Terms
