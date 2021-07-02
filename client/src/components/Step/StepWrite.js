import React from 'react';
import { Steps } from 'antd';


const StepWrite = (props) => {

    const { Step } = Steps
    const { current } = props

    return (
        <Steps current={current}>
            <Step title="문서 등록" description="문서 업로드 또는 템플릿 선택" />
            <Step title="서명참여자 설정" description="" />
            <Step title="입력 설정" description="" />
        </Steps>
    );

};

export default StepWrite;