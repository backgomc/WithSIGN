import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { navigate, Link } from '@reach/router';
import { Row, Col, Empty, Button } from 'antd';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import "moment/locale/ko";
import { useIntl } from "react-intl";

import iconCheck from '../../assets/images/icon_check.png';
import iconManual from '../../assets/images/icon_manual.png';

const DirectCard = (props) => {

    const { formatMessage } = useIntl();

    useEffect(() => {
    }, []);

    const IconLink = ({ src, text }) => (
        <a style={{marginRight:'16px', lineHeight:'24px'}}>
          <img style={{marginRight:'8px', width:'42px', height:'42px'}} src={src} alt={text} />
          <font color='#373737'>{text}</font>
        </a>
      );
    const IconLink2 = ({ src, text }) => (
      <a style={{marginLeft:'7px', marginRight:'16px', lineHeight:'24px'}}>
        <img style={{marginRight:'8px', width:'42px', height:'42px'}} src={src} alt={text} />
        <font color='#373737'>{text}</font>
      </a>
    );

    return (
    <ProCard title="바로 가기">
        <Row>
          <Col span={13}>
            <Link to='/auditCheck'>
            <IconLink
              src={iconCheck}
              text={formatMessage({id: 'document.check'})}
            />
            </Link>
          </Col>
          <Col span={11}>
            <Link to='/manual'>
              <IconLink2
                src={iconManual}
                text="서비스 소개"
              />
            </Link>
          </Col>
        </Row>
      </ProCard>
    );

};

export default DirectCard;