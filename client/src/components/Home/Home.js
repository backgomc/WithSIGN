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
import OpinionCard from '../Board/OpinionCard';
import DirectCard from '../Customer/DirectCard';
import PaperlessCard from '../Statics/PaperlessCard';
import ProCard, { StatisticCard, StatisticProps } from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import { Tooltip, Badge, Button, Card, Empty, List, Space, Statistic, Avatar, Row, Col, Progress, Tag, Comment, Form, Input } from 'antd';
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
import { DocumentType, DocumentTypeText, DocumentTypeBadge, DocumentTypeIcon } from '../Lists/DocumentType';
import {DOCUMENT_TODO, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM} from '../../common/Constants';

import { CheckCard } from '@ant-design/pro-card';
import BTN01 from '../../assets/images/btn_board01.png';
import BTN02 from '../../assets/images/btn_board02.png';
import BTN03 from '../../assets/images/btn_board03.png';
import BTN04 from '../../assets/images/btn_board04.png';
import BTN05 from '../../assets/images/btn_board05.png';

import BTN01_ON from '../../assets/images/btn_board01_On.png';
import BTN02_ON from '../../assets/images/btn_board02_On.png';
import BTN03_ON from '../../assets/images/btn_board03_On.png';
import BTN04_ON from '../../assets/images/btn_board04_On.png';
import BTN05_ON from '../../assets/images/btn_board05_On.png';

import styled from 'styled-components';
const CardTitle = styled.div`
  // 한줄 자르기
  display: inline-block; 
  width: 140px; 
  // white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;

  // 여러줄 자르기 추가 속성 
  position:relative;
  white-space: normal; 
  line-height: 1.2; 
  height: 2.2em; 
  text-align: left; 
  word-wrap: break-word; 
  display: -webkit-box; 
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  // 폰트 속성
  color: #666666;
  font-size: 0.9em;
    `;

const MyStyle = styled.div`
  .ant-pro-checkcard-title {
    text-align: right;
    font-size: 14px;
    color: #666666;
    margin: 0px 0px 0px 0px;
  } 
  .ant-pro-checkcard-description {
    font-weight: bold;
    color: #111111;
    font-size: 22px;
    margin: -3px 0px 0px 0px;
  }
  .ant-pro-checkcard {
    // minWidth: 207px;
    width: 100%;
    border: none;
    margin-right: 0.8em;
  }
  .ant-pro-checkcard-content {
    padding: 23px 20px 20px 20px;
  }
  .ant-avatar {
    // max-height: 100%;
    height: 60px;
    width: 60px;
    // vertical-align: middle;
  }
  .ant-pro-checkcard-detail {
    padding-left: 0.5em;
  }
`;

const MyStyle_Total = styled.div` 
display: inline;
.ant-pro-checkcard-checked {
  background-color: #efb63b;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const MyStyle_ToSign = styled.div` 
display: inline;
.ant-pro-checkcard-checked {
  background-color: #54c6e8;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const MyStyle_Signing = styled.div` 
display: inline;
.ant-pro-checkcard-checked {
  background-color: #9694ff;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const MyStyle_Canceled = styled.div` 
display: inline;
.ant-pro-checkcard-checked {
background-color: #fe7975;
// border-color: #1890ff;
border: none;
.ant-pro-checkcard-title {
  color: white;
}
.ant-pro-checkcard-description {
  color: white;
}
}
`;

const MyStyle_Signed = styled.div` 
display: inline;
.ant-pro-checkcard-checked {
  background-color: #5ddab4;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;
    
const { Divider } = ProCard;
const { TextArea } = Input;

const Home = () => {

  const [tab, setTab] = useState('2');
  const [loadingToSign, setLoadingToSign] = useState(false);
  const [loadingSigning, setLoadingSigning] = useState(false);
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [loadingCanceled, setLoadingCanceled] = useState(false);
  const [loadingSigned, setLoadingSigned] = useState(false);
  const [loadingStatics, setLoadingStatics] = useState(false);
  // const [loadingPaperless, setLoadingPaperless] = useState(false);
  // const [loadingNotice, setLoadingNotice] = useState(false);
  const [documentsToSign, setDocumentsToSign] = useState([]);
  const [documentsSigning, setDocumentsSigning] = useState([]);
  const [documentsTotal, setDocumentsTotal] = useState([]);
  const [documentsCanceled, setDocumentsCanceled] = useState([]);
  const [documentsSigned, setDocumentsSigned] = useState([]);
  // const [notice, setNotice] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:5});
  const [responsive, setResponsive] = useState(false);
  const [totalNum, setTotalNum] = useState(0);
  const [toSignNum, setToSignNum] = useState(0);
  const [signingNum, setSigningNum] = useState(0);
  const [canceledNum, setCanceledNum] = useState(0);
  const [signedNum, setSignedNum] = useState(0);
  // const [paperlessNum, setPaperlessNum] = useState(0);
  // const [docNum, setDocNum] = useState(0);

  const [imgTotal, setImgTotal] = useState(BTN01);
  const [imgToSign, setImgToSign] = useState(BTN02_ON);
  const [imgSigning, setImgSigning] = useState(BTN03);
  const [imgCanceled, setImgCanceled] = useState(BTN04);
  const [imgSigned, setImgSigned] = useState(BTN05);

  const [checkTotal, setCheckTotal] = useState(false);
  const [checkToSign, setCheckToSign] = useState(true);
  const [checkSigning, setCheckSigning] = useState(false);
  const [checkCanceled, setCheckCanceled] = useState(false);
  const [checkSigned, setCheckSigned] = useState(false);

  const [checked, setChecked] = useState('2');

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
    // fetchPaperless();
    // fetchNotice();
  }, []);

  const fetchToSign = async () => {
    setLoadingToSign(true);
    let param = {
      user: _id,
      pagination,
      status: DOCUMENT_TOSIGN,
      includeBulk: true
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
      status: DOCUMENT_SIGNING,
      includeBulk: true
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
      pagination,
      includeBulk: true
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
      status: DOCUMENT_CANCELED,
      includeBulk: true
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
      status: DOCUMENT_SIGNED,
      includeBulk: true
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

  // const extraContent = (
  //   <ProCard.Group title="" direction='row' loading={loadingStatics}>
  //     <ProCard>
  //       <Link to='/documentList' state={{ status: '서명 필요' }}>
  //         <Statistic title="서명 필요" value={toSignNum} valueStyle={{ color: '#3057cf' }} suffix="건" />
  //       </Link>
  //     </ProCard>
  //     <Divider type='vertical' />
  //     <ProCard>
  //       <Link to='/documentList' state={{ status: '서명 진행' }}>
  //         <Statistic title="서명 진행" value={signingNum} suffix="건" />
  //       </Link>
  //     </ProCard>
  //     <Divider type='vertical' />
  //     <ProCard>
  //       <Link to='/documentList'>
  //         <Statistic title="전체 문서" value={totalNum} suffix="건" />
  //       </Link>
  //     </ProCard>
  //   </ProCard.Group>
  // ) 

  // const tosign = (
  //   <ProCard
  //   colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
  //   style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
  //   title="서명 필요 문서"
  //   bordered={false}
  //   headerBordered
  //   extra={<Link to="/documentList" state={{ status: '서명 필요' }}>더보기</Link>}
  //   loading={loadingToSign}
  //   bodyStyle={{ padding: 10 }}
  //   >
  //     <List
  //       // bordered
  //       style={{ paddingLeft: 24, paddingRight: 24}}
  //       dataSource={documentsToSign}
  //       renderItem={item => (
  //         <List.Item>
  //         <List.Item.Meta
  //           avatar={<FileOutlined />}
  //           title={
  //             <Link to="/signDocument" onClick={() => {
  //               const docId = item._id;
  //               const docRef = item.docRef;
  //               const docType = item.docType;
  //               dispatch(setDocToSign({ docRef, docId, docType }));
  //             }}>
  //               {item.docTitle}
  //             </Link>
  //           }
  //           // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
  //         />
  //         {/* <div><font color='grey'><Moment format='YYYY/MM/DD'>{item.requestedTime}</Moment></font></div> */}
  //           <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div>
  //         </List.Item>
  //       )}
  //     />
  //   </ProCard>
  // )

  // const signing = (
  //   <ProCard
  //   colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
  //   style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
  //   title={<div>서명 진행 문서 {renderBadge(signingNum, false)}</div>}
  //   bordered={false}
  //   headerBordered
  //   extra={<Link to="/documentList" state={{ status: '서명 진행' }}>더보기</Link>}
  //   loading={loadingSigning}
  //   bodyStyle={{ padding: 10 }}
  //   >
  //     <List
  //       // bordered
  //       style={{ paddingLeft: 24, paddingRight: 24}}
  //       dataSource={documentsSigning}
  //       renderItem={item => (
  //         <List.Item>
  //         <List.Item.Meta
  //           avatar={<FileOutlined />}
  //           title={
  //             <Link to="/documentList" state={{ status: '서명 진행' }}>
  //               {item.docTitle}
  //             </Link>
  //           }
  //           // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
  //           description={<Progress percent={Math.round((item.signedBy.length / item.users.length) * 100)} steps={item.users.length} status="active" />}
  //         />
  //           <div><font color='grey'>{moment(item.requestedTime).fromNow()}</font></div> 
  //         </List.Item>
  //       )}
  //     />
  //   </ProCard>
  // )

  // const statics = (
  //     <ProCard.Group title="" direction='row' loading={loadingStatics}>
  //     <ProCard>
  //       <Link to='/documentList' state={{ status: '서명 필요' }}>
  //         <Statistic title="서명 필요" value={toSignNum} valueStyle={{ color: '#3057cf' }} suffix="건" />
  //       </Link>
  //     </ProCard>
  //     <Divider type='vertical' />
  //     {/* <ProCard>
  //       <Link to='/documentList' state={{ status: '서명 대기' }}>
  //         <Statistic title="서명 대기" value={signingNum} suffix="건" />
  //       </Link>
  //     </ProCard>
  //     <Divider type='vertical' />
  //     <ProCard>
  //       <Link to='/documentList' state={{ status: '서명 취소' }}>
  //         <Statistic title="서명 취소" value={canceledNum} suffix="건" />
  //       </Link>
  //     </ProCard>
  //     <Divider type='vertical' />
  //     <ProCard>
  //       <Link to='/documentList'>
  //         <Statistic title="서명 완료" value={signedNum} suffix="건" />
  //       </Link>
  //     </ProCard>
  //     <Divider type='vertical' /> */}
  //     <ProCard>
  //       <Link to='/documentList'>
  //         <Statistic title="전체 문서" value={totalNum} suffix="건" />
  //       </Link>
  //     </ProCard>
  //   </ProCard.Group>
  // )
  
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
      type: DOCUMENT_TOSIGN,
      value: toSignNum,
    },
    {
      type: DOCUMENT_SIGNING,
      value: signingNum,
    },
    {
      type: DOCUMENT_CANCELED,
      value: canceledNum,
    },
    {
      type: DOCUMENT_SIGNED,
      value: signedNum,
    },
  ];
  var config = {
    appendPadding: 10,
    data: data,
    angleField: 'value',
    colorField: 'type',
    color: ({ type }) => {
      if(type === DOCUMENT_CANCELED){
        return '#fe7975';
      } else if(type === DOCUMENT_TOSIGN){
        return '#54c6e8';
      } else if(type === DOCUMENT_SIGNING){
        return '#9694ff';
      } else if(type === DOCUMENT_SIGNED){
        return '#5ddab4';
      }
      return '#efb63b';
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

  // const toSignCard = (
  //   <Card
  //   style={{ marginBottom: 24, width:'100%'}}
  //   title={<div>서명 필요 문서 {renderBadge(toSignNum, true)}</div>}
  //   bordered={false}
  //   extra={<Link to="/documentList" state={{ status: DOCUMENT_TOSIGN }}>더보기</Link>}
  //   loading={loadingToSign}
  //   bodyStyle={{ padding: 0 }}
  // >
  //   {documentsToSign.length == 0 ? <div style={{padding: 50}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div> :
  //     documentsToSign.map(item => (
  //       <Card.Grid style={{width:'50%'}} key={item._id}>
  //         <Card bodyStyle={{ padding: 0 }} bordered={false}>
  //           {/* <Card.Meta
  //             avatar={
  //               item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={35} icon={<UserOutlined />} />
  //             }
  //             title={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
  //             description={
  //               <Link to="/signDocument" onClick={() => {
  //                 const docId = item._id;
  //                 const docRef = item.docRef;
  //                 dispatch(setDocToSign({ docRef, docId }));
  //               }}>
  //                 <font color='#5D7092'>{item.docTitle}</font>
  //               </Link>
  //             }
  //           /> */}
  //           <Link to="/signDocument" onClick={() => {
  //                 const docId = item._id;
  //                 const docRef = item.docRef;
  //                 const docType = item.docType;
  //                 dispatch(setDocToSign({ docRef, docId, docType }));
  //           }}>
  //             <Card.Meta
  //               // title={}
  //               description={
  //                 <div>
  //                   <p><FileOutlined />&nbsp;&nbsp;<font color='black'>{item.docTitle}</font></p>
  //                   {item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp;
  //                   {item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
  //                   <p>
  //                     <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
  //                       {moment(item.requestedTime).fromNow()}
  //                     </span>
  //                   </p>
  //                 </div>
  //               }
  //             />
  //           </Link>
  //           {/* <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
  //             {moment(item.requestedTime).fromNow()}
  //           </span> */}
  //           </Card>
            
  //       </Card.Grid>
  //       // <Card.Grid style={{width:'33.3%'}} key={item._id}>
  //       //   <Card bodyStyle={{ padding: 0 }} bordered={false}>
  //       //     <Card.Meta
  //       //       title={(
  //       //         <div style={{
  //       //           marginLeft: '0px', lineHeight: '24px', height: '24px', display: 'inline-block', verticalAlign: 'top', fontSize: '15px'
  //       //         }}>
  //       //           <Avatar size={22} icon={<UserOutlined />} />&nbsp;&nbsp;
  //       //             {item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
  //       //         </div>
  //       //       )}
  //       //       description={<Link to="/documentList" state={{ status: '서명 대기' }}>{item.docTitle}</Link>}
  //       //     />
  //       //     <div style={{height: '20px', display: 'flex', marginTop: '8px', overflow: 'hidden', fontSize: '12px', lineHeight: '20px', textAlign: 'right'}}>
  //       //         <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
  //       //           {moment(item.requestedTime).fromNow()}
  //       //         </span>
  //       //     </div>
  //       //   </Card>
  //       // </Card.Grid>
  //     ))
  //   }
  //   </Card>
  // )

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
        <Button onClick={() => { navigate('/documentList', { state: {status: target, includeBulk: true}})}}>더보기</Button>
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
            avatar={<DocumentTypeBadge uid={_id} document={item} />}
            title={
              <Link to="/documentList" state={{ status: '', docId: item._id, includeBulk: true }}>
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
        loadMore={signingNum > 6 ? loadmore(DOCUMENT_SIGNING) : ''}
        dataSource={documentsSigning}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<DocumentTypeBadge uid={_id} document={item} />}
            title={
              <Link to="/documentList" state={{ status: DOCUMENT_SIGNING, docId: item._id, includeBulk: true }}>
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

  // const contentToSign = (
  //   <Card
  //   style={{ marginBottom: 0, width:'100%'}}
  //   // title={<div>서명 필요 문서 {renderBadge(toSignNum, true)}</div>}
  //   bordered={false}
  //   // extra={<Link to="/documentList" state={{ status: '서명 필요' }}>더보기</Link>}
  //   loading={loadingToSign}
  //   bodyStyle={{ padding: 0 }}
  // >
  //   {documentsToSign.length == 0 ? <div style={{padding: 50}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div> :
  //     documentsToSign.map(item => (
  //       <Card.Grid style={{width:'50%'}} key={item._id}>
  //         <Card bodyStyle={{ padding: 0 }} bordered={false}>
  //           <Link to="/signDocument" onClick={() => {
  //                 const docId = item._id;
  //                 const docRef = item.docRef;
  //                 const docType = item.docType;
  //                 dispatch(setDocToSign({ docRef, docId, docType }));
  //           }}>
  //             <Card.Meta
  //               // title={}
  //               description={
  //                 <div>
  //                   <p><FileOutlined />&nbsp;&nbsp;<font color='black'>{item.docTitle}</font></p>
  //                   {item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp;
  //                   {item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
  //                   <p>
  //                     <span style={{color:'grey', flex:'0 0 auto', float:'right'}}>
  //                       {moment(item.requestedTime).fromNow()}
  //                     </span>
  //                   </p>
  //                 </div>
  //               }
  //             />
  //           </Link>
  //           </Card> 
  //       </Card.Grid>
  //     ))
  //   }
  //   </Card>
  // )

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
      
      <List
      rowKey="id"
      loading={loadingToSign}
      grid={{ gutter: 24, lg: 3, md: 3, sm: 2, xs: 2 }}
      dataSource={documentsToSign}
      loadMore={toSignNum > 6 ? loadmore(DOCUMENT_TOSIGN) : ''}
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
            <Badge.Ribbon color={'#54c6e8'} text={(item.observers && item.observers.includes(_id)) ? '수신' : '서명'}>
            <ProCard 
              hoverable
              bordered
              title={<Tooltip placement="topLeft" title={item.docTitle} arrowPointAtCenter><CardTitle>{item.docTitle}</CardTitle></Tooltip>}
              // title={<div style={{ wordWrap: 'break-word', wordBreak: 'break-word', maxWidth: '250px' }}>{item.docTitle}</div>}
              // tooltip={moment(item.requestedTime).fromNow() + ' ' + item.user.name + ' ' + item.user.JOB_TITLE + ' ' + '생성'}
              // extra={moment(item.requestedTime).fromNow()}
              // subTitle={<Tag color="#5BD8A6">private</Tag>}
              // colSpan="200px" 
              layout="center" 
              style={{ minWidth: "150px", height: "100%" }} // 470px -> 100%
              bodyStyle={{ padding: "5px"}}
              actions={[
                // <div>{item.user.image ? <Avatar src={item.user.image} /> : <Avatar size={20} icon={<UserOutlined />} />} &nbsp; {item.user.name + ' ' + item.user.JOB_TITLE}</div>,
                <div>{item.user.name + ' ' + item.user.JOB_TITLE}</div>,
                <div>{moment(item.requestedTime).fromNow()}</div>,
                // <Button type="text" icon={<FormOutlined />} onClick={e => { signTemplate(item) }}>서명요청</Button>,
                // <Button type="text" icon={<FilePdfOutlined />} onClick={e => { navigate('/previewPDF', {state: {docRef:item.docRef, docTitle:item.docTitle}}) }}>파일보기</Button>,
                // <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(item._id) }}>삭제</Button>,
              ]}>
                <div><img src={item.thumbnail} style={{ width:'180px', height: '228px'}} /></div>
            </ProCard>
            </ Badge.Ribbon>
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
        loadMore={canceledNum > 6 ? loadmore(DOCUMENT_CANCELED) : ''}
        dataSource={documentsCanceled}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<DocumentTypeBadge uid={_id} document={item} />}
            title={
              <Link to="/documentList" state={{ status: DOCUMENT_CANCELED, docId: item._id, includeBulk: true }}>
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
        loadMore={signedNum > 6 ? loadmore(DOCUMENT_SIGNED) : ''}
        dataSource={documentsSigned}
        renderItem={item => (
          <List.Item>
          <List.Item.Meta
            avatar={<DocumentTypeBadge uid={_id} document={item} />}
            title={
              <Link to="/documentList" state={{ status: DOCUMENT_SIGNED, docId: item._id, includeBulk: true }}>
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
    { key: '1', title: '전체', value: totalNum, total: true, lnk: 'https://gw.alipayobjects.com/mdn/rms_7bc6d8/afts/img/A*dr_0RKvVzVwAAAAAAAAAAABkARQnAQ' },
    { key: '2', status: 'processing', title: DOCUMENT_TODO, value: toSignNum, lnk: 'https://gw.alipayobjects.com/mdn/rms_7bc6d8/afts/img/A*-jVKQJgA1UgAAAAAAAAAAABkARQnAQ' },
    { key: '3', status: 'default', title: DOCUMENT_SIGNING, value: signingNum, lnk: 'https://gw.alipayobjects.com/mdn/rms_7bc6d8/afts/img/A*FPlYQoTNlBEAAAAAAAAAAABkARQnAQ' },
    { key: '4', status: 'error', title: DOCUMENT_CANCELED, value: canceledNum, lnk: 'https://gw.alipayobjects.com/mdn/rms_7bc6d8/afts/img/A*pUkAQpefcx8AAAAAAAAAAABkARQnAQ'},
    { key: '5', status: 'success', title: DOCUMENT_SIGNED, value: signedNum, lnk: 'https://gw.alipayobjects.com/mdn/rms_7bc6d8/afts/img/A*dr_0RKvVzVwAAAAAAAAAAABkARQnAQ' },
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
                title: <div style={{fontSize:'12pt'}}>{item.title}</div>,
                value: item.value,
                // status: item.status,
                icon: (
                  <img
                    style={{
                      display: 'block',
                      width: 42,
                      height: 42,
                    }}
                    src={item.lnk}
                    alt="icon"
                  />
                ),
              }}
              style={{ borderRight: item.total ? '1px solid #f0f0f0' : undefined, textAlign: 'center'}}
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

  const cardDocument = (
    <div>
    <MyStyle>
    <Row gutter={12}>

     <Col xl={4} lg={4} md={0} sm={0} xs={0}>  
     <MyStyle_Total>
     <CheckCard
        title="전체"
        avatar={
          <Avatar
            src={imgTotal}
            size="large"
          />
        }
        description={totalNum}
        value="total"
        checked={checkTotal}
        onChange={(checked)=> {
          setCheckTotal(true)
          setCheckToSign(false)
          setCheckSigning(false)
          setCheckCanceled(false)
          setCheckSigned(false)

          setImgTotal(BTN01_ON)
          setImgToSign(BTN02);
          setImgSigning(BTN03);
          setImgCanceled(BTN04);
          setImgSigned(BTN05);

          setChecked('1');
        }}
      />
      </MyStyle_Total>
      </Col>  

      <Col xl={5} lg={5} md={6} sm={6} xs={12}>
      <MyStyle_ToSign>
      <CheckCard
        title={DOCUMENT_TODO}
        avatar={
          <Avatar
            src={imgToSign}
            size="large"
          />
        }
        description={toSignNum}
        value="tosign"
        checked={checkToSign}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(true)
          setCheckSigning(false)
          setCheckCanceled(false)
          setCheckSigned(false)

          setImgTotal(BTN01)
          setImgToSign(BTN02_ON);
          setImgSigning(BTN03);
          setImgCanceled(BTN04);
          setImgSigned(BTN05);

          setChecked('2');
        }}
      />
      </MyStyle_ToSign>
      </Col>

      <Col xl={5} lg={5} md={6} sm={6} xs={12}>
      <MyStyle_Signing>
      <CheckCard
        title={DOCUMENT_SIGNING}
        avatar={
          <Avatar
            src={imgSigning}
            size="large"
          />
        }
        description={signingNum}
        value="signing"
        checked={checkSigning}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(false)
          setCheckSigning(true)
          setCheckCanceled(false)
          setCheckSigned(false)

          setImgTotal(BTN01)
          setImgToSign(BTN02);
          setImgSigning(BTN03_ON);
          setImgCanceled(BTN04);
          setImgSigned(BTN05);

          setChecked('3');
        }}
      />
      </MyStyle_Signing>
      </Col>

      <Col xl={5} lg={5} md={6} sm={6} xs={12}>
      <MyStyle_Canceled>
      <CheckCard
        title={DOCUMENT_CANCELED}
        avatar={
          <Avatar
            src={imgCanceled}
            size="large"
          />
        }
        description={canceledNum}
        value="canceled"
        checked={checkCanceled}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(false)
          setCheckSigning(false)
          setCheckCanceled(true)
          setCheckSigned(false)

          setImgTotal(BTN01)
          setImgToSign(BTN02);
          setImgSigning(BTN03);
          setImgCanceled(BTN04_ON);
          setImgSigned(BTN05);

          setChecked('4');
        }}
      />
      </MyStyle_Canceled>
      </Col>

      <Col xl={5} lg={5} md={6} sm={6} xs={12}>
      <MyStyle_Signed>
      <CheckCard
        title={DOCUMENT_SIGNED}
        avatar={
          <Avatar
            src={imgSigned}
            size="large"
          />
        }
        description={signedNum}
        value="signed"
        checked={checkSigned}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(false)
          setCheckSigning(false)
          setCheckCanceled(false)
          setCheckSigned(true)

          setImgTotal(BTN01)
          setImgToSign(BTN02);
          setImgSigning(BTN03);
          setImgCanceled(BTN04);
          setImgSigned(BTN05_ON);

          setChecked('5');
        }}
      />
      </MyStyle_Signed>
      </Col>
      </Row>
      </MyStyle>

      <Card style={{width:'100%'}}>{staticAllContent(checked)}</Card>
      </div>
  )

  return (
    <div>
      <div style={{background: 'white',padding:0, marginTop:'-24px', marginLeft:'-24px', marginRight:'-24px', marginBottom:'24px'}}>
        <img src={banner} />
      </div>

      <Row gutter={24}>
          <Col xl={17} lg={24} md={24} sm={24} xs={24}>
            {/* {staticsAll}<br></br> */}
            {cardDocument}<br></br>
            <Row gutter={24}>
              <Col xl={12} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
                <BoardCard boardType={'notice'} boardName={'공지사항'}></BoardCard>
              </Col>
              <Col xl={12} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
              {/* <FAQCard boardType={'faq'} boardName={'FAQ'}></FAQCard> */}
              <OpinionCard boardType={'opinion'} boardName={'문의하기'}></OpinionCard>
              
              </Col>
            </Row>
          </Col>
          <Col xl={7} lg={24} md={24} sm={24} xs={24}>
            {pie}
            <br></br>
            <PaperlessCard />
            <br></br>
            <DirectCard></DirectCard>
          </Col>
      </Row>
      
    </div>
  );
};

export default Home;