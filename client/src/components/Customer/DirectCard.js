import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { selectPathname, setPathname } from '../../config/MenuSlice';
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

    const dispatch = useDispatch();
    const { formatMessage } = useIntl();

    useEffect(() => {
      return () => {} // cleanup
    }, []);

    const IconLink = ({ src, text, url }) => (
        <a style={{lineHeight:'24px'}} onClick={() => {dispatch(setPathname(url));navigate(url);}}>
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
      <div>
          <Row gutter={48}>
              <Col span={12} style={{paddingRight: 0}}>
                {/* <Link to="/auditCheck" > */}
                  <IconLink src={iconCheck} text={formatMessage({id: 'document.check'})} url="/auditCheck"/>
                {/* </Link> */}
              </Col>
            
              <Col span={12} style={{paddingRight: 0}}>
                {/* <Link to="/manual"> */}
                  <IconLink src={iconManual} text="서비스 소개" url="/manual"/>
                {/* </Link> */}
              </Col>
          </Row>
        </div>
    </ProCard>
    );

};

export default DirectCard;