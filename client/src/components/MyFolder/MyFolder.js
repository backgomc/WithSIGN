import React, { useEffect } from 'react';
import { useIntl } from "react-intl";
import { List, Button, Card, Badge  } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import folderEmpty from '../../assets/images/folder_empty.png';
import folderContain from '../../assets/images/folder_contain.png';
import ProCard from '@ant-design/pro-card';

const data = [
  {
    title: 'Ant Design Title 1',
  },
  {
    title: 'Ant Design Title 2',
  },
  {
    title: 'Ant Design Title 3',
  },
  {
    title: 'Ant Design Title 4',
  },
  {
    title: 'Ant Design Title 1',
  },
  {
    title: 'Ant Design Title 2',
  },
  {
    title: 'Ant Design Title 3',
  },
  {
    title: 'Ant Design Title 4',
  },
];

const gridStyle = {
  width: '25%',
  textAlign: 'center',
  // backgroundImage: 'url('+f2+')',
};  

const MyFolder = () => {

  const { formatMessage } = useIntl();

  useEffect(() => {
    
  }, []);

  return (
    <div>
      <PageContainer
          ghost
          header={{
            title: formatMessage({id: 'folder.management'}),
            ghost: false,
            breadcrumb: {
              routes: [],
            },
            extra: []
          }}
          content={'개인 폴더 관리'}
          footer={[
          ]}
      >
        {/* <List
          itemLayout="vertical"
          dataSource={data}
          grid={{ gutter: 0,
            xs: 1,
            sm: 2,
            md: 4,
            lg: 4,
            xl: 6,
            xxl: 6 }}
          renderItem={item => (
            <List.Item>
              <Button type="primary" style={{ height: "236px", width: "100%", minWidth: "300px" }} onClick={() => {alert(1);}}>
                <img src={f1} width="50%"/>
              </Button>
            </List.Item>
          )}
        />
        <List
          itemLayout="horizontal"
          dataSource={data}
          grid={{ gutter: 16, column: 4 }}
          renderItem={item => (
            <List.Item>
              <Button type="dashed" style={{ height: "236px", width: "100%", minWidth: "300px" }} onClick={() => {alert(1);}}>
                <img src={f2} width="auto"/>
              </Button>
            </List.Item>
          )}
        /> */}
        {/* <br/><br/> */}
        {/* <Card title="">
          <Badge.Ribbon text={'공유'}><Card.Grid style={gridStyle}><img src={folderContain} width="50%"/></Card.Grid></Badge.Ribbon>
          <Badge.Ribbon text={'공유'}><Card.Grid style={gridStyle}><img src={folderContain} width="50%"/></Card.Grid></Badge.Ribbon>
          <Card.Grid style={gridStyle}><img src={folderContain} width="50%"/></Card.Grid>
          <Card.Grid style={gridStyle}><img src={folderEmpty} width="50%"/></Card.Grid>
          <Card.Grid style={gridStyle}><img src={folderEmpty} width="50%"/></Card.Grid>
          <Card.Grid style={gridStyle}><img src={folderEmpty} width="50%"/></Card.Grid>
          <Card.Grid style={gridStyle}><img src={folderEmpty} width="50%"/></Card.Grid>
        </Card> */}
        
        <List
          // loading={loading}
          grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
          dataSource={data}
          renderItem={item => (
            <List.Item>
              <Badge.Ribbon text={'공유'}>
                <ProCard
                  hoverable
                  bordered
                  // title={<Tooltip placement="topLeft" title={item.docTitle} arrowPointAtCenter><CardTitle>{item.docTitle}</CardTitle></Tooltip>}
                  layout="center" 
                  style={{ minWidth: "320px", height: "100%" }}
                  bodyStyle={{ padding: "5px"}}
                  // actions={actionItems(item)}
                >
                  <div style={{
                    backgroundImage: 'url('+folderContain+')',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // width: '280px',
                    // height: '395px',
                    display: 'flex'
                  }}>
                  </div>
                </ProCard>
              </Badge.Ribbon>
            </List.Item>
          )}
        />

      </PageContainer>
    </div>
  );
};

export default MyFolder;