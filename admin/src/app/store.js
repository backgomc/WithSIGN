import { configureStore } from '@reduxjs/toolkit';
import infoReducer from './infoSlice';
import langReducer from './langSlice';
import MenuSliceReducer from '../config/MenuSlice';

export default configureStore({
  reducer: {
    info: infoReducer,
    lang: langReducer,
    menu: MenuSliceReducer
  },
});
