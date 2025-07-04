import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { navigate, Link } from '@reach/router';
import { List, Tag } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import moment from "moment";
import "moment/locale/ko";
import {
    NotificationOutlined,
    RightOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
const Container = styled.div`
    .ant-pro-card-title {
        display: inline;
        color: blue;
        font-size: 18px;
        width: 100%;
    }
`;

const BoardCard = (props) => {

    
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({current:1, pageSize:5});

    const { boardType, boardName } = props


    const fetch = async () => {
        setLoading(true);
        let param = {
          boardType: boardType,
          pagination
        }
        const res = await axiosInterceptor.post('/api/board/listSlim', param)
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
        // <Container>
        <ProCard
            type='inner'	
            colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
            style={{ marginBottom: 24, marginRight: 0, padding: 0 }}
            title={boardName}
            bordered={false}
            headerBordered
            extra={<Link to="/boardList"><RightOutlined style={{color:'#666666'}} /></Link>}
            loading={loading}
            bodyStyle={{ padding: 10 }}
        >
            <List
                // bordered
                style={{ paddingLeft: 24, paddingRight: 24}}
                dataSource={data}
                renderItem={item => (
                <List.Item>
                <List.Item.Meta
                    // avatar={<NotificationOutlined />}
                    // avatar={<Tag color="red">new</Tag>}
                    title={
                    <Link to="/boardDetail" state={{ boardId: item._id }}>
                        {moment.duration(moment(new Date()).diff(moment(item.registeredTime))).asHours() < 168 ? <Tag color="red">new</Tag> : ''}  
                        {item.title}
                    </Link>
                    }
                    // description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
                />
                    <div><font color='grey'>{moment(item.registeredTime).fromNow()}</font></div>

                    
                </List.Item>
                )}
            />
        </ProCard>
        // </Container>
    );

};

export default BoardCard;