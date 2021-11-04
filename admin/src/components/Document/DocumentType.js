import React from 'react'
import { Badge, Tag } from 'antd';
import { CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, CloseCircleTwoTone, ClockCircleTwoTone } from '@ant-design/icons';

export const DOCUMENT_SIGNED = '서명 완료';
export const DOCUMENT_SIGNING = '서명 진행';
export const DOCUMENT_CANCELED = '서명 취소';

export function DocumentType(props) {

  let document = props;
  
  if (document['signed']) { 
    return DOCUMENT_SIGNED;
  } else {
    if (document['canceled']) {
      return DOCUMENT_CANCELED;
    } else {
      return DOCUMENT_SIGNING;
    }
  }
}

export function DocumentTypeText(props) {

  let document = props;

  if (document['signed']) { 
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        {DOCUMENT_SIGNED}
      </Tag>
    );
  } else {
    if (document['canceled']) {
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          {DOCUMENT_CANCELED}
        </Tag>
      );
    } else {
      return (
        <Tag icon={<SyncOutlined spin />} color="default">
          {DOCUMENT_SIGNING}
        </Tag>
      );
    }
  }
}

export function DocumentTypeBadge(props) {

  let document = props;

  if (document['signed']) { 
    return (
      <b><Badge status="success" text={DOCUMENT_SIGNED} /></b>
    );
  } else {
    if (document['canceled']) {
      return (
        <b><Badge status="error" text={DOCUMENT_CANCELED} /></b>
      );
    } else {
      return (
        <b><Badge status="default" text={DOCUMENT_SIGNING} /></b>
      );
    }
  }
}

export function DocumentTypeIcon(props) {

  let document = props;

  if (document['signed']) { 
    return (
      <CheckCircleOutlined twoToneColor='#52c41a'/>
    );
  } else {
    if (document['canceled']) {
      return (
        <CloseCircleTwoTone twoToneColor='#d41c1c'/>
      );
    } else {
      return (
        <ClockCircleTwoTone />
      );
    }
  }
}
