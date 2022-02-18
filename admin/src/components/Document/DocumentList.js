import React, { useEffect, useState } from 'react';
import Moment from 'react-moment';
import axiosInterceptor from '../../config/AxiosConfig';
import { Table, Input, Space, Button, Tooltip } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined,FileOutlined } from '@ant-design/icons';
import { navigate } from '@reach/router';
import { DocumentType, DocumentTypeBadge, DOCUMENT_SIGNED, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_DELETED } from './DocumentType';
import DocumentExpander from './DocumentExpander';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from 'react-intl';

const DocumentList = () => {

  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [status, setStatus] = useState();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10, showSizeChanger: true});
  const [loading, setLoading] = useState(false);
  const { formatMessage } = useIntl();
  
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
    console.log('filters.status:'+filters.status);
    setStatus(filters.status);
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters
    });
  };

  const fetch = (params = {}) => {
    setLoading(true);

    axiosInterceptor.post('/admin/document/list', params).then(response => {

      console.log(response);
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

  const getColumnSearchProps = dataIndex => ({

    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type='primary'
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size='small'
            style={{ width: 90 }}
          >
            검색
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size='small' style={{ width: 90 }}>
            초기화
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    // DB 필터링 사용 시는 주석처리
    // onFilter: (value, record) =>
    //   record[dataIndex]
    //     ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
    //     : '',
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        // setTimeout(() => searchInput.select(), 100);
        // setTimeout(
        //   () => searchInput && searchInput.current && searchInput.current.select()
        // )
      }
    },
    render: text =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[setSearchText(searchText)]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchedColumn(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  }

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
  }

  const columns = [
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text) =>  <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '상태',
      dataIndex: 'status',
      sorter: false,
      key: 'status',
      filterMultiple: false,
      filters: [
        {
          text: DOCUMENT_SIGNED,
          value: DOCUMENT_SIGNED,
        },
        {
          text: DOCUMENT_SIGNING,
          value: DOCUMENT_SIGNING,
        },
        {
          text: DOCUMENT_CANCELED,
          value: DOCUMENT_CANCELED,
        },
        {
          text: DOCUMENT_DELETED,
          value: DOCUMENT_DELETED,
        }
      ],
      onFilter: (value, record) => DocumentType({document: record}).indexOf(value) === 0,
      render: (_,row) => {
        return (
          <DocumentTypeBadge document={row} />
        )
      }
    },
    {
      title: '요청자',
      responsive: ['sm'],
      dataIndex: ['user', 'name'],
      sorter: false,
      key: 'name',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : '',
      render: (text, row) => {
        return (
          <React.Fragment>
          {row['user']['name']} {row['user']['JOB_TITLE']}
          </React.Fragment>
        )
      } 
    },
    {
      title: '요청 일시',
      dataIndex: 'requestedTime',
      responsive: ['sm'],
      sorter: true,
      key: 'requestedTime',
      render: (text, row) => {
          return (<font color='#787878'><Moment format='YYYY/MM/DD(ddd) HH:mm'>{row['requestedTime']}</Moment></font>)
      }
    },
    {
      title: '요청자',
      responsive: ['xs'],
      dataIndex: ['user', 'name'],
      sorter: false,
      key: 'name',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : '',
      render: (text, row) => {
        return (
          <React.Fragment>
          {row['user']['name']}
          <br />
          <font color='#787878'><Moment format='YYYY/MM/DD(ddd) HH:mm'>{row['requestedTime']}</Moment></font>
          </React.Fragment>
        )
      }
    },
    {
      title: '관리',
      key: 'action',
      render: (_,row) => {
        return (
          <Tooltip placement="top" title={'문서 보기'}>
            <Button
              icon={<FileOutlined />}
              onClick={() => {
                // const docId = row['_id']
                // const docRef = row['docRef']
                // const docType = row['docType']
                // const docTitle = row['docTitle']
                // dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate('/viewDocument', { state: { docInfo: row } });
              }}
            ></Button>
          </Tooltip>
        );
      },
    },
  ];

  useEffect(() => {
    console.log('useEffect called');
    fetch({
      pagination,
      status: status
    });
    return () => {
      setSearchText('');
      setSearchedColumn('');
      setStatus();
      setData([]);
      setPagination({current:1, pageSize:10, showSizeChanger: true});
      setLoading(false);
    } // cleanup
  }, []);

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'document.manage'}),
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
          // expandable={expandableData}
          expandedRowRender={row => <DocumentExpander item={row} />}
          expandRowByClick
          onRow={record => ({
            onClick: e => {
              // console.log(`user clicked on row ${record.t1}!`);
            }
          })}
          onChange={handleTableChange}
        />

      </PageContainer>
    </div>
  );
};

export default DocumentList;
