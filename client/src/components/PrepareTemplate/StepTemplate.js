import React, { useState, useEffect } from 'react';
import { navigate } from '@reach/router';
import { Steps } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { resetAssignAll } from '../PrepareTemplate/AssignTemplateSlice';
import styled from 'styled-components';

const StepStyle = styled.div`
    .ant-steps-item-title {
        // font-size: 16px;
        font-weight: bold;
        // color: #666666;
    }
    width:100%; 
`;

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
        <StepStyle>
            <Steps size="small" current={curr} onChange={onChange}>
                <Step title="템플릿 등록" description="문서 업로드" />
                <Step title="참여자 설정" description="서명(수신) 참여자 선택 (최대 20명)" />
                <Step title="입력 설정" description="참여자 입력 항목 지정" />
            </Steps>
        </StepStyle>
    );

};

export default StepTemplate;