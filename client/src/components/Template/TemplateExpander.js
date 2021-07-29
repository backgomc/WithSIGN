import React, {useState} from 'react';
import { Descriptions, Tag, Timeline, Badge, Button } from 'antd';
import Moment from 'react-moment';
import { useSelector } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import {
    FileOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    MinusCircleOutlined,
  } from '@ant-design/icons';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';

const TemplateExpander = (props) => {

    const [responsive, setResponsive] = useState(false);
    const { item } = props
    const user = useSelector(selectUser);
    const { _id } = user;

    const signTemplate = () => {
        console.log(item._id);
        navigate('/assign');
    }
    return (
    <div>
      {/* <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
            setResponsive(offset.width < 596);
      }}>
        <ProCard
            title={item.docTitle}
            extra=""
            bordered
            headerBordered
            split={responsive ? 'horizontal' : 'vertical'}
        >
        </ProCard>
      </RcResizeObserver> */}
        <Button onClick={() => {signTemplate();}}>
            서명 요청
        </Button>
      </div>
    );

};

export default TemplateExpander;