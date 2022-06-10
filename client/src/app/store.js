import { configureStore } from '@reduxjs/toolkit';
import infoReducer from './infoSlice';
import langReducer from './langSlice';
import AssignReducer from '../components/Assign/AssignSlice';
import AssignTemplateReducer from '../components/PrepareTemplate/AssignTemplateSlice';
import DirectReducer from '../components/SignDirect/DirectSlice';
import SignDocumentReducer from '../components/SignDocument/SignDocumentSlice';
import ViewDocumentReducer from '../components/ViewDocument/ViewDocumentSlice';
import MenuSliceReducer from '../config/MenuSlice';

export default configureStore({
  reducer: {
    assign: AssignReducer,
    assignTemplate: AssignTemplateReducer,
    signDoc: SignDocumentReducer,
    viewDoc: ViewDocumentReducer,
    info: infoReducer,
    lang: langReducer,
    menu: MenuSliceReducer,
    directDoc: DirectReducer
  },
});
