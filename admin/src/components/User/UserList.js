import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Table, Button, Space, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import axiosInterceptor from '../../config/AxiosConfig';

const { confirm } = Modal;

const UserList = () => {
console.log('UserList');
  const { formatMessage } = useIntl();

  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters
    });
  };

  const fetch = async (params = {}) => {
    setLoading(true);
    axiosInterceptor.post('/api/admin/user/list', params).then(response => {
      if (response.data.success) {
        const docs = response.data.documents;
        setPagination({...params.pagination, total:response.data.total});
        setData(docs);
        setLoading(false);
      } else {
          setLoading(false);
          console.log(response.data.error);
      }
    });
  };

  const retireUser = async (item) => {
    console.log(item);
    confirm({
      title: '퇴사 처리 하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      // content: '',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        // fetchDelete();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  }

  const columns = [
    {
      title: '사번',
      dataIndex: 'SABUN',
      responsive: ['sm'],
      sorter: true
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '소속',
      render: (row) => {
        return (row['orgInfo'].length>0?<font color='#787878'>{row['orgInfo'][0]['DEPART_NAME']}</font>:'');
      } 
    },
    {
      title: '직명',
      key: 'JOB_TITLE',
      dataIndex: 'JOB_TITLE',
    },
    {
      title: '관리',
      key: 'action',
      render: (row) => (
        <Space size="middle">
          <a><Button type="primary">초기화</Button></a>
          <Button  danger onClick={e => { retireUser(row); }}>퇴사</Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    // selectedRowKeys,
    // onChange : selectedRowKeys => {
    //   console.log('selectedRowKeys changed: ', selectedRowKeys);
    //   setSelectedRowKeys(selectedRowKeys);
    //   setHasSelected(selectedRowKeys.length > 0);
    // },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  useEffect(() => {
    console.log('useEffect called');
    fetch({
      pagination
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'user.manage'}),
          ghost: false,
          breadcrumb: {
            routes: [
              
            ],
          },
        }}
        // content={description}
        // footer={[
        // ]}
      >
        <br></br>
        <Table
          rowKey={ item => { return item._id } }
          columns={columns}
          dataSource={data}
          pagination={pagination}
          loading={loading}
          rowSelection={rowSelection}
          onChange={handleTableChange}
        />

      </PageContainer>
    </div>
  );
};

export default UserList;