// client/src/components/Link/LinkSignDocument.js
// 완성된 링크서명 문서 화면

import React, { useState, useEffect, useRef } from 'react';
import { useParams, navigate } from '@reach/router';
import { 
  Button, 
  message, 
  Typography, 
  Spin,
  Modal,
  Space
} from 'antd';
import { 
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/ko';
import PDFViewer from "@niceharu/withpdf";
import SignaturePad from 'react-signature-canvas';
import { CheckCard } from '@ant-design/pro-card';
import { v4 as uuidv4 } from 'uuid';
import loadash from 'lodash';
import {TYPE_SIGN, TYPE_TEXT, AUTO_NAME, AUTO_DATE} from '../../common/Constants';

const { Title, Text } = Typography;

const LinkSignDocument = (props) => {
  const { linkId } = useParams();
  
  // 링크에서 전달된 정보 (LinkAccess에서 인증 완료 후)
  const linkInfo = props.location?.state?.linkInfo;
  const verified = props.location?.state?.verified;
  const signerName = props.location?.state?.signerName || '';
  const signerPhone = props.location?.state?.signerPhone || '';

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [disableComplete, setDisableComplete] = useState(true);

  // 서명 관련 상태
  const [signModal, setSignModal] = useState(false);
  const [webViewInstance, setWebViewInstance] = useState(null);

  // PDF 뷰어 ref
  const pdfRef = useRef();
  const sigCanvas = useRef({});

  useEffect(() => {
    // 인증되지 않은 경우 접속 화면으로 리다이렉트
    if (!verified || !linkInfo) {
      message.warning('먼저 링크 인증을 완료해주세요.');
      navigate(`/sign/link/${linkId}`);
      return;
    }

    loadDocumentData();
  }, [linkId, verified, linkInfo]);

  // 링크서명 문서 데이터 로드
  const loadDocumentData = async () => {
    try {
      setLoading(true);

      // 실제 API 호출로 문서 데이터 가져오기
      const response = await axios.post('/api/link/getSignDocument', {
        linkId: linkId
      });

      if (response.data.success) {
        const documentData = response.data.document;
        setDocumentData(documentData);
        
        // PDF 뷰어 초기화
        setTimeout(() => {
          initializePDFViewer(documentData);
        }, 100);
      } else {
        throw new Error(response.data.message || '문서를 불러올 수 없습니다.');
      }
      
    } catch (error) {
      console.error('문서 로드 오류:', error);
      message.error('문서 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // PDF 뷰어 초기화
  const initializePDFViewer = async (document) => {
    try {
      if (pdfRef.current) {
        console.log('PDF 뷰어 초기화 시작:', document);
        
        if (document.docRef) {
            console.log('PDF 로드:', document.docRef);
            // 루트 기준 상대경로로 변환
            const rootPath = `/${document.docRef}`;
            console.log('PDF 루트 경로:', rootPath);
            await pdfRef.current.uploadPDF(rootPath);
        }
        
        // 서명 항목들 전처리 및 로드
        if (document.items && document.items.length > 0) {
          console.log('서명 항목 전처리 시작:', document.items);
          
          let newItems = loadash.cloneDeep(document.items);
          
          // 외부 사용자용 서명 항목 전처리
          let processedItems = newItems.map(item => {
            if (item.uid === 'bulk') {
              // 서명 항목 설정
              if (item.type === TYPE_SIGN) {
                item.movable = true;
                item.resizable = true;
                item.required = true;
              } else {
                item.movable = false;
                item.resizable = false;
                item.disableOptions = true;
              }

              // 자동 입력 필드 처리
              if (item.autoInput) {
                if (item.autoInput === AUTO_NAME) {
                  item.lines = [signerName]; // 본인인증에서 받은 이름
                } else if (item.autoInput === AUTO_DATE) {
                  item.lines = [moment().format('YYYY년 MM월 DD일')];
                }
              }
            } else {
              // 다른 uid의 항목들은 숨김 처리
              item.disable = true;
              item.borderColor = 'transparent';
              item.hidden = true;
            }
            return item;
          });

          await pdfRef.current.importItems(processedItems);
          console.log('서명 항목 로드 완료');
        }

        // 서명 목록 초기화 (외부 사용자는 빈 목록)
        pdfRef.current.setSigns([]);
      }
    } catch (error) {
      console.error('PDF 뷰어 초기화 오류:', error);
      message.error('문서 뷰어 초기화에 실패했습니다.');
    }
  };

  // 서명 항목 변경 시 호출 - 수정됨
  const handleItemChanged = (action, item, validation) => {
    console.log('🔥 서명 항목 변경:', action, item, 'validation:', validation);
    
    // ✅ validation 값이 있으면 즉시 버튼 상태 업데이트
    if (typeof validation === 'boolean') {
      console.log('🎯 validation 값으로 버튼 상태 업데이트:', validation);
      setDisableComplete(!validation);
    }
  };

  // 유효성 검사 변경 시 호출 - 로그 추가
  const handleValidationChanged = (validation) => {
    console.log('🔥 유효성 검사 결과 (onValidationChanged):', validation);
    setDisableComplete(!validation);
  };

  // 수동 유효성 검사 함수 - 더 상세한 로그 추가
  const manualValidationCheck = async () => {
    try {
      if (pdfRef.current) {
        const items = await pdfRef.current.exportItems();
        
        console.log('🔍 전체 항목들:', items);
        
        // ✅ 모든 입력 필드 타입 포함 (서명란 타입 추가)
        const inputFields = items.filter(item => {
          const validTypes = ['SIGN', 'sign', 'TEXT', 'text', 'dropdown', 'checkbox'];
          const hasValidType = validTypes.includes(item.type) || validTypes.includes(item.subType);
          
          console.log(`필드 ${item.id}: type="${item.type}", subType="${item.subType}", 유효=${hasValidType}`);
          
          return hasValidType;
        });
        
        console.log('🔍 입력 필드들:', inputFields);
        
        // 각 필드의 값 확인 (서명란의 경우 다른 속성 확인)
        const fieldStatus = inputFields.map(item => {
          let value = '';
          let isEmpty = true;
          
          // 필드 타입별로 값 확인 방식 다름
          if (item.type === 'SIGN' || item.subType === 'SIGN') {
            // 서명란: value 또는 signatureData 확인
            value = item.value || item.signatureData || item.signature || '';
            isEmpty = !value;
          } else if (item.type === 'checkbox') {
            // 체크박스: checked 상태 확인
            value = item.checked ? 'checked' : '';
            isEmpty = !item.checked;
          } else {
            // 텍스트, 드롭다운: value 또는 text 확인
            value = item.value || item.text || '';
            isEmpty = !value;
          }
          
          return {
            id: item.id,
            type: item.type || item.subType,
            value: value,
            isEmpty: isEmpty
          };
        });
        
        console.log('🔍 수동 검증 - 필드 상태:', fieldStatus);
        
        // 비어있는 필수 필드가 있는지 확인
        const emptyFields = fieldStatus.filter(field => field.isEmpty);
        const isValid = emptyFields.length === 0 && inputFields.length > 0;
        
        console.log('🔍 수동 검증 결과:', {
          총필드수: inputFields.length,
          비어있는필드수: emptyFields.length,
          비어있는필드들: emptyFields.map(f => f.id),
          최종유효성: isValid
        });
        
        setDisableComplete(!isValid);
        
        return isValid;
      }
    } catch (error) {
      console.error('수동 유효성 검사 오류:', error);
      return false;
    }
  };
  
  // ✅ 디버깅용 - 버튼 클릭으로 수동 검증
  const debugValidation = async () => {
    console.log('🐛 디버그 검증 시작');
    const result = await manualValidationCheck();
    console.log('🐛 디버그 검증 완료:', result);
  };

  // 서명 모달 관련 함수들
  const clear = () => {
    sigCanvas.current.clear();
    let chkObj = document.getElementsByClassName('ant-pro-checkcard-checked');
    if (chkObj && chkObj[0]) chkObj[0].click();
  };

  const handleSignOk = async () => {
    if (!sigCanvas.current.isEmpty() && webViewInstance) {
      const { Core, UI } = webViewInstance;
      const { documentViewer } = Core;
      const signatureTool = documentViewer.getTool('AnnotationCreateSignature');
      await signatureTool.setSignature(sigCanvas.current.toDataURL('image/png'));
      signatureTool.addSignature();
      UI.disableElements(['signatureModal', 'toolbarGroup-Insert']);
    }
    setSignModal(false);
    clear();
  };

  const handleSignCancel = () => {
    setSignModal(false);
    clear();
  };

  // 서명 완료 처리
  const completeSign = async () => {
    try {
      setSigningLoading(true);

      // PDF에서 최종 서명 데이터 추출
      let signedItems = [];
      if (pdfRef.current) {
        signedItems = await pdfRef.current.exportItems();
        
        // 모든 필수 서명이 완료되었는지 검사
        const hasEmptySignature = signedItems.some(item => 
          item.subType === TYPE_SIGN && item.uid === 'bulk' && (!item.payload || item.payload === '')
        );
        
        if (hasEmptySignature) {
          message.warning('모든 서명 항목을 완료해주세요.');
          setSigningLoading(false);
          return;
        }
      }

      // 서명 완료 API 호출 (본인인증에서 받은 정보 사용)
      const response = await axios.post('/api/link/completeSign', {
        linkId: linkId,
        signerName: signerName,
        signerPhone: signerPhone,
        signedItems: signedItems
      });

      if (response.data.success) {
        message.success('서명이 완료되었습니다!');
        
        // 완료 메시지 표시 후 창 닫기 안내
        setTimeout(() => {
          Modal.success({
            title: '서명 완료',
            content: (
              <div>
                <p>서명이 성공적으로 완료되었습니다.</p>
                <p>서명자: {signerName}</p>
                <p>연락처: {signerPhone}</p>
                <p>완료 시간: {moment().format('YYYY년 MM월 DD일 HH:mm')}</p>
              </div>
            ),
            onOk: () => {
              window.close();
            }
          });
        }, 1000);
      } else {
        throw new Error(response.data.message || '서명 완료에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('서명 완료 오류:', error);
      message.error('서명 완료 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSigningLoading(false);
    }
  };

  // 로딩 화면
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f5f5f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, fontSize: '16px' }}>
          문서를 불러오고 있습니다...
        </div>
      </div>
    );
  }

  // 메인 서명 화면
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fff'
    }}>
      {/* 상단 헤더 */}
      <div style={{ 
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff', fontSize: '20px' }} />
          <Title level={4} style={{ margin: 0, color: '#262626' }}>
            {documentData?.linkTitle || documentData?.docTitle || '링크 서명'}
          </Title>
        </div>
        
        <Space>
          <div style={{ marginRight: '16px', color: '#666' }}>
            서명자: <strong>{signerName}</strong>
          </div>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            disabled={disableComplete}
            loading={signingLoading}
            onClick={completeSign}
          >
            서명 완료
          </Button>
          <Button onClick={debugValidation}>디버그 검증</Button>
        </Space>
      </div>

      {/* 안내 메시지 */}
      <div style={{ 
        padding: '12px 24px', 
        backgroundColor: '#f6f8fa', 
        borderBottom: '1px solid #e8e8e8'
      }}>
        <Text style={{ color: '#666' }}>
          💡 문서의 서명 필드를 클릭하여 서명을 입력해주세요. 
          모든 필수 서명이 완료되면 "서명 완료" 버튼이 활성화됩니다.
        </Text>
      </div>

      {/* PDF 뷰어 영역 */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        background: '#f5f5f5'
      }}>
        {documentData ? (
          <div style={{ height: '100%', padding: '0' }}>
            <PDFViewer 
              ref={pdfRef} 
              isUpload={false} 
              isSave={false} 
              isEditing={false}
              onReady={(instance) => setWebViewInstance(instance)}
              onItemChanged={handleItemChanged}
              onValidationChanged={handleValidationChanged}
              defaultScale={1.0}
              headerSpace={0}
              style={{ height: '100%' }}
            />
          </div>
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#8c8c8c'
          }}>
            <FileTextOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
            <Title level={4} type="secondary">문서를 불러오는 중...</Title>
          </div>
        )}
      </div>

      {/* 서명 입력 모달 */}
      <Modal
        visible={signModal}
        width={450}
        title="서명 입력"
        onOk={handleSignOk}
        onCancel={handleSignCancel}
        footer={[
          <Button key="clear" onClick={clear}>
            지우기
          </Button>,
          <Button key="submit" type="primary" loading={signingLoading} onClick={handleSignOk}>
            확인
          </Button>
        ]}
        bodyStyle={{padding: '0px 24px'}}
      >
        {/* 직접 서명 그리기 영역 */}
        <div style={{padding: '20px 0px'}}>
          <SignaturePad 
            penColor='black' 
            ref={sigCanvas} 
            canvasProps={{
              className: 'signCanvas',
              style: {
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                width: '100%',
                height: '200px'
              }
            }} 
          />
          <div style={{
            position: 'relative',
            top: '-120px',
            textAlign: 'center',
            pointerEvents: 'none',
            color: '#bfbfbf',
            fontSize: '16px'
          }}>
            여기에 서명해주세요
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LinkSignDocument;