import React, { useEffect, useState } from 'react';
import Moment from 'react-moment';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { navigate } from '@reach/router';
import { Tooltip, Tag, Timeline, Button, Alert, List } from 'antd';
import ProDescriptions from '@ant-design/pro-descriptions';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DownloadOutlined, PaperClipOutlined, MobileTwoTone } from '@ant-design/icons';
import '@ant-design/pro-card/dist/card.css';
import '@ant-design/pro-descriptions/dist/descriptions.css';
import 'antd/dist/antd.css';
import { DocumentType, DOCUMENT_SIGNED } from './DocumentType';
// import AuditCertify from '../Document/AuditCertify';

import ico_bullet from '../../assets/images/table_bullet.png';

const DocumentExpander = (props) => {

    const [orgInfos, setOrgInfos] = useState([]);
    const { item } = props
    
    const fetchOrgInfos = async () => {
        console.log('fetchOrgInfos called');
        var DEPART_CODE = [];

        item.users.map((user) => (
            DEPART_CODE.push(user.DEPART_CODE)
        ));
        DEPART_CODE.push(item.user.DEPART_CODE);

        const res = await axios.post('/admin/org/info', {'DEPART_CODE': DEPART_CODE});
        
        if (res.data.success) {
            setOrgInfos(res.data.results);
        }
    }

    // const getSignInfo = (user) => {
    //     return (
    //         <div key={uuidv4()}>
    //             {user.name} {user.JOB_TITLE} {orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE)[0].DEPART_NAME+']' : ''}
    //         </div>
    //     )
    // }

    const activeHistory = (user) => {
        if ((item.signedBy.some(e => e.user === user._id))) {
            return  (
                <Timeline.Item key={uuidv4()} dot={<CheckCircleOutlined className="timeline-clock-icon" />} color="gray">
                    <font color='#A7A7A9'><b>{user.name} {user.JOB_TITLE}</b> {orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE)[0].DEPART_NAME+']' : ''} {(item.observers && item.observers.includes(user._id)) ? '문서 수신' : '서명 완료'}</font>
                    &nbsp;&nbsp;&nbsp;
                    <Tag color="#BABABC">
                        {item.signedBy.filter(e => e.user === user._id)[0].skipped === true ? '생략됨' : 
                        <Moment format='YYYY/MM/DD HH:mm'>{item.signedBy.filter(e => e.user === user._id)[0].signedTime}</Moment>}                       
                    </Tag>
                    {/^(10\.220\.140\.(66|67))$/.test(item.signedBy.filter(e => e.user === user._id)[0].ip) ? <MobileTwoTone /> : ''}
                </Timeline.Item>
            )
        } else if ((item.canceledBy.some(e => e.user === user._id))) {
            return (
                <Timeline.Item key={uuidv4()} dot={<CloseCircleOutlined className="timeline-clock-icon"/>} color="red">
                    <font color="#A7A7A9"><b>{user.name} {user.JOB_TITLE}</b> {orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE)[0].DEPART_NAME+']' : ''} {(item.observers && item.observers.includes(user._id)) ? '수신 취소' : '서명 취소'}</font>
                    &nbsp;&nbsp;&nbsp;
                    <Tooltip placement="right" title={item.canceledBy.filter(e => e.user === user._id)[0].message}>
                        <Tag color="#BABABC">
                            <Moment format="YYYY/MM/DD HH:mm">{item.canceledBy.filter(e => e.user === user._id)[0].canceledTime}</Moment>
                        </Tag>
                    </Tooltip>
                    <div style={{marginTop:'10px'}}><Alert message={item.canceledBy.filter(e => e.user === user._id)[0].message} type="error" /></div>
                </Timeline.Item>
            )
        } else {
            return (
                <Timeline.Item key={uuidv4()} dot={item.usersOrder?.filter(e => e.user === user._id).length > 0 ? <Tag color='blue'>{item.usersOrder.filter(e => e.user === user._id)[0]?.order + 1}</Tag> : <ClockCircleOutlined className="timeline-clock-icon" />}>
                    <font color="#1890FF"><b>{user.name} {user.JOB_TITLE}</b> {orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE === user.DEPART_CODE)[0].DEPART_NAME+']' : ''} {(item.observers && item.observers.includes(user._id)) ? '수신 필요' : '서명 필요'}</font>
                </Timeline.Item>
            )
        }
    }

    const buttonList = (
        <div>
            {DocumentType({document: item}) === DOCUMENT_SIGNED ?
                <Button icon={<DownloadOutlined />} onClick={() => { navigate('/auditCertify', { state: { docInfo: item } } ); }}>진본 확인 증명서</Button>
                // <nav><Link to={('/auditCertify/'+item._id)}>진본 확인 증명서</Link></nav>
                // <Button icon={<DownloadOutlined />} onClick={async () => {
                //     const doc = <AuditCertify item={item} />;
                //     console.log(doc);
                // }}>진본 확인 증명서</Button>
                :''
            }
        </div>
    )

    useEffect(() => {
        console.log('DocumentExpander useEffect called');
        fetchOrgInfos();
        return () => {
            setOrgInfos([]);
        }   // cleanup
    }, []);

      
    return (
        <div>
            {/* <Container> */}
                <ProDescriptions column={2} bordered title={<div><img src={ico_bullet} style={{display: 'inline-block'}} alt={'상세정보'}></img>&nbsp;&nbsp;상세정보</div>} contentStyle={{background:'white'}}>
                    <ProDescriptions.Item valueType="option">{buttonList}</ProDescriptions.Item>
                    {/* <ProDescriptions.Item span={2} label={<b>문서명</b>}>{item.docTitle}</ProDescriptions.Item> */}
                    <ProDescriptions.Item label={<b>요청자</b>}>
                        {item.user.name} {item.user.JOB_TITLE} {orgInfos.filter(e => e.DEPART_CODE === item.user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE === item.user.DEPART_CODE)[0].DEPART_NAME+']' : ''}
                    </ProDescriptions.Item>
                    {/* <ProDescriptions.Item label={<b>참여자</b>}>
                        {item.users.map((user, index) => (getSignInfo(user)))}
                    </ProDescriptions.Item> */}
                    {/* <ProDescriptions.Item label={<b>진행 상태</b>}>
                        <DocumentTypeBadge document={item}/>
                    </ProDescriptions.Item> */}
                    <ProDescriptions.Item label={<b>요청시간</b>}>
                        <Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>
                    </ProDescriptions.Item>
                    <ProDescriptions.Item label={<b>진행 현황</b>} span="2">
                        <br></br>
                        <Timeline>
                            <Timeline.Item color="gray">
                                <font color='#A7A7A9'><b>{item.user.name} {item.user.JOB_TITLE}</b> {orgInfos.filter(e => e.DEPART_CODE === item.user.DEPART_CODE).length > 0 ? '['+orgInfos.filter(e => e.DEPART_CODE === item.user.DEPART_CODE)[0].DEPART_NAME+']' : ''} 서명 요청</font>
                                &nbsp;&nbsp;&nbsp;
                                <Tag color="#BABABC">
                                    <Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>
                                </Tag>
                            </Timeline.Item>
                                {item.users.map((user) => (activeHistory(user)))}
                        </Timeline>
                    </ProDescriptions.Item>
                    {item.attachFiles?.length > 0 ?       
                    <ProDescriptions.Item label={<b>첨부 파일</b>} span="2">
                        <List
                        size="small"
                        split={false}
                        dataSource={item.attachFiles}
                        // header={`첨부파일 ${item.attachFiles.length}`}
                        // bordered
                        itemLayout="horizontal"
                        renderItem={item =>
                            <List.Item.Meta
                                avatar={<PaperClipOutlined />}
                                description={ <a href={item.path} download={item.originalname} style={{color:'gray'}}>{item.originalname}</a> }
                            />
                        }
                        />
                </ProDescriptions.Item> : <></>}
                </ProDescriptions>
            {/* </Container> */}
        </div>
    );
};

export default DocumentExpander;
