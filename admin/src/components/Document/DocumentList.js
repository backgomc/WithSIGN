import React, { useEffect, useState } from 'react';
import Moment from 'react-moment';
import axiosInterceptor from '../../config/AxiosConfig';
import { Table, Input, Space, Button, Tooltip } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined, FileOutlined, PaperClipOutlined } from '@ant-design/icons';
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
          <Button onClick={() => handleReset(clearFilters, confirm, dataIndex)} size='small' style={{ width: 90 }}>
            초기화
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
    confirm();
  }

  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters();
    setSearchText('');
    confirm();
  }

  const columns = [
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text, row) =>
        <div style={{wordWrap:'break-word', wordBreak:'break-word', display:'flex', alignItems:'center'}}><FileOutlined style={{marginRight:'0.5rem'}}/>
          { searchedColumn === 'docTitle' ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}
            />
          ) : (
            text
          )}
          {row['attachFiles']?.length > 0 && <PaperClipOutlined style={{height:'1rem'}}/>}
        </div>
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
      title: '부서',
      dataIndex: ['user', 'DEPART_NAME']
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
      render: (text, row) =>
        <React.Fragment>
          { searchedColumn === 'name' ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text + ' ' + row['user']['JOB_TITLE'] : ''}
            />
          ) : (
            text + ' ' + row['user']['JOB_TITLE']
          )}
        </React.Fragment>
    },
    {
      title: '참여자',
      responsive: ['sm'],
      dataIndex: 'users',
      key: 'participants',
      ...getColumnSearchProps('participants'),
      onFilter: (value, record) => {
        const firstUserName = record.users?.[0]?.name || '';
        const firstUserTitle = record.users?.[0]?.JOB_TITLE || '';
        const userCount = record.users?.length || 0;
        let displayText = '';
        if(userCount > 1) {displayText = `${firstUserName} ${firstUserTitle} 외 ${userCount-1}명`;}
        else {displayText = `${firstUserName} ${firstUserTitle}`;}
        return displayText.toLowerCase().includes(value.toLowerCase());
      },
      render: (users) => {
        const firstUserName = users?.[0]?.name || ' '; // 첫 번째 user 이름
        const firstUserTitle = users?.[0]?.JOB_TITLE || ' '; // 첫 번째 user 이름
        const userCount = users?.length || 0; // users 배열의 개수
        let displayText = '';

        if(userCount > 1){displayText = `${firstUserName} ${firstUserTitle} 외 ${userCount-1}명`;} // 표시할 텍스트
        else {displayText = `${firstUserName} ${firstUserTitle}`;}
        
        return (
          <React.Fragment>
            {searchedColumn === 'participants' ? (
              <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={displayText}
              />
            ) : (
              displayText
            )}
          </React.Fragment>
        );
      }
    },
    {
      title: '최근 활동',
      dataIndex: 'recentTime',
      responsive: ['sm'],
      sorter: true,
      key: 'recentTime',
      render: (text, row) => {
          return (<font color='#787878'><Moment format='YYYY/MM/DD(ddd) HH:mm'>{row['recentTime']}</Moment></font>)
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
      title: '종이',
      dataIndex: 'pageCount',
      responsive: ['sm'],
      key: 'pageCount'
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
