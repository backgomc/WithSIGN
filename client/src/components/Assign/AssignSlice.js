import { createSlice } from '@reduxjs/toolkit';

export const AssignSlice = createSlice({
  name: 'assign',
  initialState: {
    signees: [],
    documentFile: null,
    documentTitle: null
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
    }
  },
});

export const { addSignee, resetSignee, setDocumentFile, resetDocumentFile, setDocumentTitle, resetDocumentTitle } = AssignSlice.actions;

export const selectAssignees = state => state.assign.signees;
export const selectDocumentFile = state => state.assign.documentFile;
export const selectDocumentTitle = state => state.assign.documentTitle;

export default AssignSlice.reducer;
