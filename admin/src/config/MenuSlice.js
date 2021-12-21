import { createSlice } from '@reduxjs/toolkit';

export const MenuSlice = createSlice({
    name: 'menu',
    initialState: {
        pathname: '/'
    },
    reducers: {
        setPathname: (state, action) => {
            state.pathname = action.payload;
        }
    },
});
  
export const { setPathname } = MenuSlice.actions;

export const selectPathname = state => state.menu.pathname;

export default MenuSlice.reducer;
  