import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { navigate, Link } from '@reach/router';
import { List, Tag, Avatar, ConfigProvider, Empty, Button, Badge } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import moment from "moment";
import "moment/locale/ko";
import {
    UserOutlined,
    RightOutlined
} from '@ant-design/icons';

const OpinionCard = (props) => {

    
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
        const res = await axios.post('/api/board/list', param)
        if (res.data.success) {
          const boards = res.data.boards;
          setData(boards)
        }
        setLoading(false);
    }

    const customizeRenderEmpty = () => (
        <Empty
            description={
            <span>
                개선 및 문의사항을 등록할 수 있습니다.
                {/* <a href="#API">Description</a> */}
            </span>
            }
        >
        <Button type="primary" onClick={() => {navigate('/boardWrite', { state: {boardType:boardType, boardName:boardName}});}}>
            등록하기
        </Button>
      </Empty>
    );


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
            extra={<Link to="/boardList"  state={{ boardType: 'opinion', boardName: '문의하기', boardDetail: '개선 및 문의사항을 등록할 수 있습니다.' }}><RightOutlined style={{color:'#666666'}} /></Link>}
            loading={loading}
            bodyStyle={{ padding: 10 }}
        >
            <ConfigProvider renderEmpty={customizeRenderEmpty}>
            <List
                // bordered
                style={{ paddingLeft: 24, paddingRight: 24}}
                dataSource={data}
                
                renderItem={item => (
                <List.Item>
                <List.Item.Meta
                    avatar={item.user.thumbnail ? <Avatar src={item.user.thumbnail} /> : <Avatar size={40} icon={<UserOutlined />} />}
                    title={
                    <Link to="/boardDetail" state={{ boardId: item._id }}>
                        {item.title} <Badge count={item.comments.length} style={{ backgroundColor: '#1A4D7D' }} />
                    </Link>
                    }
                    description={item.user.JOB_TITLE ? item.user.name + ' '+ item.user.JOB_TITLE : item.user.name}
                />
                    <div><font color='grey'>{moment(item.registeredTime).fromNow()}</font></div>

                    
                </List.Item>
                )}
            />
            </ConfigProvider>
        </ProCard>
    );

};

export default OpinionCard;