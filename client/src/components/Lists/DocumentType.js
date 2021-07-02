import React from 'react'
import { Badge, Tag } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';

export const DOCUMENT_SIGNED = "서명 완료";
export const DOCUMENT_TOSIGN = "서명 필요";
export const DOCUMENT_SIGNING = "서명 대기";
export const DOCUMENT_CANCELED = "서명 취소됨";

export function DocumentType(props) {

    let { uid, document } = props

    if (document["signed"] == true) { 
        return DOCUMENT_SIGNED;
    } else {
        if (document["canceled"] == true) {
          return DOCUMENT_CANCELED;
        } else {
            // if (document["users"].includes(uid) && !document["signedBy"].includes(uid)) {
            // if (document["users"].some(e => e._id === uid) && !document["signedBy"].includes(uid)) {
              if (document["users"].some(e => e._id === uid) && !document["signedBy"].some(e => e.user === uid)) {
              return DOCUMENT_TOSIGN;
            } else {
              return DOCUMENT_SIGNING;
            }
        }
    }

}

export function DocumentTypeText(props) {

    let { uid, document } = props

    if (document["signed"] == true) { 
        return (
          <Tag icon={<CheckCircleOutlined />} color="default">
            {DOCUMENT_SIGNED}
          </Tag>
        )
    } else {
        if (document["canceled"] == true) {
          return (
            <Tag icon={<CloseCircleOutlined />} color="error">
            {DOCUMENT_CANCELED}
           </Tag>
          )
        } else {
            // if (document["users"].some(e => e._id === uid) && !document["signedBy"].includes(uid)) {
              if (document["users"].some(e => e._id === uid) && !document["signedBy"].some(e => e.user === uid)) {
                return (
                  <Tag icon={<SyncOutlined spin />} color="processing">
                  {DOCUMENT_TOSIGN}
                 </Tag>
                )
            } else {
              return (
                <Tag icon={<ClockCircleOutlined />} color="success">
                {DOCUMENT_SIGNING}
               </Tag>
              )
            }
        }
    }

}
