import React from 'react'

export const DOCUMENT_SIGNED = "서명 완료";
export const DOCUMENT_TOSIGN = "서명 필요";
export const DOCUMENT_SIGNING = "서명 진행중";
export const DOCUMENT_CANCELED = "서명 취소됨";

export function DocumentType(props) {

    let { uid, document } = props

    if (document["signed"] == true) { 
        return DOCUMENT_SIGNED;
    } else {
        if (document["canceled"] == true) {
          return DOCUMENT_CANCELED;
        } else {
            if (document["users"].includes(uid) && !document["signedBy"].includes(uid)) {
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
        return (<font color='gray'>{DOCUMENT_SIGNED}</font>);
    } else {
        if (document["canceled"] == true) {
          return (<font color='red'>{DOCUMENT_CANCELED}</font>);
        } else {
            if (document["users"].includes(uid) && !document["signedBy"].includes(uid)) {
              return (<font color='blue'>{DOCUMENT_TOSIGN}</font>);
            } else {
              return (<font color='green'>{DOCUMENT_SIGNING}</font>);
            }
        }
    }

}
