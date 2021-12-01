import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { selectUser } from '../../app/infoSlice';
import { StatisticCard } from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import "moment/locale/ko";
import iconPaperless from '../../assets/images/icon_save1.png';
import iconDocument from '../../assets/images/icon_save2.png';

const PaperlessCard = (props) => {

  const user = useSelector(selectUser);
  const { _id } = user;

  const [loadingPaperless, setLoadingPaperless] = useState(false);
  const [paperlessNum, setPaperlessNum] = useState(0);
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
    }
    setLoadingPaperless(false);
  }

  useEffect(() => {
    fetchPaperless();
  }, []);


  return (
    <StatisticCard.Group loading={loadingPaperless} title='절약 건수' tooltip='본인이 서명 요청하여 완료된 건수를 기준으로 산정'>
      <StatisticCard
        statistic={{
          title: '페이퍼리스',
          value: paperlessNum,
          icon: (
            <img
              style={{display: 'block', width: 42, height: 42}}
              src={iconPaperless}
              alt="icon"
            />
          ),
        }}
      />
      <StatisticCard
        statistic={{
          title: '문서',
          // tip: '본인이 서명 요청하여 완료된 건수를 기준으로 산정',
          value: docNum,
          icon: (
            <img
              style={{display: 'block', width: 42, height: 42}}
              src={iconDocument}
              alt="icon"
            />
          ),
        }}
      />
    </StatisticCard.Group>
  );

};

export default PaperlessCard;