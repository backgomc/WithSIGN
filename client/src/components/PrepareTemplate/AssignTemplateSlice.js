import { createSlice } from '@reduxjs/toolkit';

export const AssignTemplateSlice = createSlice({
  name: 'assignTemplate',
  initialState: {
    signees: [],
    observers: [],
    templateId: '',
    templateRef: '',
    templateFileName: '',
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
      state.signees = [];
    },
    setObservers: (state, action) => {
      state.observers = action.payload;
    },
    resetObservers: (state, action) => {
      state.observers = [];
    },
    setTemplateInfo: (state, action) => {
      state.templateId = action.payload._id;
      if ((action.payload.signees && action.payload.signees.length > 0) || action.payload.hasRequester) {
        state.templateRef = action.payload.customRef;
      } else {
        state.templateRef = action.payload.docRef;
      }
      var path = action.payload.docRef;
      state.templateFileName = path.substring(path.lastIndexOf('/')+1, path.lastIndexOf('.')) + '_CUSTOM.pdf';
    },
    setIsWithPDF: (state, action) => {
      state.isWithPDF = action.payload;
    },
    resetIsWithPDF: (state, action) => {
      state.isWithPDF = false;
    },
    resetAssignAll: (state, action) => {
      state.signees = [];
      state.observers = [];
      state.templateId = null;
      state.templateRef = null;
      state.isWithPDF = false;
    }
  }
});

export const { addSignee, setSignees, resetSignee, setObservers, resetObservers, setTemplateInfo, setIsWithPDF, resetIsWithPDF, resetAssignAll } = AssignTemplateSlice.actions;

export const selectSignees = state => state.assignTemplate.signees;
export const selectObservers = state => state.assignTemplate.observers;
export const selectTemplateId = state => state.assignTemplate.templateId;
export const selectTemplateRef = state => state.assignTemplate.templateRef;
export const selectTemplateFileName = state => state.assignTemplate.templateFileName;
export const selectIsWithPDF = state => state.assignTemplate.isWithPDF;

export default AssignTemplateSlice.reducer;
