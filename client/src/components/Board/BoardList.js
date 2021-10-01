import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Popconfirm } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import {
  FileOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";


const BoardList = () => {

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
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);

  const { formatMessage } = useIntl();
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

  const deleteBoard = async () => {
    
    setVisiblePopconfirm(false);

    let param = {
      _ids: selectedRowKeys
    }

    console.log("param:" + param)
    const res = await axios.post('/api/board/delete', param)
    if (res.data.success) {
      // alert('삭제 되었습니다.')
    } else {
      // alert('삭제 실패 하였습니다.')
    }

    setSelectedRowKeys([]);
    setHasSelected(false)

    fetch({
      boardType: 'notice',
      pagination,
    });

  }

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
      title: '제목',
      dataIndex: 'title',
      sorter: true,
      key: 'title',
      ...getColumnSearchProps('title'),
      expandable: true,
      render: (text,row) => <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{text}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '작성자',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      width: '110px',
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
      title: '작성일',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      width: '110px',
      render: (text, row) => {
        // if (text){
        //   return <Moment format='YYYY/MM/DD HH:mm'>{text}</Moment>
        // } else {
          // return <Moment format='YYYY/MM/DD HH:mm'>{row["registeredTime"]}</Moment>
        // }
        return (<font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font>)
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
      boardType: 'notice',
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
          title: formatMessage({id: 'Notice'}),
          ghost: false,
          breadcrumb: {
            routes: [
              // {
              //   path: '/',
              //   breadcrumbName: 'Home',
              // },
              // {
              //   path: '../',
              //   breadcrumbName: '내 문서',
              // },
            ],
          },
          extra: [           
          <Button type="primary" onClick={() => {navigate('/addBoard');}}>
            게시글 등록
          </Button>,
          <Popconfirm title="삭제하시겠습니까？" okText="네" cancelText="아니오" visible={visiblePopconfirm} onConfirm={deleteBoard} onCancel={() => {setVisiblePopconfirm(false);}}>
            <Button type="primary" danger disabled={!hasSelected} onClick={()=>{setVisiblePopconfirm(true);}}>
              삭제
            </Button>
          </Popconfirm>,
          <span>
            {hasSelected ? `${selectedRowKeys.length} 개의 문서가 선택됨` : ''}
          </span>
          ],
        }}
        content={'자주 사용하는 문서를 미리 등록할 수 있습니다.'}
        footer={[
        ]}
    >
      <br></br>
      <Table
        rowKey={ item => { return item._id } }
        columns={columns}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        // expandedRowRender={row => <TemplateExpander item={row} />}
        // expandRowByClick
        // rowSelection={rowSelection}
        onRow={record => ({
          onClick: e => {
            console.log(`user clicked on row ${record._id}!`);
            navigate(`/boardDetail`, { state: { boardId: record._id } } );
          }
        })}
        onChange={handleTableChange}
      />

    </PageContainer>
    </div>
    
  );
};

export default BoardList;
