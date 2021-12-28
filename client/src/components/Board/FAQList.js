import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Button, Space, Collapse, Empty, Modal } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import {
  FileOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  FormOutlined,
  SettingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";

const { confirm } = Modal;
const { Panel } = Collapse;

const FAQList = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id, role } = user;

  const boardType = location.state?.boardType ? location.state.boardType : "faq";
  const boardName = location.state?.boardName ? location.state.boardName : "FAQ";
  const boardDetail = location.state?.boardDetail ? location.state.boardDetail : "";
  
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  
  const [pagination, setPagination] = useState({current:1, pageSize:100});
  const [loading, setLoading] = useState(false);

  const { formatMessage } = useIntl();

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/board/list', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const boards = response.data.boards;

        setPagination({...params.pagination, total:response.data.total});
        setData(boards);
        setLoading(false);

      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const fetchDeleteBoard = async (boardId) => {
    setLoading(true);
    let param = {
      _ids: [boardId]
    }
    
    const res = await axios.post('/api/board/delete', param)
    if (res.data.success) {
      fetch({
        boardType: boardType,
        pagination,
      });
    }
    setLoading(false);
  }

  const deleteBoard = async (boardId) => {
    confirm({
      title: '삭제하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      content: '해당 항목이 영구 삭제됩니다.',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchDeleteBoard(boardId);
      },
      onCancel() {
        console.log('Cancel');
      },
    });    
  }

  const genExtra = (boardId) => (
    <Space size='middle'>
    <EditOutlined
      onClick={event => {
        // If you don't want click extra trigger collapse, you can prevent this:
        event.stopPropagation();
        navigate('/boardModify', { state: {boardType:boardType, boardName:'FAQ 수정', boardId:boardId}});
      }}
    />
    <DeleteOutlined
      danger
      onClick={event => {
        // If you don't want click extra trigger collapse, you can prevent this:
        event.stopPropagation();
        deleteBoard(boardId);
      }}
    />
    </Space>
  );

  useEffect(() => {

    fetch({
      boardType: boardType,
      pagination,
    });

    // const data = [];
    // for (let i = 0; i < 46; i++) {
    //   data.push({
    //     key: i,
    //     templateTitle: `template title ${i}`,
    //     name: `Edward King ${i}`,
    //     requestedTime: `2021-07-02T05:46:40.769+00:00`,
    //   });
    // }
    // setData(data);

  }, []);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: boardName}),
          ghost: false,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [     
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            {/* {formatMessage({id: 'Back'})} */}
          </Button>, 
          role == '1' ?  
            <Button icon={<FormOutlined />} type="primary" onClick={() => {navigate('/boardWrite', { state: {boardType:boardType, boardName:boardName}});}}>
              {/* 등록 */}
            </Button> : ''
          ],
        }}
        content={boardDetail}
        footer={[
        ]}
    >
      <br></br>

      <ProCard
            type='inner'
            colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }}
            style={{ marginBottom: 0, marginRight: 0, padding: 0 }}
            // title={boardName}
            bordered={true}
            headerBordered
            // extra={<Link to="/customer">더보기</Link>}
            loading={loading}
            bodyStyle={{ padding: 10 }}
        >

            <Space direction="vertical" style={{width:'100%'}}>
                {data.length > 0 ? data.map((item, index) => (
                    <Collapse collapsible="header">
                        <Panel header={item.title} key={index} extra={role == '1' ? genExtra(item._id) : ''}>
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

    </PageContainer>
    </div>
    
  );
};

export default FAQList;
