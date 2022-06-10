import { createSlice } from '@reduxjs/toolkit';

export const DirectSlice = createSlice({
  name: 'directDoc',
  initialState: {
    signees: [],
    observers: [],
    directTitle: null,
    direct: null,
    attachFiles: [],
    directTempPath: null
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
    setAttachFiles: (state, action) => {
      state.attachFiles = action.payload;
    },
    resetAttachFiles: (state, action) => {
      state.attachFiles = [];
    },
    setDirectTempPath: (state, action) => {
      state.directTempPath = action.payload;
    },
    resetDirectTempPath: (state, action) => {
      state.directTempPath = null;
    },
    setDirectTitle: (state, action) => {
      state.documentTitle = action.payload;
    },
    resetDirectTitle: (state, action) => {
      state.documentTitle = null;
    },
    setDirect: (state, action) => {
      state.direct = action.payload;
    },
    resetDirect: (state, action) => {
      state.direct = null;
    },
    resetDirectAll: (state, action) => {
      state.signees = [];
      state.observers = [];
      state.directTitle = null;
      state.direct = null;
      state.attachFiles = [];
      state.directTempPath = null;
    },
  },
});

export const { addSignee, setSignees, resetSignee, setObservers, setAttachFiles, resetAttachFiles, setDirectTempPath, resetDirectTempPath, setDirectTitle, resetDirectTitle, setDirect, resetDirect, resetDirectAll } = DirectSlice.actions;

export const selectAssignees = state => state.directDoc.signees;
export const selectObservers = state => state.directDoc.observers;
export const selectDirectTitle = state => state.directDoc.directTitle;
export const selectDirect = state => state.directDoc.direct;
export const selectAttachFiles = state => state.directDoc.attachFiles;
export const selectDirectTempPath = state => state.directDoc.directTempPath;

export default DirectSlice.reducer;
