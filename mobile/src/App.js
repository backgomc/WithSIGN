import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Router, navigate } from '@reach/router'
import axios from 'axios'
import Login from './components/Login/Login'
import SignDocument from './components/SignDocument/SignDocument'
import ViewDocument from './components/ViewDocument/ViewDocument'
import { setDocToSign } from './components/SignDocument/SignDocumentSlice'
import { setDocToView } from './components/ViewDocument/ViewDocumentSlice'
import ResultPage from './common/ResultPage'
import { setUser, selectUser } from './app/infoSlice'
import LogoText from './assets/images/logo_withsign.png'
import { useIntl } from "react-intl"
import { DOCUMENT_SIGNED } from './common/Constants';
import './App.css'


function App() {
  console.log('[App.js] App() START')

  const { formatMessage } = useIntl()
  const dispatch = useDispatch()
  const rqUrl = window.location.href.split('?')[1]
  const param = new URLSearchParams(rqUrl)
  const docId = param.get('docId') ?? localStorage.getItem('__docId__')
  const reqID = param.get('userid')
  console.log('docId : '+ docId)

  const user = useSelector(selectUser)
  const [validCheck, setValidCheck] = useState(false)

  const checkUser = () => {
    //사용자 체크
    console.log('[checkUser] - Start');
    axios.get('/api/users/auth').then(response => {
      if (response.data.success) {
        console.log('[checkUser] response.data.user : ', response.data.user)
        pageSwitch(response.data.user)
      } else {
        console.log('response.data : ', response.data)

        //위드 접속 확인
        axios.post('/api/users/withAuth', { reqID : reqID }).then(response => {
          if (response.data.success) {
            pageSwitch(response.data.user)
          } else {
            dispatch(setUser(null));
            navigate('/login',{ state : { dId : docId}})
          }
        }).catch(function (error) {
          console.log(error)
          setUser(null)
          navigate('/ResultPage',{ state : { status : 'error',
                                            mainTitle : formatMessage({id: 'm.view.err'}),
                                            msg : ('[' + error.response.status + '] ' + error.message),
                                            subMsg : ('with auth err') }})
        })
      }
    }).catch(function (error) {
      console.log(error)
      setUser(null)
      navigate('/ResultPage',{ state : { status : 'error',
                                        mainTitle : formatMessage({id: 'm.view.err'}),
                                        msg : ('[' + error.response.status + '] ' + error.message),
                                        subMsg : ('auth err') }})
    })
  }


  const pageSwitch = ( user ) => {
    console.log('[pageSwitch] - Start');
    axios.post('/api/document/document', { docId : docId }).then(function (response) {
      console.log('[PageSwitch] document user : ' + user)
      if (response.data.success) {
        if (response.data.document.canceled === true){
          setValidCheck(false)
          navigate('/ResultPage',{ state : { status : '403',
                                            mainTitle : formatMessage({id: 'm.view.err'}),
                                            msg : formatMessage({id: 'm.view.err.canceled'}),
                                            subMsg : ('UID[' + user._id + '] DocID[' + docId + ']') }})
        } else if (response.data.document.deleted === true){
          setValidCheck(false)
          navigate('/ResultPage',{ state : { status : '403',
                                            mainTitle : formatMessage({id: 'm.view.err'}),
                                            msg : formatMessage({id: 'm.view.err.deleted'}),
                                            subMsg : ('UID[' + user._id + '] DocID[' + docId + ']') }})
        } else if (response.data.document.users.includes(user._id)){
          if ( response.data.document.signed == false && 
               !response.data.document.signedBy.includes(user._id) && (
               (response.data.document.orderType == 'A' ) ||
               (response.data.document.orderType == 'S' && response.data.document.usersTodo.includes(user._id))
              )){
            const docRef = response.data.document.docRef
            const docType = response.data.document.docType
            const docUser = response.data.document.user
            const observers = response.data.document.observers
            const orderType = response.data.document.orderType
            const usersTodo = response.data.document.usersTodo
            const usersOrder = response.data.document.usersOrder
            const attachFiles = null
            const items = response.data.document.items
            const isWithPDF = response.data.document.isWithPDF
            const docTitle = response.data.document.docTitle
            
            dispatch(setDocToSign({ docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder, attachFiles, items, isWithPDF, docTitle }))
            dispatch(setUser(user))
            setValidCheck(true)
            navigate('/signDocument')
          } else {
            const docRef = response.data.document.docRef
            const docType = response.data.document.docType
            const docTitle = response.data.document.docTitle
            const isWithPDF = response.data.document.user.isWithPDF
            const status = response.data.document.signed == true ? DOCUMENT_SIGNED : ''
            const attachFiles = null

            dispatch(setDocToView({ docRef, docId, status, docType, docTitle, isWithPDF, attachFiles}))
            dispatch(setUser(user))
            setValidCheck(true)
            navigate('/viewDocument')
          }
        } else {
          setValidCheck(false)
          navigate('/ResultPage',{ state : { status : '404',
                                            mainTitle : formatMessage({id: 'm.view.err'}),
                                            msg : formatMessage({id: 'm.view.err.fail'}),
                                            subMsg : ('UID[' + user._id + '] DocID[' + docId + ']') }})
        }
      } else {
        console.log('response.data.message : ' + response.data.message);
        setValidCheck(false)
        navigate('/ResultPage',{ state : { status : '404',
                                          mainTitle : formatMessage({id: 'm.view.err'}),
                                          msg : response.data.message,
                                          subMsg : ('UID[' + user._id + '] DocID[' + docId + ']') }})
      }
    })
    .catch(function (error) {
      console.log(error)
      setValidCheck(false)
      navigate('/ResultPage',{ state : { status : 'error',
                                        mainTitle : formatMessage({id: 'm.view.err'}),
                                        msg : ('[' + error.response.status + '] ' + error.message),
                                        subMsg : ('UID[' + user._id + '] DocID[' + docId + ']') }})
    })
  }

  useEffect(() => {
    console.log('[useEffect] - Start')
    checkUser()

  },[]);

  return user ? (
    <div className="App">
      <header className="App-title">
        <span>
          <img src={LogoText} alt='WithSign Logo'/>
        </span>
        <div className="svInfo" >
          {process.env.NODE_ENV==='development'? 'LOCAL' : window.location.port =='3004' ? '개발' : ''}
        </div>
        {/*<span> 
          process.env.NODE_ENV : {process.env.NODE_ENV} <br/>
        </span>*/}
      </header>
      <Router primary={false}>
        {validCheck ? ( <>
          <SignDocument path="/signDocument" />
          <ViewDocument path="/viewDocument" />
          <ResultPage path="/ResultPage" />
          </>) : (
          <ResultPage path="/ResultPage" />
         )}
      </Router>
    </div>
  ) : (
    <div>
      <Router primary={false}>
        <ResultPage path="/ResultPage" />
        <Login path="/login" />
      </Router>
    </div>
  )

}

export default App
