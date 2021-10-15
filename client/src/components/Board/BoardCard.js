import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { navigate, Link } from '@reach/router';
import { List } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import moment from "moment";
import "moment/locale/ko";
import {
    NotificationOutlined
} from '@ant-design/icons';

const BoardCard = (props) => {

    
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({current:1, pageSize:6});

    const { boardType, boardName } = props


    const fetch = async () => {
        setLoading(true);
        let param = {
          boardType: boardType,
          pagination
        }
        const res = await axios.post('/api/board/list', param)
        if (res.data.success) {
          const boards = res.data.boards;
          setData(boards)
        }
        setLoading(false);
      }


    useEffect(() => {
        fetch();
    }, []);

    return (
        <ProCard
            colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
            style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
            title={boardName}
            bordered={false}
            headerBordered
            extra={<Link to="/customer">더보기</Link>}
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
            />
        </ProCard>
    );

};

export default BoardCard;