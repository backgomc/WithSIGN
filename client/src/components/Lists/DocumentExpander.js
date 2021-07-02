import React from 'react';
import { Descriptions, Tag } from 'antd';
import Moment from 'react-moment';
import Title from 'antd/lib/skeleton/Title';
import {
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    MinusCircleOutlined,
  } from '@ant-design/icons';

const DocumentExpander = (props) => {

    const { item } = props

    const getSignInfo = (user) => {
        return (
            <div>
                {user.name} {getSignedTime(user)}
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

    return (
        <Descriptions title="" bordered size="small">
            {/* <Descriptions.Item label="서명 정보" style={{backgroundColor: "white"}}> */}
            <Descriptions.Item label="서명 정보">
            {
                item.users.map((user, index) => (
                    getSignInfo(user)
                ))
            }
            </Descriptions.Item>
        </Descriptions>
    );

};

export default DocumentExpander;