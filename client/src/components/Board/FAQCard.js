import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { v4 as uuidv4 } from 'uuid';
import { navigate, Link } from '@reach/router';
import { List, Space, Collapse, Empty } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import moment from "moment";
import "moment/locale/ko";
import {
    RightOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;

const FAQCard = (props) => {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({current:1, pageSize:10});

    const { boardType, boardName } = props


    const fetch = async () => {
        setLoading(true);
        let param = {
          boardType: boardType,
          pagination
        }
        const res = await axiosInterceptor.post('/api/board/list', param)
        if (res.data.success) {
          const boards = res.data.boards;
          setData(boards)
        }
        setLoading(false);
      }


    useEffect(() => {
        fetch();
        return () => {} // cleanup
    }, []);

    return (
        <ProCard
            type='inner'
            colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
            style={{ marginBottom: 24, marginRight: 0, padding: 0 }}
            title={boardName}
            bordered={true}
            headerBordered
            // extra={<Link to="/customer">더보기</Link>}
            loading={loading}
            bodyStyle={{ padding: 10 }}
            extra={<Link to="/faqList"><RightOutlined style={{color:'#666666'}} /></Link>}
        >
            {/* <List
                // bordered
                style={{ paddingLeft: 24, paddingRight: 24}}
                dataSource={data}
                renderItem={item => (
                <List.Item>
                <List.Item.Meta
                    avatar={<NotificationOutlined style={{ fontSize: 16 }} />}
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
            /> */}

            <Space direction="vertical" style={{width:'100%'}}>
                {data.length > 0 ? data.map((item, index) => (
                    <Collapse key={uuidv4()} collapsible="header">
                        <Panel header={item.title} key={index}>
                            {/* <p style={{whiteSpace:'pre-wrap', wordWrap:'break-word'}}>{item.content}</p> */}
                            <div
                                dangerouslySetInnerHTML={{
                                __html: item.content
                                }} 
                            />
                        </Panel>
                    </Collapse>
                )): <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </Space>

        </ProCard>
    );

};

export default FAQCard;