import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { Table, Input, Space, Button, Modal, message, Dropdown, Menu, Switch } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, FileAddOutlined, ProfileOutlined, MoreOutlined, QrcodeOutlined, EyeOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import moment from "moment";
import 'moment/locale/ko';
import { FileOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { resetAssignAll, setSendType } from '../Assign/AssignSlice';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";
import LinkInfoModal from './LinkInfoModal';
import { LINK_BASE_URL } from '../../config/Config';

const { confirm } = Modal;

const LinkList = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;

  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);

  const { formatMessage } = useIntl();
  const searchInput = useRef(null);

  const fetch = (params = {}) => {
    setLoading(true);
  
    axiosInterceptor.post('/api/link/list', params)
      .then(response => {
        if (response.data.success) {
          const links = response.data.links;
          setPagination({ ...params.pagination, total: response.data.total });
          setData(links);
        } else {
          console.error("링크서명 목록 조회 실패:", response.data.error);
        }
      })
      .catch(error => {
        console.error("링크서명 목록 조회 중 오류:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      user: _id
    });
  };

  // 링크서명 삭제 함수
  const deleteLinkSignature = (linkId, linkTitle) => {
    confirm({
      title: '링크서명 삭제',
      icon: <ExclamationCircleOutlined />,
      content: `"${linkTitle}" 링크서명을 삭제하시겠습니까?`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk() {
        axiosInterceptor.post('/api/link/deleteLink', { 
          linkId: linkId 
        }).then(response => {
          if (response.data.success) {
            message.success('링크서명이 삭제되었습니다.');
            fetch({
              user: _id,
              pagination,
            });
          } else {
            if (response.data.hasSigners) {
              message.error('서명자가 있는 링크서명은 삭제할 수 없습니다.');
            } else {
              message.error(response.data.message || '링크서명 삭제에 실패했습니다.');
            }
          }
        }).catch(error => {
          message.error('링크서명 삭제 중 오류가 발생했습니다.');
        });
      }
    });
  };

  // 링크 정보 보기 함수 (단순화)
  const showLinkInfo = (link) => {
    setSelectedLink(link);
    setShowInfoModal(true);
  };

  // 상태 변경 함수 (활성화/비활성화)
  const handleStatusChange = (record, checked) => {
    const statusText = checked ? '활성화' : '비활성화';

    confirm({
      title: `링크서명 ${statusText}`,
      content: (
        <span>
          {checked ? '링크서명을 활성화하시겠습니까?' : '링크서명을 비활성화하시겠습니까?'}
          <br />
          {checked ? '서명자들이 다시 서명할 수 있게 됩니다.' : '링크 접속이 차단되며 서명이 불가능해집니다.'}
        </span>
      ),
      okText: statusText,
      cancelText: '취소',
      onOk() {
        axiosInterceptor.post('/api/link/updateStatus', {
          linkId: record._id,
          isActive: checked
        }).then(response => {
          if (response.data.success) {
            message.success(`링크서명이 ${statusText}되었습니다.`);
            fetch({
              user: _id,
              pagination,
            });
          } else {
            message.error(response.data.error || '상태 변경에 실패했습니다.');
          }
        }).catch(error => {
          console.error('상태 변경 오류:', error);
          message.error('상태 변경 중 오류가 발생했습니다.');
        });
      }
    });
  };

  // 드롭다운 메뉴 생성 (단순화)
  const getDropdownMenu = (record) => {
    const items = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '문서 보기',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation?.();
          message.info('문서 보기 기능은 준비 중입니다.');
        }
      },
      {
        key: 'linkInfo',
        icon: <QrcodeOutlined />,
        label: '링크 정보 보기',
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation?.();
          showLinkInfo(record);
        }
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '삭제',
        danger: true,
        onClick: ({ domEvent }) => {
          domEvent?.stopPropagation?.();
          deleteLinkSignature(record._id, record.linkTitle);
        }
      }
    ];
  
    return <Menu items={items} />;
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
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        // setTimeout(() => searchInput.select(), 100);
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
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
  }

  const filterSigned = (docs) => {
    return docs.filter((el) =>
      el.signed == true
    );
  }

  const filterCompleted = (docs) => {
    return docs.filter((el) =>
    el.signed == true || el.canceled == true
  );
  }
  
const columns = [
  {
    title: '링크 제목',
    dataIndex: 'linkTitle',
    sorter: true,
    key: 'linkTitle',
    ...getColumnSearchProps('linkTitle'),
    expandable: true,
    render: (text,row) => <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</div>,
  },
  {
    title: <div style={{ textAlign: 'center' }}>링크 서명자</div>,
    dataIndex: 'externalEmails',
    key: 'externalEmails', 
    responsive: ["xs"],
    width: '80px',
    align: 'center',
    render: (externalEmails, row) => <div style={{ textAlign: 'center' }}>{(externalEmails || []).length} 명</div>
  },
  {
    title: <div style={{ textAlign: 'center' }}>링크 서명자</div>,
    dataIndex: 'externalEmails',
    key: 'externalEmails',
    responsive: ["sm"], 
    width: '100px',
    align: 'center',
    render: (externalEmails, row) => <div style={{ textAlign: 'center' }}>{(externalEmails || []).length} 명</div>
  },
  {
    title: <div style={{ textAlign: 'center' }}>링크 상태</div>,
    dataIndex: 'isActive',
    key: 'status',
    responsive: ["xs"],
    width: '120px',
    align: 'center',
    render: (isActive, row) => {
      const isExpired = new Date() > new Date(row.expiryDate);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <Switch 
              size="default" 
              checked={isActive && !isExpired}
              disabled={isExpired}
              onChange={(checked) => handleStatusChange(row, checked)}
              title={isExpired ? "유효기간이 만료된 링크는 다시 활성화 할수 없습니다." : (isActive ? "클릭하면 링크 접속이 차단됩니다" : "클릭하면 링크 접속이 활성화됩니다")}
            />
            <span style={{
              color: isExpired ? '#d32f2f' : (isActive ? '#1890ff' : '#000000'),
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {isExpired ? '만료됨' : (isActive ? '진행중' : '중지됨')}
            </span>
          </div>
        </div>
      );
    }
  },
  {
    title: <div style={{ textAlign: 'center' }}>링크 상태</div>,
    dataIndex: 'isActive',
    key: 'status',
    responsive: ["sm"],
    width: '140px',
    align: 'center',
    render: (isActive, row) => {
      const isExpired = new Date() > new Date(row.expiryDate);

      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <Switch 
            size="default" 
            checked={isActive && !isExpired}
            disabled={isExpired}
            onChange={(checked) => handleStatusChange(row, checked)}
            title={isExpired ? "유효기간이 만료된 링크는 다시 활성화 할수 없습니다." : (isActive ? "클릭하면 링크 접속이 차단됩니다" : "클릭하면 링크 접속이 활성화됩니다")}
          />
          <span style={{
            color: isExpired ? '#d32f2f' : (isActive ? '#1890ff' : '#595959'),
            fontWeight: '500'
          }}>
            {isExpired ? '만료됨' : (isActive ? '진행중' : '중지됨')}
          </span>
        </div>
      );
    }
  },
  {
    title: <div style={{ textAlign: 'center' }}>생성자</div>,
    dataIndex: ['user', 'name'],
    sorter: (a, b) => a.user?.name?.localeCompare(b.user?.name || '') || 0,
    key: 'user',
    responsive: ["xs"],
    width: '60px',
    align: 'center',
    ...getColumnSearchProps('name'),
    render: (text, row) => {
      return (
        <div style={{ textAlign: 'center' }}>
          {row?.user?.name || ''} {row?.user?.JOB_TITLE || ''}
        </div>
      )
    } 
  },
  {
    title: <div style={{ textAlign: 'center' }}>생성자</div>,
    dataIndex: ['user', 'name'],
    sorter: (a, b) => a.user?.name?.localeCompare(b.user?.name || '') || 0,
    key: 'user',
    responsive: ["sm"],
    width: '120px',
    align: 'center',
    ...getColumnSearchProps('name'),
    render: (text, row) => {
      return (
        <div style={{ textAlign: 'center' }}>
          {row?.user?.name || ''} {row?.user?.JOB_TITLE || ''}
        </div>
      )
    } 
  },
  {
    title: <div style={{ textAlign: 'center' }}>요청 일시</div>,
    dataIndex: 'requestedTime',
    sorter: true,
    key: 'requestedTime',
    responsive: ["xs"],
    width: '80px',
    align: 'center',
    render: (text, row) => {
      return (<div style={{ textAlign: 'center' }}><font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font></div>)
    } 
  },
  {
    title: <div style={{ textAlign: 'center' }}>요청 일시</div>,
    dataIndex: 'requestedTime',
    sorter: true,
    key: 'requestedTime',
    responsive: ["sm"],
    width: '130px',
    align: 'center',
    render: (text, row) => {
      return (<div style={{ textAlign: 'center' }}><font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font></div>)
    } 
  },
  {
    title: <div style={{ textAlign: 'center' }}>추가 메뉴</div>,
    key: 'action',
    responsive: ["sm"],
    width: '100px',
    align: 'center',
    render: (_, row) => {
      return (
        <div style={{ textAlign: 'center' }}>
          <Dropdown 
            overlay={getDropdownMenu(row)} 
            trigger={['click']}
            placement="bottomRight"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              icon={<MoreOutlined style={{ transform: 'rotate(90deg)' }} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      )
    }
  },
  {
    title: <div style={{ textAlign: 'center' }}>추가 메뉴</div>,
    key: 'action',
    responsive: ["xs"],
    width: '70px',
    align: 'center',
    render: (_, row) => {
      return (
        <div style={{ textAlign: 'center' }}>
          <Dropdown 
            overlay={getDropdownMenu(row)} 
            trigger={['click']}
            placement="bottomRight"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              icon={<MoreOutlined style={{ transform: 'rotate(90deg)' }} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      )
    }
  }
];

  const rowSelection = {
    selectedRowKeys,
    onChange : selectedRowKeys => {
      console.log('selectedRowKeys changed: ', selectedRowKeys);
      setSelectedRowKeys(selectedRowKeys)
      setHasSelected(selectedRowKeys.length > 0)
    },
  };

  useEffect(() => {

    fetch({
      user: _id,
      pagination,
    });

  }, [_id]);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'document.link'}),
          ghost: false,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [           
          <Button type="primary" icon={<FileAddOutlined />} onClick={() => {
            dispatch(resetAssignAll());
            dispatch(setSendType('L'));
            navigate('/uploadLinkDocument');
            }}>
            링크 서명 생성
          </Button>
          ],
        }}
        content={<div
          dangerouslySetInnerHTML={{
            __html: '<b><font color="blue">URL을 통해 외부 사용자에게 직접 서명을 요청</font></b>해야 할 경우 (예: 외부직원 보안서약서, 개인정보 수집동의서 등)'
          }} 
        />}
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
        onRow={record => ({
          onClick: e => {
            if (!e.target.closest('.ant-dropdown') && !e.target.closest('button') && !e.target.closest('.ant-switch')) {
              navigate(`/linkDetail`, { state: { link: record } });
            }
          },
          style: { cursor: 'pointer' }
        })}
        onChange={handleTableChange}
      />

      {/* 링크 정보 모달 - 중앙 위치로 단순화 */}
      {selectedLink && (
        <LinkInfoModal
          visible={showInfoModal}
          destroyOnClose={true}
          onClose={() => {
            setShowInfoModal(false);
            setSelectedLink(null);
          }}
          linkUrl={`${LINK_BASE_URL}/sign/link/${selectedLink._id}`}
          accessPassword={selectedLink.accessPassword}
          expiryDays={selectedLink.expiryDays}
          expiryDate={selectedLink.expiryDate}
          title="링크서명 정보"
        />
      )}

    </PageContainer>
    </div>
    
  );
};

export default LinkList;