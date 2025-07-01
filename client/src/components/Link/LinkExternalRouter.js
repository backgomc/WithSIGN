// client/src/components/Link/LinkExternalRouter.js
// 외부 서명자용 라우터 (예외 처리 포함)

import React from 'react';
import { Router } from '@reach/router';
import { Result, Button } from 'antd';
import { FileSearchOutlined, HomeOutlined } from '@ant-design/icons';
import LinkAccess from './LinkAccess';
import LinkSignDocument from './LinkSignDocument';

// 404 에러 페이지 컴포넌트
const LinkNotFound = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '40px', 
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <Result
          icon={<FileSearchOutlined style={{ color: '#1890ff' }} />}
          title="잘못된 링크입니다"
          subTitle="요청하신 서명 링크를 찾을 수 없습니다. 링크를 다시 확인해주세요."
          extra={
            <div>
              <p style={{ color: '#8c8c8c', fontSize: '14px', marginBottom: '20px' }}>
                • 링크가 만료되었을 수 있습니다<br/>
                • 링크 주소가 올바르지 않을 수 있습니다<br/>
                • 서명 요청자에게 새로운 링크를 요청해주세요
              </p>
              <Button 
                type="primary" 
                icon={<HomeOutlined />}
                onClick={() => window.close()}
                size="large"
              >
                창 닫기
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};

// 잘못된 서명 문서 경로 처리
const SignDocumentError = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
    }}>
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '40px', 
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <Result
          status="error"
          title="서명 문서에 접근할 수 없습니다"
          subTitle="먼저 링크 인증을 완료해주세요."
          extra={
            <Button 
              type="primary" 
              onClick={() => window.history.back()}
              size="large"
            >
              이전으로 돌아가기
            </Button>
          }
        />
      </div>
    </div>
  );
};

const LinkExternalRouter = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      backgroundColor: '#fff'
    }}>
      <Router primary={false}>
        {/* 정상적인 링크 접속 */}
        <LinkAccess path="/sign/link/:linkId" />
        <LinkSignDocument path="/sign-document/:linkId" />
        
        {/* 예외 처리 */}
        <SignDocumentError path="/sign-document" />  {/* linkId 없는 경우 */}
        <LinkNotFound path="/sign/link" />           {/* linkId 없는 경우 */}
        <LinkNotFound path="/sign" />                {/* 잘못된 경로 */}
        <LinkNotFound default />                     {/* 기타 모든 경우 */}
      </Router>
    </div>
  );
};

export default LinkExternalRouter;