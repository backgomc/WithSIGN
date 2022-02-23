import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { StatisticCard } from '@ant-design/pro-card';
import iconWater from '../../assets/images/icon_water.png';
import iconCarbon from '../../assets/images/icon_carbon.png';
import iconBuilding from '../../assets/images/icon_building.png';
import RcResizeObserver from 'rc-resize-observer'
import styled from 'styled-components';

// import 'antd/dist/antd.css';
// import '@ant-design/pro-card/dist/card.css';
// import 'moment/locale/ko';

const MyStyle = styled.div`
  .ant-statistic-content {
    // 위 | 오른쪽 | 아래 | 왼쪽
    margin: -10px 0px 0px 0px; 
  }
  .ant-statistic-content-value {
    font-size: 18px;
    font-weight: bold;
`;

const ESGCard = () => {

  const user = useSelector(selectUser);
  const { _id } = user;
  const [totalPaperlessNum, setTotalPaperlessNum] = useState(0);
  const [responsive, setResponsive] = useState(false);

  const fetchPaperless = async () => {
    let param = {
      user: _id
    }
    const res = await axios.post('/api/users/paperless', param);
    if (res.data.success) {
      setTotalPaperlessNum(res.data.totalPaperless);
    }
  }

  useEffect(() => {
    fetchPaperless();
  }, []);

  return (
    <MyStyle style={{marginBottom: 24}}>
      <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 596);
        }}
      >
        <StatisticCard.Group direction={responsive ? 'column' : 'row'} title="ESG 경영">
          <StatisticCard
            statistic={{
              title: '물 사용량',
              value: (totalPaperlessNum * 10).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + ' ℓ 절약',
              tip: 'A4 1장 생산시 물 10 ℓ 필요'
            }}
            chart={
              <img
                src={iconWater}
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
              title: '탄소 배출량',
              value: (Math.floor(totalPaperlessNum * 2.88 * 1000)/1000).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') + ' g 감소',
              tip: 'A4 1장 생산시 탄소 2.88 g 배출'
            }}
            chart={
              <img
                src={iconCarbon}
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
              title: '종이 절약',
              value: Math.floor(totalPaperlessNum * 0.14 / 1000 * 1000)/1000 + ' m 높이',
              tip: 'A4 1장 두께 0.14㎜'
            }}
            chart={
              <img
                src={iconBuilding}
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

export default ESGCard;
