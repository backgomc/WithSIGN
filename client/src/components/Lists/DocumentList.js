import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import Moment from 'react-moment';
import { DocumentType, DocumentTypeText, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';

const DocumentList = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const searchInput = useRef<Input>(null)

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      uid: _id
    });
  };

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/document/documents', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const docs = response.data.documents;

        setPagination({...params.pagination, total:response.data.total});
        setData(docs);
        setLoading(false);

      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const getColumnSearchProps = dataIndex => ({

    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          // ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0])
              setSearchedColumn(dataIndex)
            }}
          >
            Filter
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
    setSearchedColumn(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
  }
  
  const columns = [
    {
      title: '상태',
      dataIndex: 'state',
      sorter: false,
      key: 'state',
      filters: [
        {
          text: DOCUMENT_SIGNED,
          value: DOCUMENT_SIGNED,
        },
        {
          text: DOCUMENT_TOSIGN,
          value: DOCUMENT_TOSIGN,
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
      onFilter: (value, record) => DocumentType({uid: _id, document: record}).indexOf(value) === 0,
      // ...getColumnSearchProps('state'),
      render: (_,row) => {
        return <DocumentTypeText uid={_id} document={row} />
          // if (row["signed"] == true) { // 서명 완료된 문서
          //     return (<font color='gray'>서명 종료 문서</font>);
          // } else {
          //     if (row["canceled"] == true) {
          //       return (<font color='red'>취소된 문서</font>);
          //     } else {
          //         if (row["users"].includes(_id)) {
          //           return (<font color='blue'>서명 할 문서</font>);
          //         } else {
          //           return (<font color='green'>서명 진행중 문서</font>);
          //         }
          //     }
          // }
        }, // 완료된 문서 | 취소된 문서
    },
    {
      title: '문서 이름',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      // render: (text,row) => <div>{text} {row["email"]} </div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '요청자',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : ''
    },
    // {
    //   title: 'adasd',
    //   dataIndex: '_id',
    //   sorter: true,
    //   key: '_id',
    //   ...getColumnSearchProps('_id'),
    //   onFilter: (value, record) =>
    //   record['_id']
    //     ? record['_id'].toString().toLowerCase().includes(value.toLowerCase())
    //     : ''
    // },
    {
      title: '최근 활동',
      dataIndex: 'signedTime',
      sorter: true,
      key: 'signedTime',
      render: (text, row) => {
        if (text){
          return <Moment format='YYYY/MM/DD HH:mm'>{text}</Moment>
        } else {
          return <Moment format='YYYY/MM/DD HH:mm'>{row["requestedTime"]}</Moment>
        }
      } 
    },
    {
      title: 'Action',
      // dataIndex: 'docRef',
      key: 'View',
      render: (_,row) => {

        switch (DocumentType({uid: _id, document: row})) {
          case DOCUMENT_CANCELED:
            return (<div>cancel</div>) 
          case DOCUMENT_SIGNED:
            return (
              <Button onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                dispatch(setDocToView({ docRef, docId }));
                navigate(`/viewDocument`);
              }}>문서보기</Button>
            )
          case DOCUMENT_TOSIGN:
            return (
              <Button onClick={() => {
                const docId = row["_id"]
                const docRef = row["docRef"]
                dispatch(setDocToSign({ docRef, docId }));
                navigate(`/signDocument`);
              }}>서명하기</Button>
            );
          case DOCUMENT_SIGNING:
            return (
              <Button onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                dispatch(setDocToView({ docRef, docId }));
                navigate(`/viewDocument`);
              }}>문서보기</Button>
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

    console.log("uid:"+_id)
    fetch({
      uid: _id,
      pagination,
    });

  }, [_id]);

  return (
    <div>
      <Table
        columns={columns}
        // rowKey={record => record.login.uuid}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
    
  );
};

export default DocumentList;
