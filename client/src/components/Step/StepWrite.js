import React, { useState, useEffect } from 'react';
import { navigate } from '@reach/router';
import { Steps } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { selectDocumentTitle, selectSendType } from '../Assign/AssignSlice';
import styled from 'styled-components';

const StepStyle = styled.div`
    .ant-steps-item-title {
        // font-size: 16px;
        font-weight: bold;
        // color: #666666;
    }
    width:100%; 
`;

const StepWrite = (props) => {

    const dispatch = useDispatch();
    const docuTitle = useSelector(selectDocumentTitle);
    const sendType = useSelector(selectSendType);

    const { Step } = Steps
    const { current, documentFile, attachFiles } = props

    const [curr, setCurr] = useState(0);
    

    const onChange = current => {
        console.log('onChange:', current);
        if (current == 0) {
            navigate(`/uploadDocument`, { state: {attachFiles: attachFiles, documentFile: documentFile} });
        } else if (current == 1) {
            if (docuTitle != null) {
                navigate(`/assign`, { state: {attachFiles: attachFiles, documentFile: documentFile} });
            }
        }
    };

    useEffect(() => {
        setCurr(current)
    }, [current]);

    return (
        <StepStyle>
        <Steps size="default" current={curr} onChange={onChange}>
            <Step title="문서 등록" description="문서 업로드 또는 템플릿 선택" />
            <Step title="참여자 설정" description={sendType == 'B' ? "서명(수신) 참여자 선택" : "서명(수신) 참여자 선택 (최대 20명)" } />
            <Step title="입력 설정" description="참여자 입력 항목 지정" />
        </Steps>
        </StepStyle>
    );

};

export default StepWrite;