import React, {useEffect, useState} from 'react';
import { Button, Result } from "antd";
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import { navigate } from '@reach/router';


const ResultPage = ({location}) => {

  const { formatMessage } = useIntl();
  const headerTitle = location.state ? location.state.headerTitle : '처리 결과'
  const title = location.state ? location.state.title : '성공적으로 처리되었습니다.'
  const subTitle = location.state ? location.state.subTitle : ''
  const status = location.state ? location.state.status : 'success'

  const [status_, setStatus_] = useState(status);

  useEffect(() => {
  }, []);

  return (

    <div>
    <PageContainer
        header={{
          title: headerTitle,
          extra: [           
          <Button onClick={() => window.history.back()}>
            {formatMessage({id: 'Back'})}
          </Button>
          ],
        }}
        footer={[
        ]}
    >

      <Result
          status={status_}
          title={title}
          subTitle={subTitle}
          extra={[
            <Button type="primary" onClick={() => navigate('/')}>
              메인 화면 
            </Button>,
            <Button onClick={() => navigate('/documentList')}>내 문서함</Button>,
          ]}
      />

    </PageContainer>
    </div>

  );

};

export default ResultPage;