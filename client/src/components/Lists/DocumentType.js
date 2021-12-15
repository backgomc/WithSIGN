import React from 'react'
import { Badge, Tag } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
  EditOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  EditTwoTone,
  ClockCircleTwoTone
} from '@ant-design/icons';

import {DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM} from '../../common/Constants';

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
              // return (document["observers"] && document["observers"].includes(uid)) ? DOCUMENT_TOCONFIRM : DOCUMENT_TOSIGN;
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
          <Tag icon={<CheckCircleOutlined />} color="success">
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
                  <Tag icon={<EditOutlined />} color="processing">
                  {DOCUMENT_TOSIGN}
                 </Tag>
                )
            } else {
              return (
                <Tag icon={<SyncOutlined />} color="default">
                {DOCUMENT_SIGNING}
               </Tag>
              )
            }
        }
    }
}

export function DocumentTypeBadge(props) {

  let { uid, document } = props

  if (document["signed"] == true) { 
      return (
        <b><Badge status="success" text={DOCUMENT_SIGNED} /></b> 
      )
  } else {
      if (document["canceled"] == true) {
        return (
          <b><Badge status="error" text={DOCUMENT_CANCELED} /></b>
        )
      } else {
          // if (document["users"].some(e => e._id === uid) && !document["signedBy"].includes(uid)) {
            if (document["users"].some(e => e._id === uid) && !document["signedBy"].some(e => e.user === uid)) {
              return (
                <b><Badge status="processing" text={(document["observers"] && document["observers"].includes(uid)) ? DOCUMENT_TOCONFIRM : DOCUMENT_TOSIGN} /></b>
                // {(row["observers"] && row["observers"].includes(_id) ? '확인' : '서명')}
              )
          } else {
            return (
              <b><Badge status="default" text={DOCUMENT_SIGNING} /></b>
            )
          }
      }
  }
}

export function DocumentTypeIcon(props) {

  let { uid, document } = props

  if (document["signed"] == true) { 
      return (
        <CheckCircleTwoTone twoToneColor="#87d068"/>
      )
  } else {
      if (document["canceled"] == true) {
        return (
          <CloseCircleTwoTone twoToneColor="#d41c1c"/>
        )
      } else {
          // if (document["users"].some(e => e._id === uid) && !document["signedBy"].includes(uid)) {
            if (document["users"].some(e => e._id === uid) && !document["signedBy"].some(e => e.user === uid)) {
              return (
                <EditTwoTone/>
              )
          } else {
            return (
              <ClockCircleTwoTone twoToneColor="#cbcbcb" />
            )
          }
      }
  }

}
