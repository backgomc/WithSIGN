import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate, Link } from '@reach/router';
import { useIntl } from "react-intl";
import { selectUser } from '../../app/infoSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import { setSendType } from '../Assign/AssignSlice';
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
  BellOutlined,
  UserOutlined
} from '@ant-design/icons';
import Moment from 'react-moment';
import moment from "moment";
import "moment/locale/ko";
import styles from './Home.css';
import { Pie, measureTextWidth } from '@ant-design/charts';
const { Divider } = ProCard;

const Home = () => {

  const [loadingToSign, setLoadingToSign] = useState(false);
  const [loadingSigning, setLoadingSigning] = useState(false);
  const [loadingStatics, setLoadingStatics] = useState(false);
  const [loadingNotice, setLoadingNotice] = useState(false);
  const [documentsToSign, setDocumentsToSign] = useState([]);
  const [documentsSigning, setDocumentsSigning] = useState([]);
  const [notice, setNotice] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:6});
  const [responsive, setResponsive] = useState(false);
  const [totalNum, setTotalNum] = useState(0);
  const [toSignNum, setToSignNum] = useState(0);
  const [signingNum, setSigningNum] = useState(0);
  const [canceledNum, setCanceledNum] = useState(0);
  const [signedNum, setSignedNum] = useState(0);

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id, name, JOB_TITLE } = user;
  const { formatMessage } = useIntl();

  useEffect(() => {
    fetchToSign();
    fetchSigning();
    fetchStatics();
    fetchNotice();
  }, []);

  const fetchToSign = async () => {
    setLoadingToSign(true);
    let param = {
      user: _id,
      pagination,
      status: '서명 필요'
    }
    const res = await axios.post('/api/document/documents', param)
    if (res.data.success) {
      const documents = res.data.documents;
      setDocumentsToSign(documents)
    }
    setLoadingToSign(false);
  }

  const fetchSigning = async () => {
    setLoadingSigning(true);
    let param = {
      user: _id,
      pagination,
      status: '서명 대기'
    }
    const res = await axios.post('/api/document/documents', param)
    if (res.data.success) {
      const documents = res.data.documents;
      setDocumentsSigning(documents)
    }
    setLoadingSigning(false);
  }

  const fetchStatics = async () => {
    setLoadingStatics(true);
    let param = {
      user: _id
    }
    const res = await axios.post('/api/document/statics', param)
    if (res.data.success) {
      setSigningNum(res.data.signingNum)
      setToSignNum(res.data.toSignNum)
      setTotalNum(res.data.totalNum)
      setCanceledNum(res.data.canceledNum)
      setSignedNum(res.data.signedNum)
    }
    setLoadingStatics(false);
  }

  const fetchNotice = async () => {
    setLoadingNotice(true);
    let param = {
      boardType: 'notice',
      pagination
    }
    const res = await axios.post('/api/board/list', param)
    if (res.data.success) {
      const boards = res.data.boards;
      setNotice(boards)
    }
    setLoadingNotice(false);
  }

  const headerTitle = (
    <Space size={3}>    
      <Avatar size={38} icon={<UserOutlined />} />
      <div>{name} {JOB_TITLE}</div>
    </Space>
  )

  const extraContent = (
    // <Space size={24}>
    //   <Statistic title="서명 필요" value={3} />
    //   <Divider type="vertical" style={{ height: "40px" }} />
    //   <Statistic title="서명 대기" value={5} />
    //   <Divider type="vertical" style={{ height: "40px" }} />
    //   <Statistic title="전체 문서" value={93} />
    // </Space>
    // <RcResizeObserver
    //   key="resize-observer"
    //   onResize={(offset) => {
    //     setResponsive(offset.width < 596);
    //   }}
    // >
    //   <ProCard.Group title="" direction={responsive ? 'column' : 'row'}>
    //     <ProCard>
    //       <Statistic title="서명 필요" value={3} />
    //     </ProCard>
    //     <Divider type={responsive ? 'horizontal' : 'vertical'} />
    //     <ProCard>
    //       <Statistic title="서명 대기" value={12} />
    //     </ProCard>
    //     <Divider type={responsive ? 'horizontal' : 'vertical'} />
    //     <ProCard>
    //       <Statistic title="전체 문서" value={93} />
    //     </ProCard>
    //   </ProCard.Group>
    // </RcResizeObserver>
    <ProCard.Group title="" direction='row' loading={loadingStatics}>
      <ProCard>
        <Link to='/documentList' state={{ status: '서명 필요' }}>
          <Statistic title="서명 필요" value={toSignNum} valueStyle={{ color: '#3057cf' }} suffix="건" />
        </Link>
      </ProCard>
      <Divider type='vertical' />
      <ProCard>
        <Link to='/documentList' state={{ status: '서명 대기' }}>
          <Statistic title="서명 대기" value={signingNum} suffix="건" />
        </Link>
      </ProCard>
      <Divider type='vertical' />
      <ProCard>
        <Link to='/documentList'>
          <Statistic title="전체 문서" value={totalNum} suffix="건" />
        </Link>
      </ProCard>
    </ProCard.Group>
  )

  const tosign = (
    <ProCard
    colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
    style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
    title="서명 필요 문서"
    bordered={false}
    headerBordered
    extra={<Link to="/documentList" state={{ status: '서명 필요' }}>더보기</Link>}
    loading={loadingToSign}
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
          {/* <div><font color='grey'><Moment format='YYYY/MM/DD'>{item.requestedTime}</Moment></font></div> */}
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div>
          </List.Item>
        )}
      />
    </ProCard>
  )

  const signing = (
    <ProCard
    colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
    style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
    title="서명 대기 문서"
    bordered={false}
    headerBordered
    extra={<Link to="/documentList" state={{ status: '서명 대기' }}>더보기</Link>}
    loading={loadingSigning}
    bodyStyle={{ padding: 10 }}
    >
      <List
        // bordered
        style={{ paddingLeft: 24, paddingRight: 24}}
        dataSource={documentsSigning}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<FileOutlined />}
            title={
              <Link to="/documentList" state={{ status: '서명 대기' }}>
                {item.docTitle}
              </Link>
            }
            // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
          />
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div> 
          </List.Item>
        )}
      />
    </ProCard>
  )

  const noticeList = (
    <ProCard
    colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
    style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
    title="공지사항"
    bordered={false}
    headerBordered
    extra={<Link to="/customer">더보기</Link>}
    loading={loadingNotice}
    bodyStyle={{ padding: 10 }}
    >
      <List
        // bordered
        style={{ paddingLeft: 24, paddingRight: 24}}
        dataSource={notice}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<BellOutlined />}
            title={
              <Link to="/boardDetail" state={{ boardId: item._id }}>
                {item.title}
              </Link>
            }
            // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
          />
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div>
          </List.Item>
        )}
      />
    </ProCard>
  )

  const statics = (
      <ProCard.Group title="" direction='row' loading={loadingStatics}>
      <ProCard>
        <Link to='/documentList' state={{ status: '서명 필요' }}>
          <Statistic title="서명 필요" value={toSignNum} valueStyle={{ color: '#3057cf' }} suffix="건" />
        </Link>
      </ProCard>
      <Divider type='vertical' />
      {/* <ProCard>
        <Link to='/documentList' state={{ status: '서명 대기' }}>
          <Statistic title="서명 대기" value={signingNum} suffix="건" />
        </Link>
      </ProCard>
      <Divider type='vertical' />
      <ProCard>
        <Link to='/documentList' state={{ status: '서명 취소' }}>
          <Statistic title="서명 취소" value={canceledNum} suffix="건" />
        </Link>
      </ProCard>
      <Divider type='vertical' />
      <ProCard>
        <Link to='/documentList'>
          <Statistic title="서명 완료" value={signedNum} suffix="건" />
        </Link>
      </ProCard>
      <Divider type='vertical' /> */}
      <ProCard>
        <Link to='/documentList'>
          <Statistic title="전체 문서" value={totalNum} suffix="건" />
        </Link>
      </ProCard>
    </ProCard.Group>
  )
  
  function renderStatistic(containerWidth, text, style) {
    var _measureTextWidth = (0, measureTextWidth)(text, style),
      textWidth = _measureTextWidth.width,
      textHeight = _measureTextWidth.height;
    var R = containerWidth / 2;
    var scale = 1;
    if (containerWidth < textWidth) {
      scale = Math.min(
        Math.sqrt(
          Math.abs(Math.pow(R, 2) / (Math.pow(textWidth / 2, 2) + Math.pow(textHeight, 2))),
        ),
        1,
      );
    }
    var textStyleStr = 'width:'.concat(containerWidth, 'px;');
    return '<div style="'
      .concat(textStyleStr, ';font-size:')
      .concat(scale, 'em;line-height:')
      .concat(scale < 1 ? 1 : 'inherit', ';">')
      .concat(text, '</div>');
  }
  var data = [
    {
      type: '서명 필요',
      value: toSignNum,
    },
    {
      type: '서명 대기중',
      value: signingNum,
    },
    {
      type: '서명 취소',
      value: canceledNum,
    },
    {
      type: '서명 완료',
      value: signedNum,
    },
  ];
  var config = {
    appendPadding: 10,
    data: data,
    angleField: 'value',
    colorField: 'type',
    color: ({ type }) => {
      if(type === '서명 취소'){
        return '#e36e4d';
      } else if(type === '서명 필요'){
        return '#6ca8fc';
      } else if(type === '서명 대기중'){
        return '#9cd263';
      } else if(type === '서명 완료'){
        return '#cbcbcb';
      }
      return 'grey';
    },
    radius: 1,
    innerRadius: 0.64,
    meta: {
      value: {
        formatter: function formatter(v) {
          return ''.concat(v, ' \xA5');
        },
      },
    },
    label: {
      type: 'inner',
      offset: '-50%',
      style: { textAlign: 'center' },
      autoRotate: false,
      content: '{value}',
    },
    statistic: {
      title: {
        offsetY: -4,
        customHtml: function customHtml(container, view, datum) {
          var _container$getBoundin = container.getBoundingClientRect(),
            width = _container$getBoundin.width,
            height = _container$getBoundin.height;
          var d = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
          var text = datum ? datum.type : '전체 문서';
          return renderStatistic(d, text, { fontSize: 28 });
        },
      },
      content: {
        offsetY: 4,
        style: { fontSize: '18px' },
        customHtml: function customHtml(container, view, datum, data) {
          var _container$getBoundin2 = container.getBoundingClientRect(),
            width = _container$getBoundin2.width;
          var text = datum
            ? ''.concat(datum.value + '건')
            : ''.concat(
                data.reduce(function (r, d) {
                  return r + d.value;
                }, 0) + '건',
              );
          return renderStatistic(width, text, { fontSize: 28 });
        },
      },
    },
    interactions: [
      { type: 'element-selected' },
      { type: 'element-active' },
      { type: 'pie-statistic-active' },
    ],
  };

  const pie = (
    <ProCard title="문서 통계"><Pie {...config} /></ProCard>
  )

  const toSignCard = (
    <Card
    style={{ marginBottom: 24, width:'100%'}}
    title="서명 필요 문서"
    bordered={false}
    extra={<Link to="/documentList" state={{ status: '서명 필요' }}>더보기</Link>}
    loading={loadingToSign}
    bodyStyle={{ padding: 0 }}
  >
    {documentsToSign.length == 0 ? <div style={{padding: 50}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div> :
      documentsToSign.map(item => (
        <Card.Grid style={{width:'50%'}} key={item._id}>
          <Card bodyStyle={{ padding: 0 }} bordered={false}>
            <Card.Meta
              avatar={
                <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
              }
              title={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
              description={
                <Link to="/signDocument" onClick={() => {
                  const docId = item._id;
                  const docRef = item.docRef;
                  dispatch(setDocToSign({ docRef, docId }));
                }}>
                  <font color='#5D7092'>{item.docTitle}</font>
                </Link>
              }
            />
            <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
              {moment(item.requestedTime).fromNow()}
            </span>
            </Card>
        </Card.Grid>
        // <Card.Grid style={{width:'33.3%'}} key={item._id}>
        //   <Card bodyStyle={{ padding: 0 }} bordered={false}>
        //     <Card.Meta
        //       title={(
        //         <div style={{
        //           marginLeft: '0px', lineHeight: '24px', height: '24px', display: 'inline-block', verticalAlign: 'top', fontSize: '15px'
        //         }}>
        //           <Avatar size={22} icon={<UserOutlined />} />&nbsp;&nbsp;
        //             {item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
        //         </div>
        //       )}
        //       description={<Link to="/documentList" state={{ status: '서명 대기' }}>{item.docTitle}</Link>}
        //     />
        //     <div style={{height: '20px', display: 'flex', marginTop: '8px', overflow: 'hidden', fontSize: '12px', lineHeight: '20px', textAlign: 'right'}}>
        //         <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
        //           {moment(item.requestedTime).fromNow()}
        //         </span>
        //     </div>
        //   </Card>
        // </Card.Grid>
      ))
    }
    </Card>
  )

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: headerTitle,
          subTitle: '',
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
            // <Button key="2" onClick={() => {
            //   navigate('/documentList')
            // }}>내 문서함</Button>,
            // <Button key="1" onClick={() => {
            //   dispatch(setSendType('G'));
            //   navigate('/uploadDocument')
            // }} type="primary">
            //   서명 요청
            // </Button>, 
            statics
          ], 
        }}
        content=""
        extraContent=""
        footer={[
        ]}
      >
      <br/>
      {/* <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
      >
        <Row gutter={[24, 24]}>
          <Col span={responsive ? 24 : 16}>{toSignCard}</Col>
          <Col span={responsive ? 24 : 8}>{pie}</Col>
          <Col span={responsive ? 24 : 12} style={{display: 'flex'}}>{signing}</Col>
          <Col span={responsive ? 24 : 12} style={{display: 'flex'}}>{noticeList}</Col>
        </Row>

      </RcResizeObserver> */}

      <Row gutter={24}>
          <Col xl={16} lg={24} md={24} sm={24} xs={24}>
            {toSignCard}
            {signing}<br></br>
          </Col>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            {pie}
            <br></br>
            {noticeList}
          </Col>
      </Row>


      </PageContainer>
    </div>
  );
};

export default Home;