import { createSlice } from '@reduxjs/toolkit';

export const AssignSlice = createSlice({
  name: 'assign',
  initialState: {
    signees: [],
    documentFile: null,
    documentTitle: null,
    template: null,
    templateTitle: null,
    documentType: "PC"
  },
  reducers: {
    addSignee: (state, action) => {
      state.signees = [...state.signees, { key: action.payload.key, name: action.payload.name, email: action.payload.email } ];
    },
    resetSignee: (state, action) => {
      console.log('resetSignee');
      state.signees = [];
    },
    setDocumentFile: (state, action) => {
      state.documentFile = action.payload;
    },
    resetDocumentFile: (state, action) => {
      state.documentFile = null;
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
    resetAssignAll: (state, action) => {
      state.documentType = null;
      state.documentFile = null;
      state.documentTitle = null;
      state.template = null;
      state.templateTitle = null;
    },
  },
});

export const { addSignee, resetSignee, setDocumentFile, resetDocumentFile, setDocumentTitle, resetDocumentTitle, setTemplate, resetTemplate, setTemplateTitle, resetTemplateTitle, setDocumentType, resetDocumentType, resetAssignAll } = AssignSlice.actions;

export const selectAssignees = state => state.assign.signees;
export const selectDocumentFile = state => state.assign.documentFile;
export const selectDocumentTitle = state => state.assign.documentTitle;
export const selectTemplate = state => state.assign.template;
export const selectTemplateTitle = state => state.assign.templateTitle;
export const selectDocumentType = state => state.assign.documentType;

export default AssignSlice.reducer;
