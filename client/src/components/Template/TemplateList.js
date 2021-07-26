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
import moment from 'moment';
import 'moment/locale/ko';
// import { DocumentType, DocumentTypeText, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';
// import DocumentExpander from "./DocumentExpander";

const TemplateList = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  // const [expandable, setExpandable] = useState();

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

    axios.post('/api/template/templates', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const templates = response.data.templates;

        setPagination({...params.pagination, total:response.data.total});
        setData(templates);
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
      title: '템플릿 이름',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true
      // render: (text,row) => <div>{text} {row["email"]} </div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '생성자',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : ''
    },
    {
      title: '생성 일시',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      render: (text, row) => {
        // if (text){
        //   return <Moment format='YYYY/MM/DD HH:mm'>{text}</Moment>
        // } else {
          return <Moment format='YYYY/MM/DD HH:mm'>{row["registeredTime"]}</Moment>
        // }
      } 
    },
  ];


  const rowSelection = {
    selectedRowKeys,
    onChange : selectedRowKeys => {
      console.log('selectedRowKeys changed: ', selectedRowKeys);
      setSelectedRowKeys(selectedRowKeys)
      setHasSelected(selectedRowKeys.length > 0)
    },
    // selections: [
    //   Table.SELECTION_ALL,
    //   Table.SELECTION_INVERT,
    //   Table.SELECTION_NONE,
    // ],
  };

  useEffect(() => {

    fetch({
      uid: _id,
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

  }, [_id]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => {navigate('/uploadTemplate');}}>
            템플릿 만들기
          </Button>
          <span style={{ marginLeft: 8 }}>
            <Button type="primary" disabled={!hasSelected}>
              삭제
            </Button>
          </span>
          <span style={{ marginLeft: 8 }}>
            {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
          </span>
      </div>
      <Table
        rowKey={ item => { return item._id } }
        columns={columns}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        // expandable={expandableData}
        // expandedRowRender={row => <DocumentExpander item={row} />}
        // expandRowByClick
        rowSelection={rowSelection}
        onRow={record => ({
          onClick: e => {
            console.log(`user clicked on row ${record.t1}!`);
          }
        })}
        onChange={handleTableChange}
      />
    </div>
    
  );
};

export default TemplateList;
