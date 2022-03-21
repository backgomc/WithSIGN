import React, { useState, useEffect } from 'react';
import { navigate } from '@reach/router';
import { Steps } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { resetAssignAll } from '../PrepareTemplate/AssignTemplateSlice';

const StepTemplate = (props) => {

    const dispatch = useDispatch();
    const { Step } = Steps;
    const { current } = props;
    const [curr, setCurr] = useState(0);
    
    const onChange = current => {
        if (current == 0) {
            dispatch(resetAssignAll());
            navigate('/templateList');
        } else if (current == 1) {
            navigate('/assignTemplate');
        }
    };

    useEffect(() => {
        setCurr(current);
    }, [current]);

    return (
        <Steps size="small" current={curr} onChange={onChange}>
            <Step title="템플릿 등록" description="문서 업로드" />
            <Step title="참여자 설정" description="서명(수신) 참여자 선택 (최대 10명)" />
            <Step title="입력 설정" description="참여자 입력 항목 지정" />
        </Steps>
    );

};

export default StepTemplate;