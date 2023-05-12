import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { selectUser } from '../../app/infoSlice';
import { StatisticCard } from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import "moment/locale/ko";
import RcResizeObserver from 'rc-resize-observer'
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
  }
`;

const PaperlessCard = ({paperlessNum, totalPaperlessNum, loadingPaperless}) => {

  const user = useSelector(selectUser);
  const { _id } = user;

  // const [loadingPaperless, setLoadingPaperless] = useState(false);
  // const [paperlessNum, setPaperlessNum] = useState(0);
  // const [totalPaperlessNum, setTotalPaperlessNum] = useState(0);
  // const [docNum, setDocNum] = useState(0);
  const [responsive, setResponsive] = useState(false);

  // const fetchPaperless = async () => {
  //   setLoadingPaperless(true);
  //   let param = {
  //     user: _id
  //   }
  //   const res = await axiosInterceptor.post('/api/users/paperless', param)
  //   if (res.data.success) {
  //     setPaperlessNum(res.data.paperless)
  //     setDocNum(res.data.docCount)
  //     setTotalPaperlessNum(res.data.totalPaperless)
  //   }
  //   setLoadingPaperless(false);
  // }

  useEffect(() => {
    // fetchPaperless();
    return () => {} // cleanup
  }, []);


  return (
    <MyStyle style={{marginBottom: 24}}>
      <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 596);
        }}
      >
        <StatisticCard.Group loading={loadingPaperless} direction={responsive ? 'column' : 'row'} title='페이퍼리스' tooltip='본인이 요청한 문서를 기준으로 산정'>
          <StatisticCard
            statistic={{
              title: '본인',
              value: paperlessNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' 장',
            }}
            chart={
              <img
                src={iconPaperless}
                alt="icon"
                width="50"
                style={{margin: '0 5px'}}
              />
            }
            chartPlacement="left"
            bodyStyle={{padding: '12px 24px'}}
          />
          <StatisticCard
            statistic={{
              title: '회사',
              // tip: '본인이 서명 요청하여 완료된 건수를 기준으로 산정',
              value: totalPaperlessNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' 장',
            }}
            chart={
              <img
                src={iconDocument}
                alt="icon"
                width="50"
                style={{margin: '0 5px'}}
              />
            }
            chartPlacement="left"
            bodyStyle={{padding: '12px 24px'}}
          />
        </StatisticCard.Group>
      </RcResizeObserver>
    </MyStyle>
  );

};

export default PaperlessCard;