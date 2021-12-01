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
import { Badge, Button, Card, Empty, List, Space, Statistic, Avatar, Row, Col, Progress, Tag, Comment, Form, Input } from 'antd';
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
  const [pagination, setPagination] = useState({current:1, pageSize:6});
  const [responsive, setResponsive] = useState(false);
  const [totalNum, setTotalNum] = useState(0);
  const [toSignNum, setToSignNum] = useState(0);
  const [signingNum, setSigningNum] = useState(0);
  const [canceledNum, setCanceledNum] = useState(0);
  const [signedNum, setSignedNum] = useState(0);
  // const [paperlessNum, setPaperlessNum] = useState(0);
  // const [docNum, setDocNum] = useState(0);

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
              {/* <FAQCard boardType={'faq'} boardName={'FAQ'}></FAQCard> */}
              <OpinionCard boardType={'opinion'} boardName={'문의하기'}></OpinionCard>
              
              </Col>
            </Row>
          </Col>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
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