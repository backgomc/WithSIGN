import { configureStore } from '@reduxjs/toolkit';
import infoReducer from './infoSlice';
import langReducer from './langSlice';

export default configureStore({
  reducer: {
    info: infoReducer,
    lang: langReducer
  },
});
