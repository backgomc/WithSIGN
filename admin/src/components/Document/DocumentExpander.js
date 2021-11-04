import React, {useState} from 'react';
import { Tooltip, Tag, Timeline, Button } from 'antd';
import Moment from 'react-moment';
// import { useSelector } from 'react-redux';
// import { selectUser } from '../../app/infoSlice';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { DocumentType, DOCUMENT_SIGNED } from './DocumentType';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
// import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { navigate } from '@reach/router';

const DocumentExpander = (props) => {

    // const dispatch = useDispatch();
    const [responsive, setResponsive] = useState(false);
    const { item } = props;
    // const user = useSelector(selectUser);
    // const { _id } = user;

    const getSignInfo = (user) => {
        return (
            <div>
                {user.name} {user.JOB_TITLE}
            </div>
        );
    }

    // const actionDocument = () => {
    //     switch (DocumentType({uid: _id, document: item})) {
    //         case DOCUMENT_CANCELED:
    //             return (
    //                 <Button
    //                     // loading={isUploading(row)}
    //                     onClick={() => {        
    //                     const docId = item["_id"]
    //                     const docRef = item["docRef"]
    //                     const docTitle = item["docTitle"]
    //                     dispatch(setDocToView({ docRef, docId, docTitle }));
    //                     navigate('/viewDocument');
    //                 }}>문서조회</Button>
    //                 );
    //         case DOCUMENT_SIGNED:
    //             return (
    //             <Button
    //                 // loading={isUploading(row)}
    //                 onClick={() => {        
    //                 const docId = item["_id"]
    //                 const docRef = item["docRef"]
    //                 const docTitle = item["docTitle"]
    //                 dispatch(setDocToView({ docRef, docId, docTitle }));
    //                 navigate('/viewDocument');
    //             }}>문서조회</Button>
    //             );
    //         case DOCUMENT_SIGNING:
    //             return (
    //             <Button onClick={() => {        
    //                 const docId = item["_id"]
    //                 const docRef = item["docRef"]
    //                 const docTitle = item["docTitle"]
    //                 dispatch(setDocToView({ docRef, docId, docTitle }));
    //                 navigate('/viewDocument');
    //             }}>문서조회</Button>
    //             );
    //         default:
    //             return (
    //             <div></div>
    //             );
    //         }
    // }

    const activeHistory = (user) => {
        
        if ((item.signedBy.some(e => e.user === user._id))) {
            return (
                <Timeline.Item dot={<CheckCircleOutlined className="timeline-clock-icon" />} color="gray">
                    <b>{user.name} {user.JOB_TITLE}</b> 서명 완료 &nbsp;
                    <Tag color="#918F8F">
                        <Moment format='YYYY/MM/DD HH:mm'>{item.signedBy.filter(e => e.user === user._id)[0].signedTime}</Moment>
                    </Tag>
                </Timeline.Item>
            );
        } else if ((item.canceledBy.some(e => e.user === user._id))) {
            return (
                <Timeline.Item dot={<CloseCircleOutlined className="timeline-clock-icon" />} color="red">
                    <b>{user.name} {user.JOB_TITLE}</b> 서명 취소 &nbsp;
                    <Tooltip placement="right" title={item.canceledBy.filter(e => e.user === user._id)[0].message}>
                        <Tag color="#918F8F" >
                            <Moment format='YYYY/MM/DD HH:mm'>{item.canceledBy.filter(e => e.user === user._id)[0].canceledTime}</Moment>
                        </Tag>
                    </Tooltip>
                    <br></br>{item.canceledBy.filter(e => e.user === user._id)[0].message}
                </Timeline.Item>
            );
        } else {
            return (
                <Timeline.Item dot={<ClockCircleOutlined className="timeline-clock-icon" />}>
                    <b>{user.name} {user.JOB_TITLE}</b> 서명 필요
                </Timeline.Item>
            );
        }
    }

    return (
    <div>
      <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
            setResponsive(offset.width < 596);
      }}>
        <ProCard
            title={item.docTitle}
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
                    <ProCard title="서명 상태"><DocumentType document={item} /></ProCard>
                    </ProCard>
                </ProCard>
            </ProCard>
            <ProCard title="서명 현황">
                <Timeline>
                    {/* <Timeline.Item label={<Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>}><b>{item.user.name}</b>님 서명 요청</Timeline.Item> */}
                    <Timeline.Item color="gray">
                        <b>{item.user.name} {item.user.JOB_TITLE}</b> 서명 요청 &nbsp;  
                        <Tag color="#918F8F"><Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment></Tag>
                    </Timeline.Item>
                    {
                        item.users.map((user) => (
                            activeHistory(user)
                        ))
                    }
                </Timeline>
            </ProCard>
            

            {DocumentType({document: item}) === DOCUMENT_SIGNED ?
                <ProCard title="">
                    <div style={{height:"40px"}}>                 
                        <Button
                            onClick={() => {         
                                navigate('/audit', { state: { item: item } } );
                        }}>
                            진본 확인 증명서
                        </Button> 

                    </div>
                    {/* <div style={{height:"40px"}}>
                        {actionDocument()}
                    </div> */}
                </ProCard>
            : ''}

        </ProCard>
      </RcResizeObserver>
        
        {/* <Descriptions
        title="상세 정보"
        bordered
        column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 2, xs: 1 }}
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