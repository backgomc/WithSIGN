import { createSlice } from '@reduxjs/toolkit';

export const AssignSlice = createSlice({
  name: 'assign',
  initialState: {
    signees: [],
    observers: [],
    documentFile: null,
    attachFiles: [],
    documentTempPath: null,
    documentTitle: null,
    template: null,
    templateTitle: null,
    documentType: "PC",
    templateType: null,
    sendType: "G",  // G:일반, B:벌크방식, L:링크서명, default: G
    orderType: "A", // A: 동차, S: 순차, default: A
    hasRequester: false,
    isWithPDF: false 
  },
  reducers: {
    addSignee: (state, action) => {
      state.signees = [...state.signees, { key: action.payload.key, name: action.payload.name, JOB_TITLE: action.payload.JOB_TITLE, DEPART_NAME:action.payload.DEPART_NAME, order:action.payload.order } ];
    },
    setSignees: (state, action) => {
      state.signees = action.payload;
    },
    resetSignee: (state, action) => {
      console.log('resetSignee');
      state.signees = [];
    },
    setObservers: (state, action) => {
      state.observers = action.payload;
    },
    setDocumentFile: (state, action) => {
      state.documentFile = action.payload;
    },
    resetDocumentFile: (state, action) => {
      state.documentFile = null;
    },
    setAttachFiles: (state, action) => {
      state.attachFiles = action.payload;
    },
    resetAttachFiles: (state, action) => {
      state.attachFiles = [];
    },
    setDocumentTempPath: (state, action) => {
      state.documentTempPath = action.payload;
    },
    resetDocumentTempPath: (state, action) => {
      state.documentTempPath = null;
    },
    setDocumentTitle: (state, action) => {
      state.documentTitle = action.payload;
    },
    resetDocumentTitle: (state, action) => {
      state.documentTitle = null;
    },
    setTemplate: (state, action) => {
      state.template = action.payload;
    },
    resetTemplate: (state, action) => {
      state.template = null;
    },
    setTemplateTitle: (state, action) => {
      state.templateTitle = action.payload;
    },
    resetTemplateTitle: (state, action) => {
      state.templateTitle = null;
    },
    setDocumentType: (state, action) => {
      state.documentType = action.payload;
    },
    resetDocumentType: (state, action) => {
      state.documentType = null;
    },
    setTemplateType: (state, action) => {
      state.templateType = action.payload;
    },
    resetTemplateType: (state, action) => {
      state.templateType = null;
    },
    resetOrderType: (state, action) => {
      state.orderType = null;
    },
    setSendType: (state, action) => {
      state.sendType = action.payload;
    },
    setOrderType: (state, action) => {
      state.orderType = action.payload;
    },
    setHasRequester: (state, action) => {
      state.hasRequester = action.payload;
    },
    setIsWithPDF: (state, action) => {
      state.isWithPDF = action.payload;
    },
    resetAssignAll: (state, action) => {
      state.documentType = null;
      state.documentFile = null;
      state.documentTempPath = null;
      state.documentTitle = null;
      state.template = null;
      state.templateTitle = null;
      state.templateType = null;
      state.signees = [];
      state.sendType = null;
      state.orderType = null;
      state.attachFiles = [];
      state.hasRequester = null;
      state.observers = [];
      state.isWithPDF = false;
    },
  },
});

export const { addSignee, setSignees, resetSignee, setObservers, setDocumentFile, resetDocumentFile, setDocumentTitle, resetDocumentTitle, setTemplate, resetTemplate, setTemplateTitle, resetTemplateTitle, setDocumentType, resetDocumentType, setTemplateType, resetTemplateType, setSendType, resetAssignAll, setDocumentTempPath, resetDocumentTempPath, setAttachFiles, resetAttachFiles, setHasRequester, setIsWithPDF } = AssignSlice.actions;

export const selectAssignees = state => state.assign.signees;
export const selectObservers = state => state.assign.observers;
export const selectDocumentFile = state => state.assign.documentFile;
export const selectAttachFiles = state => state.assign.attachFiles;
export const selectDocumentTempPath = state => state.assign.documentTempPath;
export const selectDocumentTitle = state => state.assign.documentTitle;
export const selectTemplate = state => state.assign.template;
export const selectTemplateTitle = state => state.assign.templateTitle;
export const selectDocumentType = state => state.assign.documentType;
export const selectTemplateType = state => state.assign.templateType;
export const selectSendType = state => state.assign.sendType;
export const selectOrderType = state => state.assign.orderType;
export const selectHasRequester = state => state.assign.hasRequester;
export const selectIsWithPDF = state => state.assign.isWithPDF;


export default AssignSlice.reducer;
