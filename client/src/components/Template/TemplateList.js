import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Popover, Tooltip, Badge, Modal, Table, Input, Space, Button, Popconfirm, Tag, Progress, List, Pagination, Card } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, DeleteOutlined, FileOutlined, DownloadOutlined, FileAddOutlined, FormOutlined, FilePdfOutlined, ExclamationCircleOutlined, SettingTwoTone, QuestionCircleTwoTone } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { resetSignee, setTemplateInfo, setSignees as setTemplateSignees, setObservers as setTemplateObservers } from '../PrepareTemplate/AssignTemplateSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
// import { DocumentType, DocumentTypeText, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';
import TemplateExpander from "./TemplateExpander";
import { setTemplate, setDocumentType, setTemplateTitle, setTemplateType, setSendType, resetAssignAll, setSignees, setObservers } from '../Assign/AssignSlice';
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

import styled from 'styled-components';
const CardTitle = styled.div`
  // 한줄 자르기
  display: inline-block; 
  width: 260px; 
  // white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;

  // 여러줄 자르기 추가 속성 
  position:relative;
  white-space: normal; 
  line-height: 1.2; 
  height: 2.3em; 
  text-align: left; 
  word-wrap: break-word; 
  display: -webkit-box; 
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
    `;

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
  const [dataPrivate, setDataPrivate] = useState([]);
  const [dataPublic, setDataPublic] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  const [cardActionProps, setCardActionProps] = useState('actions');
  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [paginationPrivate, setPaginationPrivate] = useState({current:1, pageSize:10});
  const [paginationPublic, setPaginationPublic] = useState({current:1, pageSize:10});
  const [total, setTotal] = useState();
  const [totalPrivate, setTotalPrivate] = useState();
  const [totalPublic, setTotalPublic] = useState();
  const [current, setCurrent] = useState();
  const [currentPrivate, setCurrentPrivate] = useState();
  const [currentPublic, setCurrentPublic] = useState();
  const [pageSize, setPageSize] = useState(10);

  const [tab, setTab] = useState('total');

  const [loading, setLoading] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);
  // const [expandable, setExpandable] = useState();
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);

  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    fetchPrivate({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      uid: _id
    });
  };

  const fetchTotal = (params = {}) => {
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
        alert(response.data.error);
      }

    });
  };

  const fetchPrivate = (params = {}) => {
    setLoadingPrivate(true);

    axios.post('/api/template/templates', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const templates = response.data.templates;

        setPaginationPrivate({...params.pagination, total:response.data.total});
        setDataPrivate(templates);
        setTotalPrivate(response.data.total);
        setLoadingPrivate(false);

      } else {
        setLoadingPrivate(false);
        alert(response.data.error);
      }

    });
  };

  const fetchPublic = (params = {}) => {
    setLoadingPublic(true);

    axios.post('/api/template/templates', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const templates = response.data.templates;

        setPaginationPublic({...params.pagination, total:response.data.total});
        setDataPublic(templates);
        setTotalPublic(response.data.total);
        setLoadingPublic(false);

      } else {
        setLoadingPublic(false);
        alert(response.data.error);
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

    fetchPrivate({
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
            fetchPrivate({
              uid: _id,
              pagination: paginationPrivate,
              type: 'M'
            });
            fetchTotal({
              uid: _id,
              pagination: pagination,
              type: 'T'
            });
          }
        })
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  const signTemplate = (item, sendType) => {
    console.log(item._id);
    dispatch(resetAssignAll());
    dispatch(setDocumentType('TEMPLATE'));
    dispatch(setSendType(sendType)); //G:일반 B:대량

    if (item.type && item.type == 'C') {  //C:회사 M:멤버 
      dispatch(setTemplateType('C'));
    } else {
      dispatch(setTemplateType('M'));
    }

    if (sendType === 'G' && item.signees && item.signees.length > 0) {
      // 미리 등록한 참여자 설정값으로 서명 요청
      dispatch(setDocumentType('TEMPLATE_CUSTOM'));
      dispatch(setSignees(item.signees));
      dispatch(setObservers(item.observers));
    }
    
    dispatch(setTemplateTitle(`${item.docTitle}_${moment().format('YYYYMMDD')}`));
    dispatch(setTemplate(item));
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

    if (tab === 'private') {
      fetchPrivate({
        pagination: {current: 1, pageSize: pageSize},
        uid: _id,
        docTitle: value,
        type: 'M'
      });
    } else if (tab === 'total') {
      fetchTotal({
        pagination: {current: 1, pageSize: pageSize},
        uid: _id,
        docTitle: value,
        type: 'T'
      });
    } else {
      fetchPublic({
        pagination: {current: 1, pageSize: pageSize},
        uid: _id,
        docTitle: value,
        type: 'C'
      });
    }

  }

  const confirmToPrepare = (item) => {
    console.log(item.signees);
    confirm({
      title: '참여자 설정',
      icon: <QuestionCircleTwoTone />,
      content: '참여자 및 입력 항목을 등록 또는 수정 하시겠습니까?',
      okText: '네',
      okType: 'confirm',
      cancelText: '아니오',
      onOk() {
        dispatch(resetSignee());
        dispatch(setTemplateInfo(item));
        dispatch(setTemplateSignees(item.signees));
        dispatch(setTemplateObservers(item.observers));
        navigate('/assignTemplate');
      },
      onCancel() {
        // navigate('/templateList');
      },
    });
  }

  const description = (
    <div>
      <table width='100%' style={{tableLayout:'fixed'}}>
        <tbody>
          <tr>
            <td align='left' width='280px'>
              자주 사용하는 문서를 미리 등록할 수 있습니다.
              회사 템플릿 등록은 관리자에게 문의 해주세요.
            </td>
            <td align='right'>
            < img src={banner} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  // const cardData = data.map((item) => ({
  //   title: item.docTitle,
  //   subTitle: <Tag color="#5BD8A6">private</Tag>,
  //   actions: [<a key="run">서명 요청</a>, <a key="delete">삭제</a>],
  //   // avatar: 'https://gw.alipayobjects.com/zos/antfincdn/UCSiy1j6jx/xingzhuang.svg',
  //   content: (
  //     <div
  //       style={{
  //         flex: 1,
  //       }}
  //     >
  //       <div
  //         style={{
  //           width: 100
  //         }}
  //       >
  //         <img src={item.thumbnail} />
  //       </div>
  //     </div>
  //   ),
  // }));


  // const tableMode = (
  //   <Table
  //     rowKey={ item => { return item._id } }
  //     columns={columns}
  //     dataSource={data}
  //     pagination={pagination}
  //     loading={loading}
  //     expandedRowRender={row => <TemplateExpander item={row} />}
  //     expandRowByClick
  //     rowSelection={rowSelection}
  //     onRow={record => ({
  //       onClick: e => {
  //         // console.log(`user clicked on row ${record.t1}!`);
  //       }
  //     })}
  //     onChange={handleTableChange}
  //   />
  // )

  const btnReqeust = (item) => {
    // let txt = '한 문서를 여러 명에게 보내 개별 문서에 각각 서명 받을 필요가 있을 경우 (개별 동의서, 보안서약서 등)';
    // let chk = false;
    // if (item.type !== 'C' && item.users && item.users.length > 0) {
    //   txt = '참여자 설정된 템플릿은 대량 요청 불가';
    //   chk = true;
    // }
    return (
      <Popover
          content={
            <div>
            <Tooltip placement="bottom" title={'하나의 문서에 여러 참여자의 서명을 받는 경우'}>
              <Button onClick={e => { signTemplate(item, 'G') }}>일반 요청</Button>
            </Tooltip>
            &nbsp;&nbsp;
            <Tooltip placement="bottom" title={'한 문서를 여러 명에게 보내 개별 문서에 각각 서명 받을 필요가 있을 경우 (개별 동의서, 보안서약서 등)'}>
              <Button onClick={e => { signTemplate(item, 'B') }}>대량 요청</Button>
            </Tooltip>
            </div>
          }
          title="요청 유형 선택"
          trigger="click"
          placement="bottomLeft"
        >
          <Button type="text" icon={<FormOutlined />}>서명요청</Button>
      </Popover>
    )
  }
  const actionItems = (item) => {
    if (item.type && item.type == 'C') { 
      return (
        [btnReqeust(item),
        <Button type="text" icon={<FileOutlined />} onClick={e => { navigate('/previewPDF', {state: {docRef:item.docRef, docTitle:item.docTitle}}) }}>문서보기</Button>]
      )
    } else {
      return (
        [btnReqeust(item),
        <Button type="text" icon={<FileOutlined />} onClick={e => { navigate('/previewPDF', {state: {docRef:item.docRef, docTitle:item.docTitle}}) }}>문서보기</Button>,
        <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(item._id) }}>삭제</Button>]
      ) 
    }
  }

  const CustomLabel = (item) => {
    let label = '';
    let text = '';
    if (item.type !== 'C') {
      if (item.users && item.users.length > 0) {
        text = '파일 + 참여자';
      } else {
        text = '파일';
      }
      label = (
        <div style={{
            // transform: 'skew(0deg, 200deg)',
            fontSize: '1rem',
            backgroundColor: '#000000AA',
            color: 'white',
            textAlign: 'center',
            width: '280px'
          }}
          onClick={()=>{confirmToPrepare(item);}}
        >
          <span>{text}<SettingTwoTone twoToneColor="#52c41a" style={{fontSize: '1rem'}}/></span>
        </div>
      )
    }
    return (
      <div style={{
        backgroundImage: 'url('+item.thumbnail+')',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
        width: '280px',
        height: '395px',
        display: 'flex'
      }}>
        {label}
      </div>
    )
  }

  const cardModePrivate = (
    <List
    rowKey="id"
    loading={loading}
    grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
    dataSource={dataPrivate}
    // onChange={handlePageChange}
    pagination={{
      onChange: page => {
        console.log('page:'+page);
        setCurrentPrivate(page);
        fetchPrivate({
          pagination: {current: page, pageSize: pageSize},
          uid: _id,
          type: 'M'
        });
      },
      pageSize: pageSize,
      total: totalPrivate,
      current: currentPrivate
    }}
    // pagination={pagination}
    renderItem={item => (
      <List.Item key={item._id}>
        <Badge.Ribbon color={(item.type && item.type == 'C') ? '#519BE3' : 'green'} text={(item.type && item.type == 'C') ? '회사' : '개인'}>
        <ProCard 
          hoverable
          bordered
          title={<Tooltip placement="topLeft" title={item.docTitle} arrowPointAtCenter><CardTitle>{item.docTitle}</CardTitle></Tooltip>}
          // tooltip={moment(item.requestedTime).fromNow() + ' ' + item.user.name + ' ' + item.user.JOB_TITLE + ' ' + '생성'}
          // extra={moment(item.requestedTime).fromNow()}
          // subTitle={<Tag color="#5BD8A6">private</Tag>}
          // colSpan="300px" 
          layout="center" 
          style={{ minWidth: "320px", height: "100%" }}
          bodyStyle={{ padding: "5px"}}
          actions={actionItems(item)}>
            {/* <div><img src={item.thumbnail} style={{width: '280px', height: '395px'}} /></div> */}
            {CustomLabel(item)}
        </ProCard>
        </Badge.Ribbon>
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
        setCurrentPublic(page);
        fetchPublic({
          pagination: {current: page, pageSize: pageSize},
          uid: _id,
          type: 'C'
        });
      },
      pageSize: pageSize,
      total: totalPublic,
      current: currentPublic
    }}
    // pagination={pagination}
    renderItem={item => (
      <List.Item key={item._id}>
        <Badge.Ribbon color={(item.type && item.type == 'C') ? '#519BE3' : 'green'} text={(item.type && item.type == 'C') ? '회사' : '개인'}>
        <ProCard 
          hoverable
          bordered
          title={<Tooltip placement="topLeft" title={item.docTitle} arrowPointAtCenter><CardTitle>{item.docTitle}</CardTitle></Tooltip>}
          // tooltip={moment(item.requestedTime).fromNow() + ' ' + item.user.name + ' ' + item.user.JOB_TITLE + ' ' + '생성'}
          // extra={moment(item.requestedTime).fromNow()}
          // subTitle={<Tag color="#5BD8A6">private</Tag>}
          // colSpan="300px" 
          layout="center" 
          style={{ minWidth: "320px", height: "100%" }}
          bodyStyle={{ padding: "5px"}}
          actions={actionItems(item)}>
            {/* <div><img src={item.thumbnail} style={{width: '280px', height: '395px'}} /></div> */}
            {CustomLabel(item)}
        </ProCard>
        </Badge.Ribbon>
      </List.Item>
    )}
    />
  )

  const cardModeTotal = (
    <List
    rowKey="id"
    loading={loading}
    grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
    dataSource={data}
    // onChange={handlePageChange}
    pagination={{
      onChange: page => {
        console.log('page:'+page);
        setCurrent(page);
        fetchTotal({
          pagination: {current: page, pageSize: pageSize},
          uid: _id,
          type: 'T'
        });
      },
      pageSize: pageSize,
      total: total,
      current: current
    }}
    // pagination={pagination}
    renderItem={item => (
      <List.Item key={item._id}>
        <Badge.Ribbon color={(item.type && item.type == 'C') ? '#519BE3' : 'green'} text={(item.type && item.type == 'C') ? '회사' : '개인'}>
        <ProCard 
          hoverable
          bordered
          title={<Tooltip placement="topLeft" title={item.docTitle} arrowPointAtCenter><CardTitle>{item.docTitle}</CardTitle></Tooltip>}
          layout="center" 
          style={{ minWidth: "320px", height: "100%" }}
          bodyStyle={{ padding: "5px"}}
          actions={actionItems(item)}>
            {/* <div><img src={item.thumbnail} style={{width: '280px', height: '395px'}} /></div> */}
            {CustomLabel(item)}
        </ProCard>
        </Badge.Ribbon>
      </List.Item>
    )}
    />
  )

  const viewCard = () => {
    if (tab === 'private') {
      return cardModePrivate;
    } else if (tab === 'public') {
      return cardModePublic;
    } else {
      return cardModeTotal;
    }
  }

  useEffect(() => {

    fetchTotal({
      uid: _id,
      pagination: pagination,
      type: 'T'
    });

    fetchPrivate({
      uid: _id,
      pagination: paginationPrivate,
      type: 'M'
    });

    fetchPublic({
      uid: _id,
      pagination: paginationPublic,
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
          (tab != 'public') ? <Button type="primary" icon={<FileAddOutlined />} onClick={() => {navigate('/uploadTemplate');}}>
            템플릿 등록
          </Button> : '',
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
            tab: '전체',
            key: 'total',
          },
          {
            tab: '개인 템플릿',
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

      {viewCard()}

    </PageContainer>
    </div>
    
  );
};

export default TemplateList;
