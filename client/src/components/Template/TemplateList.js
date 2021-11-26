import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Modal, Table, Input, Space, Button, Popconfirm, Tag, Progress, List, Pagination, Card } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, DeleteOutlined, FileOutlined, DownloadOutlined, EditOutlined, FormOutlined, FilePdfOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
// import { DocumentType, DocumentTypeText, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';
import TemplateExpander from "./TemplateExpander";
import { setTemplate, setDocumentType, setTemplateTitle, setTemplateType } from '../Assign/AssignSlice';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";
import banner from '../../assets/images/sub_top4.png'

import ProList from '@ant-design/pro-list';
import { ProFormRadio } from '@ant-design/pro-form';
import '@ant-design/pro-list/dist/list.css';

import ProCard from '@ant-design/pro-card';
import { CheckCard } from '@ant-design/pro-card';
import '@ant-design/pro-card/dist/card.css';
import '@ant-design/pro-form/dist/form.css';

const { Search } = Input;
const { confirm } = Modal;
const { Meta } = Card;

const TemplateList = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [dataPublic, setDataPublic] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  const [cardActionProps, setCardActionProps] = useState('actions');
  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [total, setTotal] = useState();
  const [totalPublic, setTotalPublic] = useState();
  const [pageSize, setPageSize] = useState(10);

  const [tab, setTab] = useState('private');

  const [loading, setLoading] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);
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

    axios.post('/api/template/templates', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const templates = response.data.templates;

        setPagination({...params.pagination, total:response.data.total});
        setData(templates);
        setTotal(response.data.total);
        setLoading(false);

      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const fetchPublic = (params = {}) => {
    setLoadingPublic(true);

    axios.post('/api/template/templates', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const templates = response.data.templates;

        setPagination({...params.pagination, total:response.data.total});
        setDataPublic(templates);
        setTotalPublic(response.data.total);
        setLoadingPublic(false);

      } else {
        setLoadingPublic(false);
          alert(response.data.error)
      }

    });
  };

  const deleteTemplate = async (_id) => {
    
    setVisiblePopconfirm(false);

    let param = {
      _ids: selectedRowKeys
    }

    console.log("param:" + param)
    const res = await axios.post('/api/template/deleteTemplate', param)
    if (res.data.success) {
      // alert('삭제 되었습니다.')
    } else {
      // alert('삭제 실패 하였습니다.')
    }

    setSelectedRowKeys([]);
    setHasSelected(false)

    fetch({
      uid: _id,
      pagination,
    });

  }

  const deleteTemplateSingle = async (templateId) => {
    console.log("_id:"+_id)
    confirm({
      title: '삭제하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      content: '해당 템플릿이 영구 삭제됩니다.',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        axios.post('/api/template/deleteTemplate', {_ids: [templateId]}).then(response => {
          if (response.data.success) {
            fetch({
              uid: _id,
              pagination,
            });
          }
        })
      },
      onCancel() {
        console.log('Cancel');
      },
    });    
  }

  const signTemplate = (item) => {
    console.log(item._id);
    dispatch(setDocumentType('TEMPLATE'))
    dispatch(setTemplateType('M'))
    dispatch(setTemplateTitle(item.docTitle))
    dispatch(setTemplate(item))
    navigate('/assign');
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
      title: '',
      dataIndex: 'thumbnail',
      sorter: true,
      key: 'thumbnail',
      expandable: true,
      render: (text,row) => <div><img src={text} /></div>,
    },
    {
      title: '템플릿 이름',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text,row) => <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '생성자',
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
      title: '생성 일시',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      width: '110px',
      render: (text, row) => {
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

  const onSearch = value => {

    fetch({
      pagination: {current: 1, pageSize: pageSize},
      uid: _id,
      docTitle: value,
      // docTitle: value.normalize('NFC')
    });

  }


  const description = (
    <div>
      <table width='100%' style={{tableLayout:'fixed'}}>
        <tr>
          <td align='left' width='280px'>
            자주 사용하는 문서를 미리 등록할 수 있습니다.
          </td>
          <td align='right'>
          < img src={banner} />
          </td>
        </tr>
      </table>
    </div>
  )

  const cardData = data.map((item) => ({
    title: item.docTitle,
    subTitle: <Tag color="#5BD8A6">private</Tag>,
    actions: [<a key="run">서명 요청</a>, <a key="delete">삭제</a>],
    // avatar: 'https://gw.alipayobjects.com/zos/antfincdn/UCSiy1j6jx/xingzhuang.svg',
    content: (
      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            width: 100
          }}
        >
          <img src={item.thumbnail} />
        </div>
      </div>
    ),
  }));



  const tableMode = (
    <Table
      rowKey={ item => { return item._id } }
      columns={columns}
      dataSource={data}
      pagination={pagination}
      loading={loading}
      expandedRowRender={row => <TemplateExpander item={row} />}
      expandRowByClick
      rowSelection={rowSelection}
      onRow={record => ({
        onClick: e => {
          // console.log(`user clicked on row ${record.t1}!`);
        }
      })}
      onChange={handleTableChange}
    />
  )

  const cardMode = (
    <List
    rowKey="id"
    loading={loading}
    grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
    dataSource={data}
    // onChange={handlePageChange}
    pagination={{
      onChange: page => {
        console.log('page:'+page);
        fetch({
          pagination: {current: page, pageSize: pageSize},
          uid: _id
        });
      },
      pageSize: pageSize,
      total: total
    }}
    // pagination={pagination}
    renderItem={item => (
      <List.Item key={item._id}>
        <ProCard 
          hoverable
          bordered
          title={<div style={{ wordWrap: 'break-word', wordBreak: 'break-word', maxWidth: "280px" }}>{item.docTitle} <Tag color="#5BD8A6">private</Tag></div>}
          // tooltip={moment(item.requestedTime).fromNow() + ' ' + item.user.name + ' ' + item.user.JOB_TITLE + ' ' + '생성'}
          // extra={moment(item.requestedTime).fromNow()}
          // subTitle={<Tag color="#5BD8A6">private</Tag>}
          // colSpan="300px" 
          layout="center" 
          style={{ minWidth: "300px", height: "100%" }}
          bodyStyle={{ padding: "5px"}}
          actions={[
            <Button type="text" icon={<FormOutlined />} onClick={e => { signTemplate(item) }}>서명요청</Button>,
            <Button type="text" icon={<FilePdfOutlined />} onClick={e => { navigate('/previewPDF', {state: {docRef:item.docRef, docTitle:item.docTitle}}) }}>문서보기</Button>,
            <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(item._id) }}>삭제</Button>,
          ]}>
            <div><img src={item.thumbnail} style={{width: '280px'}} /></div>
        </ProCard>
      </List.Item>
    )}
    />
  )

  const cardModePublic = (
    <List
    rowKey="id"
    loading={loadingPublic}
    grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
    dataSource={dataPublic}
    // onChange={handlePageChange}
    pagination={{
      onChange: page => {
        console.log('page:'+page);
        fetch({
          pagination: {current: page, pageSize: pageSize},
          uid: _id,
          type: 'C'
        });
      },
      pageSize: pageSize,
      total: total
    }}
    // pagination={pagination}
    renderItem={item => (
      <List.Item key={item._id}>
        <ProCard 
          hoverable
          bordered
          title={<div style={{ wordWrap: 'break-word', wordBreak: 'break-word', maxWidth: "280px" }}>{item.docTitle} <Tag color="#519BE3">public</Tag></div>}
          // tooltip={moment(item.requestedTime).fromNow() + ' ' + item.user.name + ' ' + item.user.JOB_TITLE + ' ' + '생성'}
          // extra={moment(item.requestedTime).fromNow()}
          // subTitle={<Tag color="#5BD8A6">private</Tag>}
          // colSpan="300px" 
          layout="center" 
          style={{ minWidth: "300px", height: "100%" }}
          bodyStyle={{ padding: "5px"}}
          actions={[
            <Button type="text" icon={<FormOutlined />} onClick={e => { signTemplate(item) }}>서명요청</Button>,
            <Button type="text" icon={<FilePdfOutlined />} onClick={e => { navigate('/previewPDF', {state: {docRef:item.docRef, docTitle:item.docTitle}}) }}>문서보기</Button>,
            // <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(item._id) }}>삭제</Button>,
          ]}>
            <div><img src={item.thumbnail} style={{width: '280px'}} /></div>
        </ProCard>
      </List.Item>
    )}
    />
  )

  useEffect(() => {

    fetch({
      uid: _id,
      pagination,
    });

    fetchPublic({
      uid: _id,
      pagination,
      type: 'C'
    });

  }, [_id]);


  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'document.template'}),
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
          <Search style={{ width: 200 }} placeholder="문서명 검색" onSearch={onSearch} enterButton />,           
          <Button type="primary" onClick={() => {navigate('/uploadTemplate');}}>
            템플릿 등록
          </Button>,
          // <Popconfirm title="삭제하시겠습니까？" okText="네" cancelText="아니오" visible={visiblePopconfirm} onConfirm={deleteTemplate} onCancel={() => {setVisiblePopconfirm(false);}}>
          //   <Button type="primary" danger disabled={!hasSelected} onClick={()=>{setVisiblePopconfirm(true);}}>
          //     삭제
          //   </Button>
          // </Popconfirm>,
          // <span>
          //   {hasSelected ? `${selectedRowKeys.length} 개의 문서가 선택됨` : ''}
          // </span>
          ],
        }}
        tabList={[
          {
            tab: '내 템플릿',
            key: 'private',
          },
          {
            tab: '회사 템플릿',
            key: 'public',
          },
        ]}
        onTabChange={(key)=>{setTab(key)}}
        content={description}
        footer={[
        ]}
    >
      <br></br>

      {/* {tableMode} */}
      {/* {cardMode} */}

      {tab === 'private' ? cardMode : cardModePublic}

    </PageContainer>
    </div>
    
  );
};

export default TemplateList;
