import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { navigate, Link } from '@reach/router';
import { useIntl } from "react-intl";
import { selectUser } from '../../app/infoSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import { setSendType } from '../Assign/AssignSlice';
import axios from 'axios';
import BoardCard from '../Board/BoardCard';
import FAQCard from '../Board/FAQCard';
import ProCard, { StatisticCard, StatisticProps } from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import { Badge, Button, Card, Empty, List, Space, Statistic, Avatar, Row, Col, Progress, Tag } from 'antd';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import {
  FileOutlined,
  SyncOutlined,
  BellOutlined,
  UserOutlined,
  NotificationOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import Moment from 'react-moment';
import moment from "moment";
import "moment/locale/ko";
import styles from './Home.css';
import { Pie, measureTextWidth } from '@ant-design/charts';
import banner from '../../assets/images/sub_top1.png';
import docu from '../../assets/images/docu.svg';
import iconPaperless from '../../assets/images/icon_save1.png';
import iconDocument from '../../assets/images/icon_save2.png';
import iconCheck from '../../assets/images/icon_check.png';
import iconManual from '../../assets/images/icon_manual.png';
import { DocumentType, DocumentTypeText, DocumentTypeBadge, DocumentTypeIcon, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from '../Lists/DocumentType';


const { Divider } = ProCard;

const Home = () => {

  const [tab, setTab] = useState('2');
  const [loadingToSign, setLoadingToSign] = useState(false);
  const [loadingSigning, setLoadingSigning] = useState(false);
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [loadingCanceled, setLoadingCanceled] = useState(false);
  const [loadingSigned, setLoadingSigned] = useState(false);
  const [loadingStatics, setLoadingStatics] = useState(false);
  const [loadingPaperless, setLoadingPaperless] = useState(false);
  // const [loadingNotice, setLoadingNotice] = useState(false);
  const [documentsToSign, setDocumentsToSign] = useState([]);
  const [documentsSigning, setDocumentsSigning] = useState([]);
  const [documentsTotal, setDocumentsTotal] = useState([]);
  const [documentsCanceled, setDocumentsCanceled] = useState([]);
  const [documentsSigned, setDocumentsSigned] = useState([]);
  // const [notice, setNotice] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:6});
  const [responsive, setResponsive] = useState(false);
  const [totalNum, setTotalNum] = useState(0);
  const [toSignNum, setToSignNum] = useState(0);
  const [signingNum, setSigningNum] = useState(0);
  const [canceledNum, setCanceledNum] = useState(0);
  const [signedNum, setSignedNum] = useState(0);
  const [paperlessNum, setPaperlessNum] = useState(0);
  const [docNum, setDocNum] = useState(0);

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id, name, JOB_TITLE } = user;
  const { formatMessage } = useIntl();

  useEffect(() => {
    fetchToSign();
    fetchSigning();
    fetchStatics();
    fetchTotal();
    fetchCanceled();
    fetchSigned();
    fetchPaperless();
    // fetchNotice();
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
      status: '서명 진행'
    }
    const res = await axios.post('/api/document/documents', param)
    if (res.data.success) {
      const documents = res.data.documents;
      setDocumentsSigning(documents)
    }
    setLoadingSigning(false);
  }

  const fetchTotal = async () => {
    setLoadingTotal(true);
    let param = {
      user: _id,
      pagination
    }
    const res = await axios.post('/api/document/documents', param)
    if (res.data.success) {
      const documents = res.data.documents;
      setDocumentsTotal(documents)
    }
    setLoadingTotal(false);
  }

  const fetchCanceled = async () => {
    setLoadingCanceled(true);
    let param = {
      user: _id,
      pagination,
      status: '서명 취소'
    }
    const res = await axios.post('/api/document/documents', param)
    if (res.data.success) {
      const documents = res.data.documents;
      setDocumentsCanceled(documents)
    }
    setLoadingCanceled(false);
  }

  const fetchSigned = async () => {
    setLoadingSigned(true);
    let param = {
      user: _id,
      pagination,
      status: '서명 완료'
    }
    const res = await axios.post('/api/document/documents', param)
    if (res.data.success) {
      const documents = res.data.documents;
      setDocumentsSigned(documents)
    }
    setLoadingSigned(false);
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

  const fetchPaperless = async () => {
    setLoadingPaperless(true);
    let param = {
      user: _id
    }
    const res = await axios.post('/api/users/paperless', param)
    if (res.data.success) {
      setPaperlessNum(res.data.paperless)
      setDocNum(res.data.docCount)
    }
    setLoadingPaperless(false);
  }

  // const fetchNotice = async () => {
  //   setLoadingNotice(true);
  //   let param = {
  //     boardType: 'notice',
  //     pagination
  //   }
  //   const res = await axios.post('/api/board/list', param)
  //   if (res.data.success) {
  //     const boards = res.data.boards;
  //     setNotice(boards)
  //   }
  //   setLoadingNotice(false);
  // }

  const IconLink = ({ src, text }) => (
    <a style={{marginRight:'16px', lineHeight:'24px'}}>
      <img style={{marginRight:'8px', width:'42px', height:'42px'}} src={src} alt={text} />
      <font color='#373737'>{text}</font>
    </a>
  );

  const headerTitle = (
    // <Space size={3}>    
    //   <Avatar size={38} icon={<UserOutlined />} />
    //   <div>{name} {JOB_TITLE}</div>
    // </Space>
    <div><img src={banner}></img></div>
  )

  const renderBadge = (count, active = false) => {
    return (
      <Badge
        count={count}
        style={{
          marginTop: -2,
          marginLeft: 4,
          color: active ? '#1890FF' : '#999',
          backgroundColor: active ? '#E6F7FF' : '#eee',
        }}
      />
    );
  };

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
        <Link to='/documentList' state={{ status: '서명 진행' }}>
          <Statistic title="서명 진행" value={signingNum} suffix="건" />
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
                const docType = item.docType;
                dispatch(setDocToSign({ docRef, docId, docType }));
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
    title={<div>서명 진행 문서 {renderBadge(signingNum, false)}</div>}
    bordered={false}
    headerBordered
    extra={<Link to="/documentList" state={{ status: '서명 진행' }}>더보기</Link>}
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
              <Link to="/documentList" state={{ status: '서명 진행' }}>
                {item.docTitle}
              </Link>
            }
            // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
            description={<Progress percent={Math.round((item.signedBy.length / item.users.length) * 100)} steps={item.users.length} status="active" />}
          />
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div> 
          </List.Item>
        )}
      />
    </ProCard>
  )

  // const noticeList = (
  //   <ProCard
  //   colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
  //   style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
  //   title="공지사항"
  //   bordered={false}
  //   headerBordered
  //   extra={<Link to="/customer">더보기</Link>}
  //   loading={loadingNotice}
  //   bodyStyle={{ padding: 10 }}
  //   >
  //     <List
  //       // bordered
  //       style={{ paddingLeft: 24, paddingRight: 24}}
  //       dataSource={notice}
  //       renderItem={item => (
  //         <List.Item>
  //         <List.Item.Meta
  //           avatar={<NotificationOutlined style={{ fontSize: 16 }} />}
  //           title={
  //             <Link to="/boardDetail" state={{ boardId: item._id }}>
  //               {item.title}
  //             </Link>
  //           }
  //           // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
  //         />
  //           <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div>
  //         </List.Item>
  //       )}
  //     />
  //   </ProCard>
  // )

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
      type: '서명 진행',
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
      } else if(type === '서명 진행'){
        return '#cbcbcb';
      } else if(type === '서명 완료'){
        return '#9cd263';
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

  const paperless = (
    // <ProCard 
    //   title="My Paperless"
    //   loading={loadingPaperless}
    //   tooltip="본인이 서명 요청한 문서가 서명 완료된 경우"
    // >
    //   {paperlessNum}
    // </ProCard>

    <StatisticCard.Group loading={loadingPaperless} title='절약 건수' tooltip='본인이 서명 요청하여 완료된 건수를 기준으로 산정'>
      <StatisticCard
        statistic={{
          title: '페이퍼리스',
          value: paperlessNum,
          icon: (
            <img
              style={{display: 'block', width: 42, height: 42}}
              // src="https://gw.alipayobjects.com/mdn/rms_7bc6d8/afts/img/A*dr_0RKvVzVwAAAAAAAAAAABkARQnAQ"
              src={iconPaperless}
              alt="icon"
            />
          ),
        }}
      />
      <StatisticCard
        statistic={{
          title: '문서',
          // tip: '본인이 서명 요청하여 완료된 건수를 기준으로 산정',
          value: docNum,
          icon: (
            <img
              style={{display: 'block', width: 42, height: 42}}
              src={iconDocument}
              // src="https://gw.alipayobjects.com/mdn/rms_7bc6d8/afts/img/A*-jVKQJgA1UgAAAAAAAAAAABkARQnAQ"
              alt="icon"
            />
          ),
        }}
      />
    </StatisticCard.Group>

  )

  const direct = (
    <ProCard title="바로 가기">
      <Space>
        <Link to='/auditCheck'>
        <IconLink
          src={iconCheck}
          text="문서 진본 확인"
        />
        </Link>

        <IconLink
          src={iconManual}
          text="사용자 매뉴얼"
        />
        {/* <Button onClick={()=> {navigate('/auditCheck')}} icon={<FileProtectOutlined />}>문서 진본 확인</Button> */}
      </Space>
    </ProCard>
  )

  const toSignCard = (
    <Card
    style={{ marginBottom: 24, width:'100%'}}
    title={<div>서명 필요 문서 {renderBadge(toSignNum, true)}</div>}
    bordered={false}
    extra={<Link to="/documentList" state={{ status: '서명 필요' }}>더보기</Link>}
    loading={loadingToSign}
    bodyStyle={{ padding: 0 }}
  >
    {documentsToSign.length == 0 ? <div style={{padding: 50}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div> :
      documentsToSign.map(item => (
        <Card.Grid style={{width:'50%'}} key={item._id}>
          <Card bodyStyle={{ padding: 0 }} bordered={false}>
            {/* <Card.Meta
              avatar={
                item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={35} icon={<UserOutlined />} />
                // <Avatar src="data:image/gif;base64,R0lGODlhAAEAAcQAALe9v9ve3/b393mDiJScoO3u74KMkMnNz4uUmKatsOTm552kqK+1uNLW18DFx3B7gP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjAxODAxMTc0MDcyMDY4MTE5QjEwQjYyNTc4MkUxRURBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjEzN0VEMDZBQjMyNzExRTE4REMzRUZGMkFCOTM1NkZBIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjEzN0VEMDY5QjMyNzExRTE4REMzRUZGMkFCOTM1NkZBIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgTWFjaW50b3NoIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDI4MDExNzQwNzIwNjgxMTlCMTBCNjI1NzgyRTFFREEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDE4MDExNzQwNzIwNjgxMTlCMTBCNjI1Nzgy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" />
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
            /> */}
            <Link to="/signDocument" onClick={() => {
                  const docId = item._id;
                  const docRef = item.docRef;
                  const docType = item.docType;
                  dispatch(setDocToSign({ docRef, docId, docType }));
            }}>
              <Card.Meta
                // title={}
                description={
                  <div>
                    <p><FileOutlined />&nbsp;&nbsp;<font color='black'>{item.docTitle}</font></p>
                    {item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp;
                    {item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
                    <p>
                      <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
                        {moment(item.requestedTime).fromNow()}
                      </span>
                    </p>
                  </div>
                }
              />
            </Link>
            {/* <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
              {moment(item.requestedTime).fromNow()}
            </span> */}
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





  const loadmore = (target) => {
    return (
      <div
      style={{
        textAlign: 'center',
        marginTop: 12,
        height: 32,
        lineHeight: '32px',
      }}
      >
        <Button onClick={() => { navigate('/documentList', { state: {status: target}})}}>더보기</Button>
    </div>
    ) 
  }

  const contentTotal = (
    <ProCard
      colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
      style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
      // title={<div>서명 진행 문서 {renderBadge(signingNum, false)}</div>}
      bordered={false}
      headerBordered
      // extra={<Link to="/documentList" state={{ status: '서명 진행' }}>더보기</Link>}
      loading={loadingTotal}
      bodyStyle={{ padding: 0 }}
    >
      <List
        // bordered
        style={{ paddingLeft: 10, paddingRight: 10}}
        loadMore={totalNum > 6 ? loadmore('') : ''}
        dataSource={documentsTotal}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<DocumentTypeText uid={_id} document={item} />}
            title={
              <Link to="/documentList" state={{ status: '', docId: item._id }}>
                {item.docTitle}
              </Link>
            }
            description={'by' + item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
          />
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div> 
          </List.Item>
        )}
      />
    </ProCard>
  )

  const contentSigning = (
    <ProCard
      colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
      style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
      // title={<div>서명 진행 문서 {renderBadge(signingNum, false)}</div>}
      bordered={false}
      headerBordered
      // extra={<Link to="/documentList" state={{ status: '서명 진행' }}>더보기</Link>}
      loading={loadingSigning}
      bodyStyle={{ padding: 0 }}
    >
      <List
        // bordered
        style={{ paddingLeft: 10, paddingRight: 10}}
        loadMore={signingNum > 6 ? loadmore('서명 진행') : ''}
        dataSource={documentsSigning}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<FileOutlined />}
            title={
              <Link to="/documentList" state={{ status: '서명 진행', docId: item._id }}>
                {item.docTitle}
              </Link>
            }
            // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
            description={<Progress percent={Math.round((item.signedBy.length / item.users.length) * 100)} steps={item.users.length} status="active" />}
          />
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div> 
          </List.Item>
        )}
      />
    </ProCard>
  )

  const contentToSign = (
    <Card
    style={{ marginBottom: 0, width:'100%'}}
    // title={<div>서명 필요 문서 {renderBadge(toSignNum, true)}</div>}
    bordered={false}
    // extra={<Link to="/documentList" state={{ status: '서명 필요' }}>더보기</Link>}
    loading={loadingToSign}
    bodyStyle={{ padding: 0 }}
  >
    {documentsToSign.length == 0 ? <div style={{padding: 50}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div> :
      documentsToSign.map(item => (
        <Card.Grid style={{width:'50%'}} key={item._id}>
          <Card bodyStyle={{ padding: 0 }} bordered={false}>
            <Link to="/signDocument" onClick={() => {
                  const docId = item._id;
                  const docRef = item.docRef;
                  const docType = item.docType;
                  dispatch(setDocToSign({ docRef, docId, docType }));
            }}>
              <Card.Meta
                // title={}
                description={
                  <div>
                    <p><FileOutlined />&nbsp;&nbsp;<font color='black'>{item.docTitle}</font></p>
                    {item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp;
                    {item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
                    <p>
                      <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
                        {moment(item.requestedTime).fromNow()}
                      </span>
                    </p>
                  </div>
                }
              />
            </Link>
            </Card> 
        </Card.Grid>
      ))
    }
    </Card>
  )

  const contentToSignThumbnail = (
    <Card
    style={{ marginBottom: 0, width:'100%'}}
    // title={<div>서명 필요 문서 {renderBadge(toSignNum, true)}</div>}
    bordered={false}
    // extra={<Link to="/documentList" state={{ status: '서명 필요' }}>더보기</Link>}
    loading={loadingToSign}
    bodyStyle={{ padding: 0 }}
  >
    {documentsToSign.length == 0 ? <div style={{padding: 50}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'서명 할 문서가 없습니다.'} /></div> :
      

      // <Row gutter={[16, 16]}>
      //   {documentsToSign.map(item=>{
      //     return  <Col style={{display: 'flex'}}>

      //       <Link to="/signDocument" onClick={() => {
      //         const docId = item._id;
      //         const docRef = item.docRef;
      //         const docType = item.docType;
      //         dispatch(setDocToSign({ docRef, docId, docType }));
      //       }}>
      //         <ProCard 
      //           hoverable
      //           bordered
      //           title={<div style={{ wordWrap: 'break-word', wordBreak: 'break-word', width: '200px' }}>{item.docTitle}</div>}
      //           // tooltip={moment(item.requestedTime).fromNow() + ' ' + item.user.name + ' ' + item.user.JOB_TITLE + ' ' + '생성'}
      //           // extra={moment(item.requestedTime).fromNow()}
      //           // subTitle={<Tag color="#5BD8A6">private</Tag>}
      //           // colSpan="200px" 
      //           layout="center" 
      //           style={{ minWidth: "200px", height: 'inherit' }}
      //           actions={[
      //             <div>{item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp; {item.user.name + ' ' + item.user.JOB_TITLE}</div>,
      //             <div>{moment(item.requestedTime).fromNow()}</div>,
      //             // <Button type="text" icon={<FormOutlined />} onClick={e => { signTemplate(item) }}>서명요청</Button>,
      //             // <Button type="text" icon={<FilePdfOutlined />} onClick={e => { navigate('/previewPDF', {state: {docRef:item.docRef, docTitle:item.docTitle}}) }}>파일보기</Button>,
      //             // <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(item._id) }}>삭제</Button>,
      //           ]}>
      //             <div><img src={item.thumbnail} style={{ maxWidth:'100%', height:'100%'}} /></div>
      //         </ProCard>
      //       </Link>

      //     </Col>;
      //   })}
      // </Row>

      <List
      rowKey="id"
      loading={loadingToSign}
      grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
      dataSource={documentsToSign}
      loadMore={toSignNum > 6 ? loadmore('서명 필요') : ''}
      renderItem={item => (
        <List.Item key={item._id}>

          <Link to="/signDocument" onClick={() => {
            const docId = item._id;
            const docRef = item.docRef;
            const docType = item.docType;
            const docUser = item.user;
            const observers = item.observers;
           dispatch(setDocToSign({ docRef, docId, docType, docUser, observers }));
          }}>
            <ProCard 
              hoverable
              bordered
              title={<div style={{ wordWrap: 'break-word', wordBreak: 'break-word', maxWidth: '280px' }}>{item.docTitle}</div>}
              // tooltip={moment(item.requestedTime).fromNow() + ' ' + item.user.name + ' ' + item.user.JOB_TITLE + ' ' + '생성'}
              // extra={moment(item.requestedTime).fromNow()}
              // subTitle={<Tag color="#5BD8A6">private</Tag>}
              // colSpan="200px" 
              layout="center" 
              style={{ minWidth: "300px", height: "100%" }} // 470px -> 100%
              bodyStyle={{ padding: "5px"}}
              actions={[
                <div>{item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp; {item.user.name + ' ' + item.user.JOB_TITLE}</div>,
                <div>{moment(item.requestedTime).fromNow()}</div>,
                // <Button type="text" icon={<FormOutlined />} onClick={e => { signTemplate(item) }}>서명요청</Button>,
                // <Button type="text" icon={<FilePdfOutlined />} onClick={e => { navigate('/previewPDF', {state: {docRef:item.docRef, docTitle:item.docTitle}}) }}>파일보기</Button>,
                // <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(item._id) }}>삭제</Button>,
              ]}>
                <div><img src={item.thumbnail} style={{ width:'280px'}} /></div>
            </ProCard>
          </Link>
        </List.Item>
      )}
      />


      // documentsToSign.map(item => (
      //   <Card.Grid style={{width:'50%'}} key={item._id}>
      //     <Card bodyStyle={{ padding: 0 }} bordered={false}>
      //       <Link to="/signDocument" onClick={() => {
      //             const docId = item._id;
      //             const docRef = item.docRef;
      //             const docType = item.docType;
      //             dispatch(setDocToSign({ docRef, docId, docType }));
      //       }}>
      //         <Card.Meta
      //           // title={}
      //           description={
      //             <div>
      //               <p><FileOutlined />&nbsp;&nbsp;<font color='black'>{item.docTitle}</font></p>
      //               {item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp;
      //               {item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
      //               <p>
      //                 <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
      //                   {moment(item.requestedTime).fromNow()} ss
      //                 </span>
      //               </p>
      //             </div>
      //           }
      //         />
      //       </Link>
      //       </Card> 
      //   </Card.Grid>
      // ))
    }
    </Card>
  )

  const contentCanceled = (
    <ProCard
      colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
      style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
      bordered={false}
      headerBordered
      loading={loadingCanceled}
      bodyStyle={{ padding: 0 }}
    >
      <List
        // bordered
        style={{ paddingLeft: 10, paddingRight: 10}}
        loadMore={canceledNum > 6 ? loadmore('서명 취소') : ''}
        dataSource={documentsCanceled}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<DocumentTypeText uid={_id} document={item} />}
            title={
              <Link to="/documentList" state={{ status: '서명 취소', docId: item._id }}>
                {item.docTitle}
              </Link>
            }
            description={ '서명 취소자: ' + item.users.filter(e => e._id === item.canceledBy[0].user)[0].name + ' ' + item.users.filter(e => e._id === item.canceledBy[0].user)[0].JOB_TITLE + '(' + item.canceledBy[0].message + ')' }
            // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
          />
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div> 
          </List.Item>
        )}
      />
    </ProCard>
  )

  const contentSigned = (
    <ProCard
      colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
      style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
      bordered={false}
      headerBordered
      loading={loadingSigned}
      bodyStyle={{ padding: 0 }}
    >
      <List
        // bordered
        style={{ paddingLeft: 10, paddingRight: 10}}
        loadMore={signedNum > 6 ? loadmore('서명 완료') : ''}
        dataSource={documentsSigned}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<DocumentTypeText uid={_id} document={item} />}
            title={
              <Link to="/documentList" state={{ status: '서명 완료', docId: item._id }}>
                {item.docTitle}
              </Link>
            }
            description={'by' + item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
          />
            <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div> 
          </List.Item>
        )}
      />
    </ProCard>
  )


  const items = [
    { key: '1', title: '전체', value: totalNum, total: true },
    { key: '2', status: 'processing', title: '내 서명 필요', value: toSignNum },
    { key: '3', status: 'default', title: '상대 서명 진행중', value: signingNum },
    { key: '4', status: 'error', title: '서명 취소됨', value: canceledNum },
    { key: '5', status: 'success', title: '서명 완료', value: signedNum },
  ];

  const staticAllContent = (key) => {
    if (key === '1') {
      return contentTotal
    } else if (key === '2') {
      return contentToSignThumbnail     
    } else if (key === '3') {
        return contentSigning     
    } else if (key === '4') {
        return contentCanceled
    } else if (key === '5') {
      return contentSigned
    } else {
      return contentTotal
    }
  }

  const staticsAll = (
    <ProCard
      bodyStyle={{ padding:0 }}
      tabs={{
        activeKey: tab,
        onChange: (key) => {
          setTab(key)
        },
      }}
    >
      {items.map((item) => (
        <ProCard.TabPane
          style={{ width: '100%' }}
          key={item.key}
          tab={
            <StatisticCard
              statistic={{
                title: item.title,
                value: item.value,
                status: item.status,
              }}
              style={{ width: 120, borderRight: item.total ? '1px solid #f0f0f0' : undefined }}
            />
          }
        >

          <div>
            {staticAllContent(item.key)}
          </div>
          
        </ProCard.TabPane>
      ))}
    </ProCard>
  )

  return (
    <div>
      <div style={{background: 'white',padding:0, marginTop:'-24px', marginLeft:'-24px', marginRight:'-24px', marginBottom:'24px'}}>
        <img src={banner} />
      </div>

      <Row gutter={24}>
          <Col xl={16} lg={24} md={24} sm={24} xs={24}>
            {staticsAll}<br></br>
            <Row gutter={24}>
              <Col xl={12} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
                <BoardCard boardType={'notice'} boardName={'공지사항'}></BoardCard>
              </Col>
              <Col xl={12} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
              <FAQCard boardType={'faq'} boardName={'FAQ'}></FAQCard>
              </Col>
            </Row>
          </Col>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            {pie}
            <br></br>
            {paperless}
            <br></br>
            {direct}
          </Col>
      </Row>
      
      {/* <PageContainer
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
            <Button key="2" onClick={() => {
              navigate('/documentList')
            }}>내 문서함</Button>,
            <Button key="1" onClick={() => {
              dispatch(setSendType('G'));
              navigate('/uploadDocument')
            }} type="primary">
              서명 요청
            </Button>, 
            // statics
          ], 
        }}
        content=""
        extraContent=""
        footer={[
        ]}
      >
      <br/>
      <Row gutter={24}>
          <Col xl={16} lg={24} md={24} sm={24} xs={24}>
            {staticsAll}<br></br>
            <Row gutter={24}>
              <Col xl={12} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
                <BoardCard boardType={'notice'} boardName={'공지사항'}></BoardCard>
              </Col>
              <Col xl={12} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
              <FAQCard boardType={'faq'} boardName={'FAQ'}></FAQCard>
              </Col>
            </Row>
          </Col>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            {pie}
            <br></br>
            {paperless}
            <br></br>
            {direct}
          </Col>
      </Row>

      </PageContainer> */}
    </div>
  );
};

export default Home;