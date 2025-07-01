import React, { useEffect, useState, useRef } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { Table, Space, Button, Descriptions, Tooltip, Modal, message } from "antd";
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import moment from "moment";
import 'moment/locale/ko';
import {
  FileOutlined,
  ArrowLeftOutlined,
  BellFilled,
  FileExcelOutlined,
  LinkOutlined,
  QrcodeOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";
import LinkInfoModal from './LinkInfoModal';
import { LINK_BASE_URL } from '../../config/Config';

const { confirm } = Modal;

const LinkDetail = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const link = location.state.link; // LinkList에서 전달받은 링크서명 데이터
  const { _id } = user;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [showInfoModal, setShowInfoModal] = useState(false);

  const { formatMessage } = useIntl();

  // 서명 상태별 필터링 함수들
  const filterSigned = () => {
    return (link.docs || []).filter((el) => el.signed === true);
  }

  const filterCanceled = () => {
    return (link.docs || []).filter((el) => el.canceled === true);
  }

  const filterProcessing = () => {
    return (link.docs || []).filter((el) => !el.signed && !el.canceled);
  }

  // 링크 복사 기능
  const copyLinkToClipboard = (linkUrl) => {
    navigator.clipboard.writeText(linkUrl).then(() => {
      message.success('링크가 클립보드에 복사되었습니다!');
    });
  };

  // 링크 정보 보기 함수
  const showLinkInfo = () => {
    setShowInfoModal(true);
  };

  // 알림 발송 기능
  const sendNotification = () => {
    confirm({
      title: '서명 요청 알림',
      icon: <BellFilled />,
      content: '미서명자에게 링크서명 요청 알림을 보내시겠습니까?',
      okType: 'confirm',
      okText: '네',
      cancelText: '아니오',
      onOk() {
        setLoading(true);
        axiosInterceptor.post('/api/link/notify', { 
          linkId: link._id 
        }).then(response => {
          if (response.data.success) {
            message.success('알림이 발송되었습니다.');
          } else {
            message.error('알림 발송에 실패했습니다.');
          }
          setLoading(false);
        });
      }
    });
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '외부 이메일',
      dataIndex: 'externalEmail',
      key: 'externalEmail',
      render: (text) => <span>{text || '미등록'}</span>
    },
    {
      title: '서명 상태',
      dataIndex: 'signed',
      key: 'signed',
      render: (signed, record) => {
        if (record.canceled) {
          return <span style={{color: 'red'}}>취소됨</span>;
        } else if (signed) {
          return <span style={{color: 'green'}}>완료</span>;
        } else {
          return <span style={{color: 'orange'}}>대기중</span>;
        }
      }
    },
    {
      title: '요청 일시',
      dataIndex: 'requestedTime',
      key: 'requestedTime',
      render: (text) => moment(text).format('YYYY/MM/DD HH:mm')
    },
    {
      title: '완료 일시',
      dataIndex: 'signedTime',
      key: 'signedTime',
      render: (text) => text ? moment(text).format('YYYY/MM/DD HH:mm') : '-'
    },
    {
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="링크 복사">
            <Button 
              icon={<LinkOutlined />} 
              size="small"
              onClick={() => copyLinkToClipboard(`${window.location.origin}/sign-link/${record._id}`)}
            />
          </Tooltip>
          {!record.signed && !record.canceled && (
            <Tooltip title="문서 보기">
              <Button 
                icon={<FileOutlined />} 
                size="small"
                onClick={() => {
                  // 문서 보기 로직
                  navigate('/viewDocument', { state: { link: link, doc: record }});
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  useEffect(() => {
    setData(link.docs || []);
  }, []);

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: link.linkTitle || link.docTitle,
          ghost: false,
          extra: [
            <Space key="buttons">
              <Button 
                key="linkInfo"
                icon={<QrcodeOutlined />}
                onClick={showLinkInfo}
              >
                링크 정보 보기
              </Button>
              <Button 
                key="list"
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/linkList')}
              >
                목록
              </Button>
              {filterProcessing().length > 0 && (
                <Button 
                  key="notify"
                  icon={<BellFilled />} 
                  onClick={sendNotification}
                  loading={loading}
                >
                  알림 발송
                </Button>
              )}
              <Button 
                key="excel"
                icon={<FileExcelOutlined />} 
                onClick={() => {
                  // 엑셀 다운로드 로직
                  message.info('엑셀 다운로드 기능은 준비 중입니다.');
                }}
              >
                엑셀 다운로드
              </Button>
            </Space>
          ],
        }}
        content={
          <Descriptions column={2} style={{ marginBottom: -16 }}>
            <Descriptions.Item label="전체 건수">
              {(link.docs || []).length} 건
            </Descriptions.Item>
            <Descriptions.Item label="완료 건수">
              {filterSigned().length} 건
            </Descriptions.Item>
            <Descriptions.Item label="대기 건수">
              {filterProcessing().length} 건
            </Descriptions.Item>
            <Descriptions.Item label="취소 건수">
              {filterCanceled().length} 건
            </Descriptions.Item>
            <Descriptions.Item label="요청 일시">
              {moment(link.requestedTime).format('YYYY/MM/DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="요청자">
              {link.user.name} {link.user.JOB_TITLE}
            </Descriptions.Item>
          </Descriptions>
        }
      >
        <br />
        
        <Table
          rowKey={item => item._id}
          columns={columns}
          dataSource={data}
          pagination={pagination}
          loading={loading}
        />

        {/* 링크 정보 모달 */}
        <LinkInfoModal
          visible={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          linkUrl={`${LINK_BASE_URL}/sign/link/${link._id}`}
          accessPassword={link.accessPassword}
          expiryDays={link.expiryDays}
          expiryDate={link.expiryDate}
          title="링크서명 정보"
        />

      </PageContainer>
    </div>
  );
};

export default LinkDetail;