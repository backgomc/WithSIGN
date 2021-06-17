import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Table, Text, Spinner } from 'gestalt';
import 'gestalt/dist/gestalt.css';
import { useDispatch, useSelector } from 'react-redux';
// import { searchForDocumentToSign } from '../../firebase/firebase';
// import { selectUser } from '../../firebase/firebaseSlice';
import { selectUser } from '../../app/infoSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import { navigate } from '@reach/router';

const SignList = () => {
  const user = useSelector(selectUser);
  const { email } = user;

  const [docs, setDocs] = useState([]);
  const [show, setShow] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {

    // setTimeout(1000)
    
    let param = {
      email: email
    }

    axios.post('/api/document/searchForDocumentToSign', param).then(response => {

      console.log(response)
      if (response.data.success) {
        const docsToSign = response.data.documents;
        setDocs(docsToSign);
        setShow(false);

      } else {
          alert(response.data.error)
      }

    });

    // async function getDocs() {
    //   const docsToSign = await searchForDocumentToSign(email);
    //   setDocs(docsToSign);
    //   setShow(false);
    // }

    // setTimeout(getDocs, 1000);
  }, [email]);

  return (
    <div>
      {show ? (
        <Spinner show={show} accessibilityLabel="spinner" />
      ) : (
        <div>
          {docs.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>
                    <Text weight="bold">From</Text>
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    <Text weight="bold">When</Text>
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {docs.map(doc => (
                  <Table.Row key={doc.docRef}>
                    <Table.Cell>
                      <Text>{doc.email}</Text>
                    </Table.Cell>
                    <Table.Cell>
                    <Text>{doc.requestedTime ? new Date(doc.requestedTime).toDateString() : ''}</Text>
                      {/* <Text>{doc.requestedTime ? new Date(doc.requestedTime.seconds*1000).toDateString() : ''}</Text> */}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        onClick={event => {
                          // const { docRef, docId } = doc;
                          const { docRef, _id } = doc;
                          const docId = _id;
                          // dispatch(setDocToSign({ docRef, docId }));
                          dispatch(setDocToSign({ docRef, docId }));
                          navigate(`/signDocument`);
                        }}
                        text="Sign"
                        color="blue"
                        inline
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            'You do not have any documents to sign'
          )}
        </div>
      )}
    </div>
  );
};

export default SignList;
