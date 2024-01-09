import React, { useEffect, useState } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { v4 as uuidv4 } from 'uuid';
import { Table, Input, Space, Button, TreeSelect, Modal } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined, PaperClipOutlined } from '@ant-design/icons';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import 'moment/locale/ko';
import { FileOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { TableDropdown } from '@ant-design/pro-table';
import 'antd/dist/antd.css';
import { useIntl } from 'react-intl';

const { SHOW_PARENT } = TreeSelect;

const TemplateList = () => {

  const { formatMessage } = useIntl();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  const [pagination, setPagination] = useState({current:1, pageSize:10, showSizeChanger: true});
  const [loading, setLoading] = useState(false);
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);
  // const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [treeValue, setTreeValue] = useState();
  const [treeData, setTreeData] = useState();
  const [shareModal, setShareModal] = useState(false);

  // const searchInput = useRef<Input>(null);

  const treeProps = {
    treeData,
    value: treeValue,
    onChange: (value) => {
      setTreeValue(value);
    },
    treeCheckable: false,
    showSearch: true,
    showArrow: true,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '임직원 검색',
    size: 'middle',
    style: {
      width: '90%',
      marginTop: '10px'
    },
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

  const fetch = (params = {}) => {
    setLoading(true);

    axiosInterceptor.post('/admin/templates/list', params).then(response => {

      console.log(response);
      if (response.data.success) {
        const templates = response.data.templates;

        setPagination({...params.pagination, total:response.data.total});
        setData(templates);
        setLoading(false);

      } else {
        setLoading(false);
        console.log(response.data.error);
      }

    }).catch(error => { console.log(error);});
  };

  // 전체부서 트리 구조 조회
  const fetchTreeSelect = async () => {
    setLoading(true);
    let users = [];
    let resp = await axiosInterceptor.post('/admin/user/tree');
    if (resp.data.success) {
      users = resp.data.users;
      // setUsers(resp.data.users);
    }
    resp = await axiosInterceptor.post('/admin/org/list');
    if (resp.data.success) {
      let orgs = resp.data.orgs;
      setOrgs(orgs);
      
      let tree = [];
      const level1 = orgs.filter(e => e.PARENT_NODE_ID === '');
      level1.forEach(org => {
        let org1 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: [], selectable: false}
        insertUser(org1, users, org.DEPART_CODE);
        let level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
        if (level2) callRecursive(org1, level2, users, orgs)
        tree.push(org1)
      })
      setTreeData(tree);
      setLoading(false);
      console.log(tree);
    } else {
      setLoading(false);
      console.log('ERROR');
    }
    fetch({pagination});
  };

  const insertUser = (org, users, depart_code) => {
    let filterUser = users.filter(e => e.DEPART_CODE === depart_code);
    filterUser.map(user => (
      org.children.push({value: user._id + '|' + user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
    ));
  };

  const callRecursive = (currentOrg, level, users, orgs) => {
    level.forEach(org => {
      let current = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: [], selectable: false}
      insertUser(current, users, org.DEPART_CODE);
      currentOrg.children?.push(current);
      let subLevel = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
      if (subLevel && subLevel.length > 0) callRecursive(current, subLevel, users, orgs);
    });
  }

  const deleteTemplate = async (docId) => {
    
    setVisiblePopconfirm(false);

    let param = {
      // _ids: selectedRowKeys
      _ids: docId
    }

    const res = await axiosInterceptor.post('/admin/templates/delete', param);
    if (res.data.success) {
      // alert('삭제 되었습니다.');
    } else {
      // alert('삭제 실패 하였습니다.');
    }

    setSelectedRowKeys([]);
    // setHasSelected(false);
    
    fetch({
      pagination
    });

  }

  const changeCreator = async () => {

    let param = {
      docId: selectedRowKeys,
      usrId: treeValue.split('|')[0]
    }

    const res = await axiosInterceptor.post('/admin/templates/update', param);
    if (res.data.success) {
      alert('생성자 변경 성공');
    } else {
      alert('생성자 변경 실패');
    }

    setSelectedRowKeys([]);
    setShareModal(false);
    fetch({
      pagination
    });

  }

  const selectAction = async (key, record) => {
    if (key === 'detail') {
      navigate('/viewTemplate', { state: {docInfo: record, pagination: pagination} });
    }
    if (key === 'delete') {
      deleteTemplate(record._id);
    }
    if (key === 'change') {
      setSelectedRowKeys([record._id]);
      setTreeValue(record.user._id + '|' + record.user.SABUN + '|' + record.user.name + (record.user.JOB_TITLE?' '+record.user.JOB_TITLE:'')); // 코드 기반 DISP 조립
      setShareModal(true);
    }
  }

  const getColumnSearchProps = dataIndex => ({

    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          // ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={e => {e.stopPropagation();handleSearch(selectedKeys, confirm, dataIndex);}}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            key={uuidv4()}
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            검색
          </Button>
          <Button key={uuidv4()} onClick={() => handleReset(clearFilters, confirm)} size="small" style={{ width: 90 }}>
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
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      )
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
    confirm();
  }

  const handleReset = (clearFilters, confirm) => {
    clearFilters();
    setSearchText('');
    confirm();
  }
  
  const columns = [
    // {
    //   title: '유형',
    //   dataIndex: 'type',
    //   sorter: true,
    //   key: 'type',
    //   filterMultiple: false,
    //   filters: [
    //     { text: '신청', value: 'C' },
    //     { text: '회사', value: 'G' },
    //     { text: '개인', value: 'M' },
    //     // { text: '전체', value: 'T' },
    //   ],
    //   onFilter: (value, record) => record.type.indexOf(value) === 0,
    //   render: (text) => {
    //     switch(text) {
    //       case 'C': return '신청';
    //       case 'G': return '회사';
    //       case 'M': return '개인';
    //       case 'T': return '전체';
    //       default : return text;
    //     }
    //   }
    // },
    // {
    //   title: '회사',
    //   key: 'com',
    //   ...getColumnSearchProps('com'),
    //   render: (row) => {
    //     return orgs.find(e => e.DEPART_CODE === row.COMPANY_CODE)?orgs.find(e => e.DEPART_CODE === row.COMPANY_CODE).DEPART_NAME:'';
    //   },
    //   align: 'center'
    // },
    {
      title: '제목',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
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
      title: '생성자',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
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
      title: '생성 일시',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      render: (text, row) => {
        return <Moment format="YYYY/MM/DD HH:mm">{row['registeredTime']}</Moment>
      }
    },
    {
      title: '관리',
      valueType: 'option',
      render: (text, record, _, action) => [
        <TableDropdown
          key="actionGroup"
          onSelect={(key) => selectAction(key, record)}
          menus={[
            { key: 'detail', name: '템플릿 상세' },
            { key: 'delete', name: '템플릿 삭제' },
            { key: 'change', name: '생성자 변경' }
          ]}
        />,
      ],
      align: 'center'
    }
  ];

  // const rowSelection = {
  //   selectedRowKeys,
  //   onChange : selectedRowKeys => {
  //     console.log('selectedRowKeys changed: ', selectedRowKeys);
  //     setSelectedRowKeys(selectedRowKeys);
  //     setHasSelected(selectedRowKeys.length > 0);
  //   }
  // };

  useEffect(() => {
    fetchTreeSelect();
    return () => {
      setSearchText('');
      setSearchedColumn('');
      setData([]);
      setSelectedRowKeys([]);
      // setHasSelected(false);
      setPagination({current:1, pageSize:10, showSizeChanger: true});
      setLoading(false);
      setVisiblePopconfirm(false);
    } // cleanup
  }, []);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'document.template'}),
          ghost: false,
          breadcrumb: {
            routes: [

            ],
          },
          extra: [           
          <Button key={uuidv4()} type="primary" onClick={() => {navigate('/uploadTemplate');}}>
            템플릿 등록
          </Button>,
          // <Popconfirm key={uuidv4()} title="삭제하시겠습니까？" okText="네" cancelText="아니오" visible={visiblePopconfirm} onConfirm={deleteTemplate} onCancel={() => {setVisiblePopconfirm(false);}}>
          //   <Button key={uuidv4()} type="primary" danger disabled={!hasSelected} onClick={()=>{setVisiblePopconfirm(true);}}>
          //     삭제
          //   </Button>
          // </Popconfirm>,
          // <span key={uuidv4()}>
          //   {hasSelected ? `${selectedRowKeys.length} 개의 문서가 선택됨` : ''}
          // </span>
          ],
        }}
        // content={'회사에서 공통으로 사용하는 문서를 등록할 수 있습니다.'}
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
        // rowSelection={rowSelection}
        onRow={record => ({
          onClick: e => {
            // console.log(`user clicked on row ${record.t1}!`);
          }
        })}
        onChange={handleTableChange}
      />

    </PageContainer>
    <Modal
        open={shareModal}
        width={480}
        title="생성자 변경"
        onCancel={()=>{setShareModal(false)}}
        footer={[
          <Button key={uuidv4()} type="primary" onClick={changeCreator}>
            저장
          </Button>
        ]}
    >
      <TreeSelect {...treeProps} style={{width:'100%'}} />
    </Modal>
    </div>
  );
};

export default TemplateList;
