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

const StepLinkWrite = (props) => {

    const dispatch = useDispatch();
    const docuTitle = useSelector(selectDocumentTitle);
    const sendType = useSelector(selectSendType);

    const { Step } = Steps
    const { current, documentFile, attachFiles, location, pdfRef, pageCount, boxData, savedPdfItems, savedPageCount, savedThumbnail, savedBoxData } = props

    const [curr, setCurr] = useState(0);
    
    const onChange = async (current) => {
        if (current == 0) {
            // 2단계에서 1단계로 네비게이션 클릭 시 현재 PDF 상태 저장
            let currentItems = [];
            let currentThumbnail = null;
            
            if (pdfRef?.current) {
                try {
                    currentItems = await pdfRef.current.exportItems();
                    currentThumbnail = await pdfRef.current.getThumbnail(0, 0.6);
                } catch (error) {
                    currentItems = location?.state?.savedPdfItems || [];
                }
            } else {
                currentItems = location?.state?.savedPdfItems || [];
            }
    
            navigate(`/uploadLinkDocument`, { 
                state: {
                    attachFiles: attachFiles, 
                    documentFile: documentFile,
                    savedPdfItems: currentItems,
                    savedPageCount: pageCount,
                    savedThumbnail: currentThumbnail,
                    savedBoxData: boxData
                } 
            });
        } else if (current == 1) {
            if (docuTitle != null) {
                // 2단계: 입력 설정으로 이동 (저장된 데이터 포함)
                navigate(`/prepareLinkDocument`, { 
                    state: {
                        attachFiles: attachFiles, 
                        documentFile: documentFile,
                        // 저장된 PDF 데이터가 있으면 함께 전달
                        savedPdfItems: location?.state?.savedPdfItems,
                        savedPageCount: location?.state?.savedPageCount,
                        savedThumbnail: location?.state?.savedThumbnail,
                        savedBoxData: location?.state?.savedBoxData
                    } 
                });
            }
        }
        // current == 2는 처리하지 않음 (기존과 동일하게 "다음" 버튼으로만 이동)
    };

    useEffect(() => {
        setCurr(current)
    }, [current]);

    // 링크서명 전용 3단계 네비게이션
    return (
        <StepStyle>
        <Steps size="default" current={curr} onChange={onChange}>
            <Step title="문서 등록" description="문서 업로드 또는 템플릿 선택" />
            <Step title="입력 설정" description="서명 항목 및 필드 지정" />
            <Step title="링크 설정" description="유효기간, 접근암호, 책임자 승인 설정" />
        </Steps>
        </StepStyle>
    );

};

export default StepLinkWrite;