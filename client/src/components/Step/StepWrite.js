import React, { useState, useEffect } from 'react';
import { navigate } from '@reach/router';
import { Steps } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { selectDocumentTitle } from '../Assign/AssignSlice';


const StepWrite = (props) => {

    const dispatch = useDispatch();
    const docuTitle = useSelector(selectDocumentTitle);

    const { Step } = Steps
    const { current } = props

    const [curr, setCurr] = useState(0);
    

    const onChange = current => {
        console.log('onChange:', current);
        if (current == 0) {
            navigate(`/uploadDocument`);
        } else if (current == 1) {
            if (docuTitle != null) {
                navigate(`/assign`);
            }
        }
    };

    useEffect(() => {
        setCurr(current)
    }, [current]);

    return (
        <Steps size="small" current={curr} onChange={onChange}>
            <Step title="문서 등록" description="문서 업로드 또는 템플릿을 선택해주세요." />
            <Step title="서명참여자 설정" description="서명에 참여할 사람을 이동해주세요. (최대 5명)" />
            <Step title="입력 설정" description="서명참여자 선택 후 입력 항목을 지정해주세요." />
        </Steps>
    );

};

export default StepWrite;