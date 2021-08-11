import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate, Link } from '@reach/router';
import { useIntl } from "react-intl";
import { selectUser } from '../../app/infoSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import axios from 'axios';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import { Spin, Button, Card, Modal, Empty, List, Space, Statistic, Avatar, Row, Col } from 'antd';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import {
  FileOutlined,
  SyncOutlined,
  HighlightFilled,
  UserOutlined
} from '@ant-design/icons';
import Moment from 'react-moment';
const { Divider } = ProCard;

const Home = () => {

  const [loading, setLoading] = useState(false);
  const [documentsToSign, setDocumentsToSign] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [responsive, setResponsive] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id, name, JOB_TITLE } = user;
  const { formatMessage } = useIntl();

  useEffect(() => {
    fetchToSign();
  }, []);

  const fetchToSign = async () => {
    setLoading(true);
    let param = {
      user: _id,
      pagination
    }
    
    const res = await axios.post('/api/document/searchForDocumentToSign', param)
    if (res.data.success) {
      const documents = res.data.documents;
      setDocumentsToSign(documents)
    }
    setLoading(false);

  }


  const headerTitle = (
    <Space size={3}>    
      <Avatar size={38} icon={<UserOutlined />} />
      <div>{name} {JOB_TITLE}</div>
    </Space>
  )

  // const extraContent = (
  //   // <Space size={24}>
  //   //   <Statistic title="서명 필요" value={3} />
  //   //   <Divider type="vertical" style={{ height: "40px" }} />
  //   //   <Statistic title="서명 대기" value={5} />
  //   //   <Divider type="vertical" style={{ height: "40px" }} />
  //   //   <Statistic title="전체 문서" value={93} />
  //   // </Space>
  //   <RcResizeObserver
  //     key="resize-observer"
  //     onResize={(offset) => {
  //       setResponsive(offset.width < 596);
  //     }}
  //   >
  //     <ProCard.Group title="문서 통계" direction={responsive ? 'column' : 'row'}>
  //       <ProCard>
  //         <Statistic title="서명 필요" value={3} />
  //       </ProCard>
  //       <Divider type={responsive ? 'horizontal' : 'vertical'} />
  //       <ProCard>
  //         <Statistic title="서명 대기" value={12} />
  //       </ProCard>
  //       <Divider type={responsive ? 'horizontal' : 'vertical'} />
  //       <ProCard>
  //         <Statistic title="전체 문서" value={93} />
  //       </ProCard>
  //     </ProCard.Group>
  //   </RcResizeObserver>
  // )

  const tosign = (
    <ProCard
    colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
    style={{ marginBottom: 0, marginRight: 30, padding: 0 }}
    title="서명 필요 문서"
    bordered={false}
    headerBordered
    extra={<Link to="/">더보기</Link>}
    loading={loading}
    bodyStyle={{ padding: 10 }}
    >
      <List
        // bordered
        style={{ paddingLeft: 24, paddingRight: 24}}
        dataSource={documentsToSign}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<FileOutlined />}
            title={
              <Link to="/signDocument" onClick={() => {
                const docId = item._id;
                const docRef = item.docRef;
                dispatch(setDocToSign({ docRef, docId }));
              }}>
                {item.docTitle}
              </Link>
            }
            // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
          />
          {/* <div><Moment format='YYYY/MM/DD'>{item.requestedTime}</Moment></div> */}
          </List.Item>
        )}
      />
    </ProCard>
  )

  const documentStatic = (
      <ProCard.Group title="문서 통계" direction='row'>
      <ProCard>
        <Link to='/documentList'><Statistic title="서명 필요" value={3} valueStyle={{ color: '#cf1322' }} suffix="건" /></Link>
      </ProCard>
      <Divider type='vertical' />
      <ProCard>
        <Statistic title="서명 대기" value={12} suffix="건" />
      </ProCard>
      <Divider type='vertical' />
      <ProCard>
        <Statistic title="전체 문서" value={93} suffix="건" />
      </ProCard>
    </ProCard.Group>
  )
  

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: headerTitle,
          ghost: false,
          breadcrumb: {
            routes: [
              // {
              //   path: '/',
              //   breadcrumbName: '내 사인',
              // },
              // {
              //   path: '/',
              //   breadcrumbName: '사인 등록',
              // },
            ],
          },
          extra: [
            // <Button key="3">Operation</Button>,
            <Button key="2">내 문서함</Button>,
            <Button key="1" type="primary">
              서명 요청
            </Button>,
          ],
        }}
        // content={extraContent}
        // extraContent={}
        footer={[
        ]}
      >
      <br/>
      <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
      >
        <Row gutter={[24, 24]}>
          <Col span={24}>{documentStatic}</Col>
          <Col span={responsive ? 24 : 12}>{tosign}</Col>
          <Col span={responsive ? 24 : 12}>{tosign}</Col>
        </Row>

      </RcResizeObserver>

      {/* <ProCard style={{ marginTop: 20, backgroundColor: 'grey', padding: 0 }} gutter={[24, 0]} wrap title="">
      {tosign}
      {tosign}
      </ProCard> */}


      </PageContainer>
    </div>
  );
};

export default Home;