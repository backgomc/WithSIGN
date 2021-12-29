import React, { useEffect, useState } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { Table, Input, Space, Button } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined,FileOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
// import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import moment from 'moment';
import 'moment/locale/ko';
import { DocumentType, DocumentTypeBadge, DOCUMENT_SIGNED, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';
import DocumentExpander from './DocumentExpander';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from 'react-intl';

moment.locale('ko');

const DocumentList = () => {

  const dispatch = useDispatch();
  // const user = useSelector(selectUser);

  // const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  // const [status, setStatus] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  // const [responsive, setResponsive] = useState(false);
  
  const { formatMessage } = useIntl();
  // const searchInput = useRef<Input>(null);

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
    console.log('filters.status:'+filters.status);
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
          {/* <Button
            type='link'
            size='small'
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0])
              setSearchedColumn(dataIndex)
            }}
          >
            필터
          </Button> */}
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
      render: (text,row) =>  <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '상태',
      dataIndex: 'status',
      sorter: false,
      key: 'status',
      // width: '110px',
      // defaultFilteredValue: location.state.status? [location.state.status]: [],
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
      ],
      onFilter: (value, record) => DocumentType({document: record}).indexOf(value) === 0,
      render: (_,row) => {
        return (
            <DocumentTypeBadge document={row} />
          )
      },
    },
    {
      title: '요청자',
      responsive: ['sm'],
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      // width: '110px',
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
      // width: '100px',
      render: (text, row) => {
          return (<font color='#787878'>{moment(row['requestedTime']).fromNow()}</font>)
      }
    },
    {
      title: '요청자',
      responsive: ['xs'],
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
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
            <font color='#787878'>{moment(row['requestedTime']).fromNow()}</font>
            </React.Fragment>
          )
      } 
    },
    {
      title: '',
      // dataIndex: 'docRef',
      key: 'action',
      // width: '50px',
      render: (_,row) => {
        switch (DocumentType({document: row})) {
          case DOCUMENT_CANCELED:
            return (
              <Button
                // danger
                onClick={() => {        
                const docId = row['_id']
                const docRef = row['docRef']
                const docType = row['docType']
                const docTitle = row['docTitle']
                dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate('/viewDocument');
              }}>문서</Button>
            )
          case DOCUMENT_SIGNED:
            return (
              <Button
                // loading={isUploading(row)}
                onClick={() => {        
                const docId = row['_id']
                const docRef = row['docRef']
                const docType = row['docType']
                const docTitle = row['docTitle']
                dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate('/viewDocument');
              }}>문서</Button>
            )
          case DOCUMENT_SIGNING:
            return (
              <Button onClick={() => {        
                const docId = row['_id']
                const docRef = row['docRef']
                const docType = row['docType']
                const docTitle = row['docTitle']
                dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate('/viewDocument');
              }}>문서</Button>
            );
          default:
            return (
              <div></div>
            )
        }
      }, 
    },
  ];

  useEffect(() => {

    console.log('useEffect called');

    // if (location.state.status) {
    //   setStatus(location.state.status)
    // }

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
