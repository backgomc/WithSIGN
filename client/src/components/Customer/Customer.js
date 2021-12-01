import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import BoardCard from '../Board/BoardCard';
import FAQCard from '../Board/FAQCard';
import OpinionCard from '../Board/OpinionCard';
import DirectCard from './DirectCard';
import { Modal, Table, Input, Space, Button, Popconfirm, Tag, Progress, List, Row, Col, Card } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, DeleteOutlined, FileOutlined, DownloadOutlined, EditOutlined, FormOutlined, FilePdfOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';

import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";

import ProList from '@ant-design/pro-list';
import { ProFormRadio } from '@ant-design/pro-form';

import ProCard from '@ant-design/pro-card';
import { CheckCard } from '@ant-design/pro-card';
import '@ant-design/pro-list/dist/list.css';
import '@ant-design/pro-card/dist/card.css';
import '@ant-design/pro-form/dist/form.css';
import BoardList from '../Board/BoardList';

const { Search } = Input;
const { confirm } = Modal;
const { Meta } = Card;

const Customer = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;

  const [tab, setTab] = useState('notice'); // notice, qna, faq, manual
  const [loading, setLoading] = useState(false);

  const { formatMessage } = useIntl();

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
        // content={description}
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
          <DirectCard></DirectCard>
        </Col>
      </Row>

    </PageContainer>
    </div>
    
  );
};

export default Customer;
