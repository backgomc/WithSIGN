import React, { useEffect, useState } from 'react'
import { createBrowserHistory } from "history";
import { PageContainer } from '@ant-design/pro-layout';
import { Button, Result } from "antd";

const ResultPage = ({location}) => {
    const status = location.state.status
    const mainTitle = location.state.mainTitle
    const msg = location.state.msg
    const subMsg = location.state.subMsg

    const [locationKeys, setLocationKeys] = useState([]);
    const history = createBrowserHistory();

    useEffect(() => {
      return history.listen((location) => {
        if (history.action === "POP") {
            window.location.href = 'jscall://close' //물리키, 백키, 뒤로가기 시 NHWith 웹뷰 닫기 호출
        }
      });
    }, [locationKeys, history]);

    return (
    <div>
      <PageContainer
        header={{
          title: mainTitle,
          extra: [ ]
        }}
        footer={[
        ]}
      >
        <Result
          key='pResultKey'
          status={status}
          title={msg}
          subTitle={subMsg}
          extra={[
            <Button key='srbtk' type="primary" onClick={() => window.location.href = 'jscall://close'}>
              닫기
            </Button>
          ]}
        />
      </PageContainer>
    </div>
    )
}

export default ResultPage;
