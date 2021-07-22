import React, {useState} from 'react';
import { Descriptions, Tag, Timeline, Badge } from 'antd';
import Moment from 'react-moment';
import { useSelector } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import {
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    MinusCircleOutlined,
  } from '@ant-design/icons';
import { DocumentType, DocumentTypeText, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';

const DocumentExpander = (props) => {

    const [responsive, setResponsive] = useState(false);
    const { item } = props
    const user = useSelector(selectUser);
    const { _id } = user;

    const getSignInfo = (user) => {
        return (
            <div style={{height:"30px"}}>
                {user.name} {getSignedTime(user)}
                {/* {user.name} */}
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

    const activeHistory = (user) => {
        
        if ((item.signedBy.some(e => e.user === user._id))) {
            return  (
                <Timeline.Item dot={<CheckCircleOutlined className="timeline-clock-icon" />}>
                    <b>{user.name}</b>님 서명 완료 &nbsp; 
                    <Tag color="default">
                    <Moment format='YYYY/MM/DD HH:mm'>{item.signedBy.filter(e => e.user === user._id)[0].signedTime}</Moment>
                    </Tag>
                    {/* <Badge count={timeFormat(item.signedBy.filter(e => e.user === user._id)[0].signedTime)} style={{ backgroundColor: 'grey' }}/> */}
                </Timeline.Item>
            )
        } else {
            return (
                <Timeline.Item dot={<ClockCircleOutlined className="timeline-clock-icon" />} color="green">
                    <b>{user.name}</b>님 서명 대기
                </Timeline.Item>
            )
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
                <ProCard title="서명 요청자">{item.user.name}</ProCard>
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
                <ProCard title="서명 상태"><DocumentType uid={_id} document={item} /></ProCard>
                </ProCard>
            </ProCard>
            <ProCard title="활동">
                진본확인증명서 발급
                {/* <div>图表</div>
                <div>图表</div>
                <div>图表</div>
                <div>图表</div>
                <div>图表</div> */}
            </ProCard>
            </ProCard>
            <ProCard title="활동이력">
                <Timeline>
                    {/* <Timeline.Item label={<Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>}><b>{item.user.name}</b>님 서명 요청</Timeline.Item> */}
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
            </ProCard>
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