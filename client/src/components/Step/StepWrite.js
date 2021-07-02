import React from 'react';
import { Steps } from 'antd';


const StepWrite = (props) => {

    const { Step } = Steps
    const { current } = props

    return (
        <Steps current={current}>
            <Step title="서명참여자 선택" description="문서에 서명할 참여자를 선택해주세요." />
            <Step title="서명란 지정" description="참여자별로 서명란을 지정해주세요." />
            <Step title="서명요청 완료" description="서명요청이 완료되었습니다." />
        </Steps>
    );

};

export default StepWrite;