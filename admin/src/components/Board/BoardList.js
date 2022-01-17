import React, { useEffect, useState } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { v4 as uuidv4 } from 'uuid';
import { useIntl } from 'react-intl';
import { Table, Input, Select, Space, Button, Badge } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import 'moment/locale/ko';

const { Option } = Select;

const BoardList = () => {

  const { formatMessage } = useIntl();
  const [pagination, setPagination] = useState({current:1, pageSize:2, showSizeChanger: true});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const handleSelectChange = (boardType) => {
    console.log('handleSelectChange called');
    pagination.current = 1; // RESET
    fetch({
      boardType,
      pagination
    });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters
    });
  };

  const getColumnSearchProps = dataIndex => ({

    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(confirm)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            검색
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            초기화
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  });

  const handleSearch = (confirm) => {
    confirm();
  }

  const handleReset = (clearFilters) => {
    clearFilters();

  }

  const fetch = async (params = {}) => {
    setLoading(true);
    axiosInterceptor.post('/admin/board/list', params).then(response => {
      if (response.data.success) {
        let boards = response.data.boards;
        setPagination({...params.pagination, total:response.data.total});
        setData(boards);
        setLoading(false);
      } else {
        setLoading(false);
        console.log(response.data.error);
      }
    });
  };

  const columns = [
    {
      title: '유형',
      dataIndex: 'boardType',
      key: 'boardType',
      render: (value) => {
        let text = '';
        if (value === 'notice') text = '공지사항';
        if (value === 'faq') text = 'FAQ';
        if (value === 'opinion') text = '문의하기';
        if (value === 'manual') text = '매뉴얼';
        return <div>{text}</div>
      }
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
      render: (text,row) => <div style={{ 'wordWrap': 'break-word', 'wordBreak': 'break-word' }}>{text} <Badge count={row.comments.length} style={{ backgroundColor: '#1A4D7D' }} /></div>
    },
    {
      title: '작성자',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      ...getColumnSearchProps('name')
    },
    {
      title: '작성일',
      dataIndex: 'registeredTime',
      sorter: true,
      key: 'registeredTime',
      render: (text, row) => {
        return <Moment format="YYYY/MM/DD HH:mm">{row['registeredTime']}</Moment>
      } 
    },
  ];

  useEffect(() => {
    console.log('useEffect called');
    fetch({
      pagination
    });
    return () => setLoading(false);
}, []);

  return (
    <div>
        <PageContainer
          ghost
          header={{
            title: formatMessage({id: 'board.manage'}),
            ghost: false,
            breadcrumb: {
              routes: [

              ],
            },
            extra: [           
              <Select key={uuidv4()} defaultValue="" style={{ width: 120 }} onChange={handleSelectChange}>
                <Option value="">전체</Option>
                <Option value="notice">공지사항</Option>
                <Option value="faq">FAQ</Option>
                <Option value="opinion">문의하기</Option>
                <Option value="manual">매뉴얼</Option>
              </Select>,
              <Button key={uuidv4()} type="primary" onClick={() => {navigate('/boardWrite');}}>
                게시글 등록
              </Button>
            ]
          }}
        >
          <br></br>
          <Table
            rowKey={ item => { return item._id } }
            columns={columns}
            dataSource={data}
            pagination={pagination}
            loading={loading}
            onRow={record => ({
              onClick: e => {
                navigate('/boardDetail', { state: { boardId: record._id, boardType: record.boardType } } );
              }
            })}
            onChange={handleTableChange}
          />
        </PageContainer>
    </div>
  );
};

export default BoardList;
