import { createSlice } from '@reduxjs/toolkit';

export const AssignTemplateSlice = createSlice({
  name: 'assignTemplate',
  initialState: {
    signees: [],
    templateId: '',
    templateRef: '',
    templateFileName: ''
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
    setTemplateInfo: (state, action) => {
      state.templateId = action.payload._id;
      if (action.payload.signees && action.payload.signees.length > 0) {
        state.templateRef = action.payload.customRef;
      } else {
        state.templateRef = action.payload.docRef;
      }
      var path = action.payload.docRef;
      state.templateFileName = path.substring(path.lastIndexOf('/')+1, path.lastIndexOf('.')) + '_CUSTOM.pdf';
    },
    resetAssignAll: (state, action) => {
      state.signees = [];
      state.templateId = null;
      state.templateRef = null;
    }
  }
});

export const { addSignee, setSignees, resetSignee, setTemplateInfo, resetAssignAll } = AssignTemplateSlice.actions;

export const selectAssignees = state => state.assignTemplate.signees;
export const selectTemplateId = state => state.assignTemplate.templateId;
export const selectTemplateRef = state => state.assignTemplate.templateRef;
export const selectTemplateFileName = state => state.assignTemplate.templateFileName;

export default AssignTemplateSlice.reducer;
