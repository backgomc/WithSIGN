import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Popover, Tooltip, Badge, Modal, Table, Input, Space, Button, Tag, List, Card, Radio } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, DeleteOutlined, FileOutlined, FileAddOutlined, FormOutlined, ExclamationCircleOutlined, SettingTwoTone, QuestionCircleTwoTone, UnorderedListOutlined, AppstoreOutlined, UserAddOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, setDefaultSetting, selectDefaultSetting } from '../../app/infoSlice';
import { resetSignee, setTemplateInfo, setIsWithPDF, setSignees as setTemplateSignees, setObservers as setTemplateObservers } from '../PrepareTemplate/AssignTemplateSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import { setDirect } from '../SignDirect/DirectSlice';
import { setHasRequester, setTemplate, setDocumentType, setTemplateTitle, setTemplateType, setSendType, resetAssignAll, setSignees, setObservers, setIsWithPDF as setIsWithPDF2 } from '../Assign/AssignSlice';
import { PageContainer } from '@ant-design/pro-layout';
import RcResizeObserver from 'rc-resize-observer';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";
import loadash from 'lodash';
import banner from '../../assets/images/sub_top4.png'
import banner_small from '../../assets/images/sub_top4_2.png'
import ProCard from '@ant-design/pro-card';
import '@ant-design/pro-list/dist/list.css';
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
  // height: 2.3em; 
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
  const defaultSetting = useSelector(selectDefaultSetting);

  const { _id, name, COMPANY_CODE } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState();
  const [current, setCurrent] = useState();


  const [responsive, setResponsive] = useState(false);

  const [tab, setTab] = useState('total');
  const [listStyle, setListStyle] = useState(defaultSetting?.templateListStyle ? defaultSetting?.templateListStyle : 'cardStyle');
  const [loading, setLoading] = useState(false);
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);

    // 검색 Highlight 처리를 위해 저장
    const [tableState, setTableState] = useState({});

  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)

  useEffect(() => {
    loadData();
  }, [tab]);
  
  const loadData = () => {
    fetchTemplates({
      pagination : {current: 1, pageSize: pageSize},
      uid: _id,
      type: templateType(),
      COMPANY_CODE: COMPANY_CODE
    });

    setCurrent(1);
  }

  // fetch (전체 통합)
  const fetchTemplates = (params = {}) => {
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
            loadData();
          }
        })
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  const signTemplate = async (item, sendType) => {
    if (sendType === 'D') { //바로 신청하기
      dispatch(setDirect(item));
      dispatch(resetAssignAll());
      dispatch(setSignees(item.signees));
      dispatch(setTemplateType('C'));
      dispatch(setSendType('G'));
      dispatch(setDocumentType('DIRECT'));
      dispatch(setTemplateTitle(`${item.docTitle}_${name}_${moment().format('YYYYMMDD')}`));
      dispatch(setObservers(item.observers));
      dispatch(setIsWithPDF2(item.isWithPDF));

      navigate('/signDirect');

    } else {
      dispatch(resetAssignAll());
      dispatch(setDocumentType('TEMPLATE'));
      dispatch(setSendType(sendType)); //G:일반 B:대량 D:바로신청
  
      if (item.type && item.type == 'C') {  //C:회사 M:멤버 
        dispatch(setTemplateType('C'));
      } else {
        dispatch(setTemplateType('M'));
      }
  
      if (sendType === 'G' && item.hasRequester || (item.signees && item.signees.length > 0)) {
        // 미리 등록한 참여자 설정값으로 서명 요청
        dispatch(setDocumentType('TEMPLATE_CUSTOM'));
        
        dispatch(setSignees(item.signees));
        dispatch(setHasRequester(false));
        dispatch(setObservers(item.observers));
      
        // 대량전송도 템플릿 이용시 컴포넌트 적용
      } else if (sendType === 'B' && item.hasRequester || (item.signees && item.signees.length > 0)) {
        dispatch(setDocumentType('TEMPLATE_CUSTOM'));
        if (item.hasRequester) {
          dispatch(setHasRequester(true));
        } else {
          dispatch(setHasRequester(false));
        }
      }
      
      dispatch(setTemplateTitle(`${item.docTitle}_${moment().format('YYYYMMDD')}`));
      dispatch(setTemplate(item));
  
      navigate('/assign');

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
    // {
    //   title: '',
    //   dataIndex: 'thumbnail',
    //   sorter: true,
    //   key: 'thumbnail',
    //   expandable: true,
    //   render: (text,row) => <div><img src={text} style={{width:'50px'}} /></div>,
    // },
    {
      title: '템플릿명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text,row) => <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{row.type === 'C' ?  <Tag color="#519BE3">신청</Tag>: <Tag color="#87d068">일반</Tag>}
        {searchedColumn === 'docTitle' ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      )}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '등록자',
      dataIndex: ['user', 'name'],
      responsive: ['xl'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      width: '115px',
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
      dataIndex: 'registeredTime',
      responsive: ['xl'],
      sorter: true,
      key: 'registeredTime',
      width: '130px',
      render: (text, row) => {
        return (<font color='#787878'>{<font color='#787878'><Moment format='YY/MM/DD HH:mm'>{row["registeredTime"]}</Moment></font>}</font>)
      } 
    },
    {
      title: '',
      key: 'action',
      width: '110px',
      render: (_,row) => {
        return (
        <Space>
          {(row.type && row.type == 'C') ? <Tooltip placement="top" title={'신청/제출'}><Button icon={<FormOutlined />} onClick={e => { signTemplate(row, 'D') }}></Button></Tooltip> : <Popover
            content={
              <div>
              <Tooltip placement="bottom" title={'하나의 문서에 여러 참여자의 서명을 받는 경우'}>
                <Button onClick={e => { signTemplate(row, 'G') }}>일반 요청</Button>
              </Tooltip>
              &nbsp;&nbsp;
              <Tooltip placement="bottom" title={'한 문서를 여러 명에게 보내 개별 문서에 각각 서명 받을 필요가 있을 경우 (개별 동의서, 보안서약서 등)'}>
                <Button onClick={e => { signTemplate(row, 'B') }}>대량 요청</Button>
              </Tooltip>
              </div>
            }
            title="요청 유형 선택"
            trigger="click"
            placement="bottomLeft"
          >
            <Tooltip placement="top" title={'서명요청'}><Button icon={<FormOutlined />}></Button></Tooltip>
          </Popover>}

          <Tooltip placement="top" title={'문서 보기'}>
          <Button icon={<FileOutlined />} onClick={e => { navigate('/previewPDF', {state: {templateId: row._id, docRef:row.docRef, docTitle:row.docTitle, openTargets:row.openTargets, userInfo:row.user}}) }}></Button>
          </Tooltip>

          {(row.user?._id === _id || user.role ) ? <Badge size="small" count={(row.hasRequester || (row.users && row.users.length > 0 || (row.requesters && row.requesters.length > 0))) ? row.users?.length + row.requesters?.length : '0'} color='#108ee9'><Tooltip placement="top" title={'참여자 설정'}><Button icon={<UserAddOutlined />} onClick={e => { confirmToPrepare(row) }}></Button></Tooltip></Badge> : ''}

          {(row.user?._id === _id || user.role) ? <Tooltip placement="top" title={'문서 삭제'}><Button danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(row._id) }}></Button></Tooltip> : ''}
        </Space>
        )
      }
    },
  ];

  const onSearch = value => {
    fetchTemplates({
      pagination : pagination,
      docTitle: value,
      uid: _id,
      type: templateType(),
      COMPANY_CODE: COMPANY_CODE
    });
    
    let filters;
    if (tableState.filters) {
      filters = loadash.cloneDeep(tableState.filters);
      filters.docTitle = [value];
    } else {
      filters = {status:[], docTitle: [value]} 
    }

    setTableState({filters: filters, sorter: tableState?.sorter});
    setSearchText(value);
    setSearchedColumn('docTitle');
  }

  const confirmToPrepare = (item, isReset) => {
    console.log(item.signees);
    confirm({
      title: isReset ? 'PDF편집툴 변경으로 인해 입력항목 재설정이 필요합니다.' : '참여자 설정',
      icon: <QuestionCircleTwoTone />,
      content: isReset ? '지금 바로 재설정을 하시겠습니까?' : '참여자 및 입력 항목을 등록 또는 수정 하시겠습니까?',
      okText: '네',
      okType: 'confirm',
      cancelText: '아니오',
      onOk() {
        dispatch(resetSignee());
        dispatch(setTemplateInfo(item));
        dispatch(setTemplateTitle(item.docTitle));
        dispatch(setIsWithPDF(item.isWithPDF));
        if(item.hasRequester) {
          // dispatch(setTemplateSignees([...item.signees, {key:'requester1',name:'서명 참여자1',order:0}]));
          dispatch(setTemplateSignees([...item.signees, ...item.requesters]));
        } else {
          dispatch(setTemplateSignees(item.signees));
        }
        
        // dispatch(setTemplateSignees(item.signees));
        dispatch(setTemplateObservers(item.observers));
        dispatch(setTemplateType(item.type));
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
              신청서 등록은 관리자에게 문의 해주세요.
            </td>
            <td align='right'>
            <img src={responsive? banner_small : banner} width={responsive ? "100px" : "500px"} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const btnReqeust = (item) => {
    return (
      item.type && item.type == 'C' ? 
      <Tooltip placement="top" title='신청/제출'><Button type="text" icon={<FormOutlined />} onClick={e => { signTemplate(item, 'D') }}>{(item.user?._id === _id || user.role)? '': '신청/제출'}</Button></Tooltip> :
      <Tooltip placement="top" title='서명요청'>
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
          <Button type="text" icon={<FormOutlined />}>{(item.user?._id === _id || user.role)? '': '서명요청'}</Button>
      </Popover>
      </Tooltip>
    )
  }

  const actionItems = (item) => {
    if (item.user?._id === _id || user.role) {
      return (
      [btnReqeust(item),
        
        <Tooltip placement="top" title={'문서 보기'}><Button type="text" icon={<FileOutlined />} onClick={e => { navigate('/previewPDF', {state: {templateId: item._id, docRef:item.docRef, docTitle:item.docTitle, openTargets:item.openTargets, userInfo:item.user}}) }}></Button></Tooltip>,

        <Badge count={(item.hasRequester || (item.users && item.users.length > 0 || (item.requesters && item.requesters.length > 0))) ? item.users?.length + item.requesters?.length : '0'} color='#108ee9'><Tooltip placement="top" title={'참여자 설정'}><Button type="text" icon={<UserAddOutlined />} onClick={e => { confirmToPrepare(item) }}></Button></Tooltip></Badge>,

        <Tooltip placement="top" title={'문서 삭제'}><Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteTemplateSingle(item._id) }}></Button></Tooltip>]);
    } else {
      return (
      [btnReqeust(item),
        <Button type="text" icon={<FileOutlined />} onClick={e => { navigate('/previewPDF', {state: {templateId: item._id, docRef:item.docRef, docTitle:item.docTitle, openTargets:item.openTargets, userInfo:item.user}}) }}>문서조회</Button>]);
    }
  }

  // type: C(신청서), M(개인), G(회사)
  const CustomLabel = (item) => {
    let label = '';
    let text = '';
    // if (item.type !== 'C' || (item.type === 'C' && user.role)) {
    if (item.user?._id === _id || user.role ) {
      if (item.hasRequester || (item.users && item.users.length > 0)) {
        text = !item.isWithPDF ? '입력항목 재설정 필요' : '파일 + 참여자';
      } else {
        text = '파일';
      }
      label = (
        <div style={{
            // transform: 'skew(0deg, 200deg)',
            fontSize: '1rem',
            backgroundColor: (item.hasRequester || (item.users && item.users.length > 0))  && !item.isWithPDF ? '#f50' : '#000000AA',
            color: 'white',
            textAlign: 'center',
            width: '280px'  // 280px
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
        backgroundSize: 'contain',  //contain: 이미지의 가로세로 비율을 유지하면서, 이미지가 잘리지 않을 때까지만 채움, cover: 이미지의 가로세로 비율을 유지하면서, 이미지가 잘리더라도 주어진 크기를 꽉 채움
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%', // 280px
        height: '100%',  //395px
        display: 'flex'
      }}>
        {/* {label} */}
      </div>
    )
  }

  const viewCard = (
    <List
    rowKey="id"
    loading={loading}
    grid={{ gutter: 24, xs: 1 }}
    dataSource={data}
    pagination={{
      onChange: page => {
        console.log('page:'+page);
        setCurrent(page);

        fetchTemplates({
          pagination : {current: page, pageSize: pageSize},
          uid: _id,
          type: templateType(),
          COMPANY_CODE: COMPANY_CODE
        });

      },
      pageSize: pageSize,
      total: total,
      current: current
    }}
    renderItem={item => (
      <List.Item key={item._id}>
        <Badge.Ribbon color={(item.type && item.type == 'C') ? '#519BE3' : 'green'} text={(item.type && item.type == 'C') ? '신청' : '개인'}>
        <ProCard 
          hoverable
          bordered
          title={<Tooltip placement="topLeft" title={item.docTitle} arrowPointAtCenter><CardTitle>{item.docTitle}</CardTitle></Tooltip>}
          // extra={<Button icon={<InfoCircleOutlined />} type='link'></Button>}
          layout="center" 
          style={{ minWidth: "320px", height: "450px" }}
          bodyStyle={{ padding: "2px", height: '100%'}}
          actions={actionItems(item)}>
            {/* <div><img src={item.thumbnail} style={{width: '280px', height: '395px'}} /></div> */}
            {CustomLabel(item)}
        </ProCard>
        </Badge.Ribbon>
      </List.Item>
    )}
    />
  )

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called", pagination)
    console.log(filters)

    setCurrent(pagination?.current)

    fetchTemplates({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      uid: _id,
      type: templateType(),
      COMPANY_CODE: COMPANY_CODE
    });

  };

  const viewTable = (
    <Table
      rowKey={ item => { return item._id } }
      columns={columns}
      dataSource={data}
      pagination={pagination}
      loading={loading}
      onRow={record => ({
        onClick: e => {
          // console.log(`user clicked on row ${record.t1}!`);
        }
      })}
      onChange={handleTableChange}
    />
  )

  const templateType = () => {
    let type = 'T';
    if (tab === 'total') {
      type = 'T';
    } else if (tab === 'group') {
      type = 'G';
    } else if (tab === 'public') {
      type = 'C';
    } else if (tab === 'private') {
      type = 'M';
    } else {
      type = 'T';
    }
    return type;
  }

  const onChangeListStyle = (e) => {
    setListStyle(e.target.value)
    dispatch(setDefaultSetting({'templateListStyle' : e.target.value}));
  }

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
          <Radio.Group defaultValue={listStyle} onChange={onChangeListStyle}>
            <Radio.Button value="cardStyle"><AppstoreOutlined /></Radio.Button>
            <Radio.Button value="tableStyle"><UnorderedListOutlined /></Radio.Button>
          </Radio.Group>,   
          <Search style={{ width: 200 }} placeholder="문서명 검색" onSearch={onSearch} enterButton />,   
          <Button type="primary" icon={<FileAddOutlined />} onClick={() => {navigate('/uploadTemplate', {state: {templateType: tab === 'public' ? 'C' : 'M' }} );}}>템플릿 등록</Button>
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
          // {
          //   tab: '회사 템플릿',
          //   key: 'group',
          // },
          {
            tab: '신청서',
            key: 'public',
          },
        ]}
        onTabChange={(key)=>{setTab(key)}}
        content={description}
        footer={[
        ]}
    >
      <br></br>

      <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 1280);
        }}
      >
        {listStyle === 'cardStyle' ? viewCard : viewTable}

      </RcResizeObserver>

    </PageContainer>
    </div>
    
  );
};

export default TemplateList;
