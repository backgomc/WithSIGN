import React, { useEffect } from 'react';
import { Router } from '@reach/router';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

import AssignUsers from './components/AssignUsers';
import SignIn from './components/SignIn/SignIn';
import SignUp from './components/SignUp/SignUp';
import Preparation from './components/Preparation';
import Sign from './components/Sign';
import View from './components/View';
import Header from './components/Header';
import PasswordReset from './components/PasswordReset/PasswordReset';
import Welcome from './components/Welcome';

import Test from './components/Test/Test';
import Landing from './components/Landing/Landing';
import Login from './components/Login/Login';
import Register from './components/Register/Register';

import { auth, generateUserDocument } from './firebase/firebase';
// import { setUser, selectUser } from './firebase/firebaseSlice';
import { setUser, selectUser } from './app/infoSlice';

import './App.css';

const App = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  useEffect(() => {

    console.log('App called')

    axios.get('/api/users/auth').then(response => {

      console.log(response)

      if (!response.data.isAuth) {
          // if (option) {
          //     props.history.push('/login')
          // }
          dispatch(setUser(null));
      } else {
          //로그인 한 상태 
          // if (adminRoute && !response.data.isAdmin) {
          //     props.history.push('/')
          // } else {
          //     if (option === false)
          //         props.history.push('/')
          // }
          dispatch(setUser(response.data));
      }

    });


    // auth.onAuthStateChanged(async userAuth => {
    //   if (userAuth) {
    //     const user = await generateUserDocument(userAuth);
    //     const { uid, displayName, email, photoURL } = user;
    //     dispatch(setUser({ uid, displayName, email, photoURL }));
    //   }
    // });
  }, []);

  return user ? (
    <div>
      <Router>
        <Welcome path="/" />
        <Landing path="/landing" />
        <AssignUsers path="/assignUsers" />
        <Preparation path="/prepareDocument" />
        <Sign path="/signDocument" />
        <View path="/viewDocument" />
        <Test path="/test" />
      </Router>
    </div>
  ) : (
    <div>
      <Header />
      <Router>
        <Login path="/" />
        {/* <SignIn path="/" /> */}
        <SignUp path="signUp" />
        <Register path="register" />
        <PasswordReset path="passwordReset" />
      </Router>
    </div>
  );
};

export default App;
