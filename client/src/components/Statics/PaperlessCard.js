import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { selectUser } from '../../app/infoSlice';
import { StatisticCard } from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import "moment/locale/ko";
import iconPaperless from '../../assets/images/icon_save3.png';
import iconDocument from '../../assets/images/icon_save4.png';
import styled from 'styled-components';
const MyStyle = styled.div`
 .ant-statistic-content {
    //  위 | 오른쪽 | 아래 | 왼쪽
    margin: -10px 0px 0px 0px; 
 }
  .ant-statistic-content-value {
    font-size: 18px;
    font-weight: bold;

    // padding: -10px 0px 0px 0px; 
`;

const PaperlessCard = (props) => {

  const user = useSelector(selectUser);
  const { _id } = user;

  const [loadingPaperless, setLoadingPaperless] = useState(false);
  const [paperlessNum, setPaperlessNum] = useState(0);
  const [totalPaperlessNum, setTotalPaperlessNum] = useState(0);
  const [docNum, setDocNum] = useState(0);

  const fetchPaperless = async () => {
    setLoadingPaperless(true);
    let param = {
      user: _id
    }
    const res = await axios.post('/api/users/paperless', param)
    if (res.data.success) {
      setPaperlessNum(res.data.paperless)
      setDocNum(res.data.docCount)
      setTotalPaperlessNum(res.data.totalPaperless)
    }
    setLoadingPaperless(false);
  }

  useEffect(() => {
    fetchPaperless();
  }, []);


  return (
    <MyStyle style={{marginBottom: 24}}>
    <StatisticCard.Group loading={loadingPaperless} title='페이퍼리스' tooltip='본인이 요청한 문서를 기준으로 산정'>
      <StatisticCard
        statistic={{
          title: '본인',
          value: paperlessNum + ' 장',
          icon: (
            <img
              style={{display: 'block', width: 42, height: 42}}
              src={iconPaperless}
              alt="icon"
            />
          ),
        }}
        bodyStyle={{paddingRight: 0}}
      />
      <StatisticCard
        statistic={{
          title: '회사',
          // tip: '본인이 서명 요청하여 완료된 건수를 기준으로 산정',
          value: totalPaperlessNum + ' 장',
          icon: (
            <img
              style={{display: 'block', width: 42, height: 42}}
              src={iconDocument}
              alt="icon"
            />
          ),
        }}
        bodyStyle={{paddingRight: 0}}
      />
    </StatisticCard.Group>
    </MyStyle>
  );

};

export default PaperlessCard;