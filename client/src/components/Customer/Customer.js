import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BoardCard from '../Board/BoardCard';
import FAQCard from '../Board/FAQCard';
import OpinionCard from '../Board/OpinionCard';
import DirectCard from './DirectCard';
import { Modal, Input, Row, Col, Space } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, DeleteOutlined, FileOutlined, DownloadOutlined, EditOutlined, FormOutlined, FilePdfOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate, Link } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";
import iconCheck from '../../assets/images/icon_check.png';
import iconManual from '../../assets/images/icon_manual.png';

const IconLink = ({ src, text }) => (
  <a style={{marginRight:'16px', lineHeight:'24px'}}>
    <img style={{marginRight:'8px', width:'30px', height:'30px'}} src={src} alt={text} />
    <font color='#373737'>{text}</font>
  </a>
);

const Customer = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;

  const [tab, setTab] = useState('notice'); // notice, qna, faq, manual
  const [loading, setLoading] = useState(false);

  const { formatMessage } = useIntl();


  const description = (
    <>
    <Space size='middle'>
    <Link to='/manual'>
    <IconLink
      src={iconManual}
      text="서비스 소개"
    />
    </Link>
    <Link to='/auditCheck'>
    <IconLink
      src={iconCheck}
      text={formatMessage({id: 'document.check'})}
    />
    </Link>
    </Space>
    </>
  )

  useEffect(() => {
  }, []);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'Customer'}),
          ghost: false,
          breadcrumb: {
            routes: [
            ],
          },
          // extra: [  
          // ],
        }}
        content={description}
        footer={[
        ]}
    >
      <br></br>
      
      <Row gutter={24}>
        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
          <BoardCard boardType={'notice'} boardName={'공지사항'}></BoardCard>
          <br></br>
          <FAQCard boardType={'faq'} boardName={'FAQ'}></FAQCard>
          <br></br>
        </Col>
        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
          <OpinionCard boardType={'opinion'} boardName={'문의하기'}></OpinionCard>
          <br></br>
          {/* <DirectCard></DirectCard> */}
        </Col>
      </Row>

    </PageContainer>
    </div>
    
  );
};

export default Customer;
