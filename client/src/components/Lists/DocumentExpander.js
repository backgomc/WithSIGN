import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tooltip, Tag, Timeline, Button, Popconfirm, Modal, Badge, Descriptions } from 'antd';
import Moment from 'react-moment';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import {
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    MinusCircleOutlined,
    InfoCircleOutlined,
  } from '@ant-design/icons';
import { DocumentTypeBadge, DocumentType, DocumentTypeText } from './DocumentType';
import { DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM } from '../../common/Constants';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';

import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import { navigate } from '@reach/router';
import { withSuccess } from 'antd/lib/modal/confirm';

import ProDescriptions from '@ant-design/pro-descriptions';
import '@ant-design/pro-descriptions/dist/descriptions.css';
import styled from 'styled-components';

const { confirm } = Modal;

const Container = styled.div`
    padding: 0px;
    width: 100%;
    height: 100%;
    img {
      max-width: 100%;
    }
    th,td {border-bottom: 1px solid #edebeb; border-collapse:collapse;}
    `;

const DocumentExpander = (props) => {

    const dispatch = useDispatch();
    const [responsive, setResponsive] = useState(false);
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [loadingOrgInfos, setLoadingOrgInfos] = useState(false);
    const [orgInfos, setOrgInfos] = useState([]);
    const { item } = props
    const user = useSelector(selectUser);
    const { _id } = user;

    const fetchCancel = async (docId) => {
        console.log('fetchCancel called')
        console.log(docId)
        setLoadingCancel(true);
        let param = {
          docId: docId,
          user: _id
        }
    
        const res = await axios.post('/api/storage/removeDocument', param)
        setLoadingCancel(false);

        if (res.data.success) {
            navigate('/resultPage', { state: {status:'success', headerTitle:'요청 취소 결과', title:'요청 취소에 성공하였습니다.'}}); 
        } else {
            navigate('/resultPage', { state: {status:'error', headerTitle:'요청 취소 결과', title:'요청 취소에 실패하였습니다.', subTitle:'관리자에게 문의하세요!'}}); 
        }
    }

    const fetchOrgInfos = async () => {
        console.log('fetchOrgInfos called')
        setLoadingOrgInfos(true);
        var DEPART_CODES = [];

        item.users.map((user, index) => (
            DEPART_CODES.push(user.DEPART_CODE)
        ))
        DEPART_CODES.push(item.user.DEPART_CODE)

        const res = await axios.post('/api/users/orgInfos', {DEPART_CODES: DEPART_CODES})
        
        if (res.data.success) {
            setOrgInfos(res.data.results)
        }
        
        setLoadingOrgInfos(false);
    }


    const cancelDocument = async (docId) => {
        confirm({
            title: '서명 요청을 취소하시겠습니까??',
            icon: <ExclamationCircleOutlined />,
            content: '해당 문서가 영구 삭제됩니다.',
            okText: '네',
            okType: 'danger',
            cancelText: '아니오',
            onOk() {
            fetchCancel(docId);
            },
            onCancel() {
            console.log('Cancel');
            },
        });    
    }

    const getSignInfo = (user) => {
        return (
            <div>
                {/* {user.name} {getSignedTime(user)} */}
                {user.name} {user.JOB_TITLE} {orgInfos.filter(e => e.DEPART_CODE == user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE == user.DEPART_CODE)[0].DEPART_NAME+']' : ''}
            </div>
        )
    }

    const getSignedTime = (user) => {
        if ((item.signedBy.some(e => e.user === user._id))) {
            return  (
                <Tag icon={<CheckCircleOutlined />} color="default">
                    <Moment format='YYYY/MM/DD HH:mm'>
                        {item.signedBy.filter(e => e.user === user._id)[0].signedTime}
                    </Moment>
                </Tag>
            )
        } else {
            return (
            <Tag icon={<ClockCircleOutlined />} color="success">
                서명 대기
            </Tag>
            )
        }
    }

    const timeFormat = (org) => {
        return (
            <Moment format='YYYY/MM/DD HH:mm'>{org}</Moment>
        )
    }

    const actionDocument = () => {
        switch (DocumentType({uid: _id, document: item})) {
            case DOCUMENT_CANCELED:
                return (
                    <Button
                        // loading={isUploading(row)}
                        onClick={() => {        
                        const docId = item["_id"]
                        const docRef = item["docRef"]
                        const docTitle = item["docTitle"]
                        dispatch(setDocToView({ docRef, docId, docTitle }));
                        navigate(`/viewDocument`);
                    }}>문서조회</Button>
                    )
            case DOCUMENT_SIGNED:
                return (
                <Button
                    // loading={isUploading(row)}
                    onClick={() => {        
                    const docId = item["_id"]
                    const docRef = item["docRef"]
                    const docTitle = item["docTitle"]
                    dispatch(setDocToView({ docRef, docId, docTitle }));
                    navigate(`/viewDocument`);
                }}>문서조회</Button>
                )
            case DOCUMENT_TOSIGN:
                return (
                <Button type="primary" onClick={() => {
                    const docId = item["_id"]
                    const docRef = item["docRef"]
                    const docTitle = item["docTitle"]
                    dispatch(setDocToView({ docRef, docId, docTitle }));
                    navigate(`/signDocument`);
                }}>서명하기</Button>
                );
            case DOCUMENT_SIGNING:
                return (
                <Button onClick={() => {        
                    const docId = item["_id"]
                    const docRef = item["docRef"]
                    const docTitle = item["docTitle"]
                    dispatch(setDocToView({ docRef, docId, docTitle }));
                    navigate(`/viewDocument`);
                }}>문서조회</Button>
                );
            default:
                return (
                <div></div>
                )
            }
    }

    const activeHistory = (user) => {
        
        if ((item.signedBy.some(e => e.user === user._id))) {
            return  (
                <Timeline.Item dot={<CheckCircleOutlined className="timeline-clock-icon" />} color="gray">
                    <font color='#A7A7A9'><b>{user.name} {user.JOB_TITLE}</b> {(item.observers && item.observers.includes(user._id)) ? '문서 수신' : '서명 완료'}</font> &nbsp; 
                    <Tag color="#BABABC">
                    <Moment format='YYYY/MM/DD HH:mm'>{item.signedBy.filter(e => e.user === user._id)[0].signedTime}</Moment>
                    </Tag>
                    {/* <Badge count={<Moment format='YYYY/MM/DD HH:mm'>{item.signedBy.filter(e => e.user === user._id)[0].signedTime}</Moment>}/> */}
                </Timeline.Item>
            )
        } else if ((item.canceledBy.some(e => e.user === user._id))) {
            return (
                <Timeline.Item dot={<CloseCircleOutlined className="timeline-clock-icon" />} color="red">
                    <font color='#A7A7A9'><b>{user.name} {user.JOB_TITLE}</b>  {(item.observers && item.observers.includes(user._id)) ? '수신 취소' : '서명 취소'} &nbsp;</font>
                    <Tooltip placement="right" title={item.canceledBy.filter(e => e.user === user._id)[0].message}>
                        <Tag color="#BABABC" >
                            <Moment format='YYYY/MM/DD HH:mm'>{item.canceledBy.filter(e => e.user === user._id)[0].canceledTime}</Moment>
                        </Tag>
                    </Tooltip>
                    <br></br>{item.canceledBy.filter(e => e.user === user._id)[0].message}
                </Timeline.Item>
            )
        } else {
            return (
                <Timeline.Item dot={<ClockCircleOutlined className="timeline-clock-icon" />}>
                    <font color='#1890FF'><b>{user.name} {user.JOB_TITLE}</b> {(item.observers && item.observers.includes(user._id)) ? '수신 필요' : '서명 필요'}</font>
                </Timeline.Item>
            )
        }
    }

    const buttonList = (
        <div>
            {DocumentType({uid: _id, document: item}) == DOCUMENT_SIGNED ?
                <Button
                onClick={() => {         
                    navigate(`/audit`, { state: { item: item } } );
                }}>
                    진본 확인 증명서
                </Button> : '' 
            }
            {((DocumentType({uid: _id, document: item}) == DOCUMENT_SIGNING || DocumentType({uid: _id, document: item}) == DOCUMENT_TOSIGN)  
                && item.user._id === _id 
                && item.signedBy.length - item.signedBy.filter(e => e.user === _id).length === 0) ?   
                // <Popconfirm
                //     placement="bottomRight"
                //     title='요청 취소하시겠습니까? (해당 문서가 삭제됩니다.)'
                //     onConfirm={() => {
                //         fetchCancel(item._id)
                //     }}
                //     okText="네"
                //     cancelText="아니오"
                //     okButtonProps={{ loading: loadingCancel }}
                // >
                    <Button onClick={e => { cancelDocument(item._id) }}>요청 취소</Button>
                // </Popconfirm>
                 : ''
            }
        </div>
    )

    useEffect(() => {
        console.log("DocumentExpander useEffect called")
        fetchOrgInfos();
        
    }, []);

      
    return (
    <div>

{/* <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
            setResponsive(offset.width < 596);
      }}>
        <ProCard
            // title={item.docTitle}
            title={buttonList}
            extra=""
            bordered
            headerBordered
            split={responsive ? 'horizontal' : 'vertical'}
        >
            <ProCard split="horizontal">
                <ProCard split="horizontal">
                    <ProCard split={responsive ? 'horizontal' : 'vertical'}>
                    <ProCard title="서명 요청자">{item.user.name} {item.user.JOB_TITLE}</ProCard>
                    <ProCard title="서명 참여자">
                        {
                            item.users.map((user, index) => (
                                getSignInfo(user)
                            ))
                        }
                    </ProCard>
                    </ProCard>
                    <ProCard split="vertical">
                    <ProCard title="서명 요청시간"><Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment></ProCard>
                    <ProCard title="서명 상태">{(DocumentType({uid: _id, document: item}) == DOCUMENT_TOSIGN && item.observers && item.observers.includes(_id)) ? DOCUMENT_TOCONFIRM : <DocumentType uid={_id} document={item} />}</ProCard>
                    </ProCard>
                </ProCard>
            </ProCard>
            <ProCard title="서명 현황">
                <Timeline>
                    <Timeline.Item color="gray">
                        <font color='#A7A7A9'><b>{item.user.name} {item.user.JOB_TITLE}</b> 서명 요청 </font> &nbsp;  
                        <Tag color="#BABABC"><Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment></Tag>
                    </Timeline.Item>
                    {
                        item.users.map((user) => (
                            activeHistory(user)
                        ))
                    }
                </Timeline>
            </ProCard>

        </ProCard>
      </RcResizeObserver> */}

  <Container>
  {/* style={{borderCollapse:'collapse'}} labelStyle={{border:'1px solid', borderColor:'grey', display:'table-cell'}} contentStyle={{background:'white', border:'1px solid', borderColor:'grey', display:'table-cell'}} */}
    <ProDescriptions column={2} bordered title="상세 정보" tooltip="" contentStyle={{background:'white'}}>
      <ProDescriptions.Item label="??" valueType="option">
        {/* <Button key="primary" type="primary">
          다운로드
        </Button> */}
        {buttonList}
      </ProDescriptions.Item>
      <ProDescriptions.Item span={2} label="문서명">
        {item.docTitle}
      </ProDescriptions.Item>
      <ProDescriptions.Item label="요청자" tooltip="서명을 진행하기 위해 문서를 업로드하고 서명에 참여하는 서명 참여자들에게 문서를 전송한 사람">
        {item.user.name} {item.user.JOB_TITLE} {orgInfos.filter(e => e.DEPART_CODE == item.user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE == item.user.DEPART_CODE)[0].DEPART_NAME+']' : ''}
      </ProDescriptions.Item>
      <ProDescriptions.Item label="참여자" tooltip="서명 요청자에 의해 문서에 서명해야 하는 사람">
        {
            item.users.map((user, index) => (
                getSignInfo(user)
            ))
        }
      </ProDescriptions.Item>
      <ProDescriptions.Item label="진행 상태">
        <DocumentTypeBadge uid={_id} document={item} />
      </ProDescriptions.Item>

      <ProDescriptions.Item label="요청시간">
        <Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>
      </ProDescriptions.Item>
      <ProDescriptions.Item label="진행 현황">
          <br></br>
        <Timeline>
                {/* <Timeline.Item label={<Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>}><b>{item.user.name}</b>님 서명 요청</Timeline.Item> */}
                <Timeline.Item color="gray">
                    <font color='#A7A7A9'><b>{item.user.name} {item.user.JOB_TITLE}</b> 서명 요청 </font> &nbsp;  
                    <Tag color="#BABABC"><Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment></Tag>
                </Timeline.Item>
                {
                    item.users.map((user) => (
                        activeHistory(user)
                    ))
                }
            </Timeline>
      </ProDescriptions.Item>
    </ProDescriptions>
</Container>

                


        {/* <Descriptions
        title="상세 정보"
        bordered
        // column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 2, xs: 1 }}
      >
        <Descriptions.Item label="서명 요청자">{item.user.name}</Descriptions.Item>
        <Descriptions.Item label="서명 참여자">
            {
                item.users.map((user, index) => (
                    getSignInfo(user)
                ))
             }
        </Descriptions.Item>
        <Descriptions.Item label="활동 이력" span={4}>
            <br></br>
            <Timeline>
                <Timeline.Item label={<Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>}><b>{item.user.name}</b>님 서명 요청</Timeline.Item>
                <Timeline.Item>
                    <b>{item.user.name}</b>님 서명 요청 &nbsp;  
                    <Tag color="default"><Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment></Tag>
                </Timeline.Item>
                {
                    item.users.map((user) => (
                        activeHistory(user)
                    ))
                }
            </Timeline>

        </Descriptions.Item>
        <Descriptions.Item label="문서명">{item.docTitle}</Descriptions.Item>
        <Descriptions.Item label="문서 ID">{item._id}</Descriptions.Item>
        <Descriptions.Item label="요청시간"><Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment></Descriptions.Item>
        <Descriptions.Item label="진행이력"><DocumentType uid={_id} document={item} /></Descriptions.Item>
      </Descriptions> */}
      </div>
    );

};

export default DocumentExpander;